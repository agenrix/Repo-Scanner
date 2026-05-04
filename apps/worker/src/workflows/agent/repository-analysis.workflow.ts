import { generateText, Output } from "ai";
import Sandbox from "e2b";
import { eventType, NonRetriableError, staticSchema } from "inngest";
import z from "zod";
import { google } from "~/ai/provider/google.provider.ai";
import { RepositoryAnalysisSkill } from "~/ai/skills/repository-analysis.skill.ai";
import { OPENCODE_CONFIG } from "~/constants/opencode-config.constants";
import { env } from "~/infrastructure/config/env.config.infrastructure";
import { generalLogger } from "~/infrastructure/logger/pino.logger.infrastructure";
import { zGithubRepository } from "~/infrastructure/validation/atoms/github.atom.validation";
import { inngestClient } from "~/infrastructure/workflows/inngest.workflows.infrastructure";

type IAnalyzeRepositoryEventParams = {
  repository: string;
};

type JsonLineCapture = {
  buffer: string;
};

type OpencodeEvent = {
  type: string;
  sessionID?: string;
  part?: {
    text?: string;
    tool?: string;
    reason?: string;
    cost?: number;
    tokens?: {
      total: number;
      input: number;
      output: number;
      reasoning?: number;
    };
  };
};

function captureJsonLines(
  capture: JsonLineCapture,
  data: string,
  onLine: (line: string) => void,
) {
  capture.buffer += data;

  const lines = capture.buffer.split("\n");
  capture.buffer = lines.pop() ?? "";

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      continue;
    }

    try {
      JSON.parse(trimmedLine);
      onLine(trimmedLine);
    } catch {
      // OpenCode can emit non-JSON setup output before the event stream starts.
    }
  }
}

function finalizeJsonLines(
  capture: JsonLineCapture,
  onLine: (line: string) => void,
) {
  const trailingLine = capture.buffer.trim();

  if (!trailingLine) {
    return;
  }

  try {
    JSON.parse(trailingLine);
    onLine(trailingLine);
  } catch {
    // Ignore trailing non-JSON output.
  }
}

function getTextPart(line: string) {
  const event = JSON.parse(line) as OpencodeEvent;

  if (event.type === "text" && event.part?.text) {
    return event.part.text;
  }

  return null;
}

function getGithubRepositoryMetadata(repository: string) {
  const url = new URL(repository);
  const [owner, repoSegment] = url.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/");
  const repoName = repoSegment?.replace(/\.git$/, "");

  if (!owner || !repoName) {
    throw new NonRetriableError("Invalid github repository url");
  }

  return {
    repoId: `${owner}/${repoName}`,
    repoName,
  };
}

export const analyzeRepositoryEvent = eventType("agent/analyze-repository", {
  schema: staticSchema<IAnalyzeRepositoryEventParams>(),
});

export const repositoryAnalysisWorkflow = inngestClient.createFunction(
  {
    id: "repository-analysis",
    triggers: analyzeRepositoryEvent,
  },
  async ({ event, step, attempt, maxAttempts }) => {
    try {
      const repository = await step.run("validate repository", async () => {
        const repositoryResult = zGithubRepository.safeParse(
          event.data.repository,
        );

        if (!repositoryResult.success) {
          throw new NonRetriableError(repositoryResult.error.message);
        }

        return repositoryResult.data;
      });

      const repositoryAnalysisSkill = new RepositoryAnalysisSkill();
      const repositoryMetadata = getGithubRepositoryMetadata(repository);
      const repositoryPath = "/home/user/repo";
      const skillPath = `${repositoryPath}/.opencode/skills/repository-analysis/SKILL.md`;
      const opencodeConfigPath = `${repositoryPath}/opencode.json`;

      const sandboxId = await step.run("create sandbox", async () => {
        generalLogger.info("Creating E2B sandbox...");

        const sandbox = await Sandbox.create("opencode", {
          envs: {
            GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
          },
          timeoutMs: 600_000,
          apiKey: env.E2B_API_KEY,
        });

        return sandbox.sandboxId;
      });

      await step.run("prepare sandbox repository", async () => {
        const sandbox = await Sandbox.connect(sandboxId);

        generalLogger.info(
          { path: repositoryPath },
          "Cloning repository into sandbox",
        );
        await sandbox.git.clone(repository, {
          path: repositoryPath,
          depth: 1,
        });

        generalLogger.info(
          { skillPath },
          "Writing repository analysis skill config",
        );
        await sandbox.files.write(
          skillPath,
          repositoryAnalysisSkill.skillMarkdown,
        );

        generalLogger.info({ opencodeConfigPath }, "Writing OpenCode config");
        await sandbox.files.write(opencodeConfigPath, OPENCODE_CONFIG);
      });

      const agentAnalysis = await step.run(
        "run repository analysis",
        async () => {
          const sandbox = await Sandbox.connect(sandboxId);
          const stdoutCapture: JsonLineCapture = { buffer: "" };
          const textParts: string[] = [];

          generalLogger.info(
            "Running OpenCode repository analysis skill with plan agent",
          );
          const result = await sandbox.commands.run(
            'opencode run --agent plan --format json "Load the repository-analysis skill and analyze this repository for AI agent implementation patterns using static analysis only. Follow the skill\'s output format exactly."',
            {
              cwd: repositoryPath,
              onStdout: (data) => {
                
                captureJsonLines(stdoutCapture, String(data), (line) => {
                  const text = getTextPart(line);

                  if (text) {
                    textParts.push(text);
                  }
                });
              },
              onStderr: (data) => {
                
              },
              timeoutMs: 600_000,
            },
          );

          if (result.exitCode !== 0) {
            throw new Error(
              result.stderr || result.error || "OpenCode run failed",
            );
          }

          finalizeJsonLines(stdoutCapture, (line) => {
            const text = getTextPart(line);

            if (text) {
              textParts.push(text);
            }
          });

          const rawAnalysis = textParts.join(" ").trim();

          if (!rawAnalysis) {
            throw new Error(
              "OpenCode completed without returning analysis text",
            );
          }

          return rawAnalysis;
        },
      );

      await step.run("kill the spawned sandbox", async () => {
        const killed = await Sandbox.kill(sandboxId);

        if (!killed) {
          generalLogger.warn({ sandboxId }, "Failed to kill sandbox");
        }

        return { killed };
      });

      const postAnalysisResult = await step.run(
        "perform post-analysis normalization",
        async () => {
          const zAgentAnalysisSchema = z.object({
            classification: z
              .enum(["AGENT", "POSSIBLE_AGENT", "NOT_AGENT"])
              .describe("Repository classification from the audit report."),
            confidence: z
              .enum(["high", "medium", "low"])
              .describe("Confidence level from the audit report."),
            agentName: z
              .string()
              .nullable()
              .describe(
                "Concise detected agent name. Use null when the report says None or the repository is NOT_AGENT.",
              ),
            agentDescription: z
              .string()
              .nullable()
              .describe(
                "One-sentence description of what the detected agent does. Use null when the report says None or the repository is NOT_AGENT.",
              ),
            signals: z
              .array(z.string())
              .nullable()
              .describe("Agent signals listed in the audit report."),
            evidenceFiles: z
              .array(z.string())
              .nullable()
              .describe("Repository-relative evidence file paths."),
            frameworks: z
              .array(z.string())
              .nullable()
              .describe("Frameworks detected in the audit report."),
            integrations: z
              .object({
                apis: z
                  .array(z.string())
                  .nullable()
                  .describe("External APIs mentioned by the report."),
                tools: z
                  .array(z.string())
                  .nullable()
                  .describe("Agent tools mentioned by the report."),
              })
              .nullable()
              .describe("APIs and tools mentioned by the audit report."),
            reasoning: z
              .string()
              .describe("Short reasoning paragraph from the audit report."),
          });

          const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: zAgentAnalysisSchema }),
            system:
              "Convert the provided repository analysis report into structured data. Preserve the original meaning, do not add new claims, use empty arrays when a list section is missing, and use null when agent name or description is None.",
            prompt: [
              "Parse this repository analysis report into the requested schema:",
              agentAnalysis || "",
            ].join("\n\n"),
          });

          return output;
        },
      );

      const webhookResult = await step.run("send-to-webhook", async () => {
        const backendPayload = {
          repo: {
            repo_id: repositoryMetadata.repoId,
            repo_name: repositoryMetadata.repoName,
            repo_link: repository,
            classification: postAnalysisResult.classification,
            confidence: postAnalysisResult.confidence,
            agent_signals: postAnalysisResult.signals ?? [],
            evidence_files: postAnalysisResult.evidenceFiles ?? [],
            frameworks_detected: postAnalysisResult.frameworks ?? [],
            reasoning: postAnalysisResult.reasoning,
          },
          ...(postAnalysisResult.classification !== "NOT_AGENT"
            ? {
                agent: {
                  agent_id: repositoryMetadata.repoId,
                  agent_name:
                    postAnalysisResult.agentName ?? repositoryMetadata.repoName,
                  agent_description:
                    postAnalysisResult.agentDescription ??
                    postAnalysisResult.reasoning,
                  owner: repositoryMetadata.repoId.split("/")[0],
                  contributors: [],
                  access_rights: {
                    files: [],
                    tools: postAnalysisResult.integrations?.tools ?? [],
                    data_nodes: [],
                    apis: postAnalysisResult.integrations?.apis ?? [],
                    servers: [],
                  },
                  integration_details: {
                    apis: postAnalysisResult.integrations?.apis ?? [],
                    tools: postAnalysisResult.integrations?.tools ?? [],
                    frameworks: postAnalysisResult.frameworks ?? [],
                  },
                },
              }
            : {}),
        };

        const response = await fetch(
          `${env.BACKEND_WEBHOOK_BASE_URL}/repo_scans`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(backendPayload),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}: ${await response.text()}`,
          );
        }

        return { input: await response.json(), output: backendPayload };
      });

      return {
        postAnalysis: postAnalysisResult,
        webhook: webhookResult,
      };
    } catch (error) {
      generalLogger.error(
        {
          message: "Failed to enrich lead",
          attempt,
          maxAttempts,
        },
        error instanceof Error ? error.message : "Something went wrong",
      );

      throw error;
    }
  },
);
