import { Inngest } from "inngest";
import { env } from "~/infrastructure/config/env.config.infrastructure";

export const inngestClient = new Inngest({ id: "@agenrix/worker" });

type InngestApiResponse<T> = {
  data: T;
};

type InngestEvent = {
  id: string;
  name: string;
  data?: Record<string, unknown>;
  createdAt?: string;
};

type InngestRun = {
  runId: string;
  functionId: string;
  status: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
};

async function inngestFetch<T>(path: string) {
  if (!env.INNGEST_SIGNING_KEY) {
    throw new Error("INNGEST_SIGNING_KEY is not configured");
  }

  const response = await fetch(`${env.INNGEST_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${env.INNGEST_SIGNING_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Inngest API request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as InngestApiResponse<T>;
}

export const inngestSdk = {
  async getEvent(eventId: string) {
    if (env.INNGEST_DEV === 1) {
      const response = await inngestFetch<any>(`/v1/events/${eventId}`);
      return {
        data: {
          id: response.data.internal_id,
          name: response.data.name,
          data: response.data.data,
          createdAt: response.data.received_at,
        } as InngestEvent,
      };
    }
    return inngestFetch<InngestEvent>(`/v2/events/${eventId}`);
  },
  async getEventRuns(eventId: string) {
    if (env.INNGEST_DEV === 1) {
      const response = await inngestFetch<any[]>(`/v1/events/${eventId}/runs`);
      return {
        data: response.data.map((r: any) => ({
          runId: r.run_id,
          functionId: r.function_id,
          status: typeof r.status === "string" ? r.status.toLowerCase() : r.status,
          startedAt: r.run_started_at,
        } as InngestRun)),
      };
    }
    return inngestFetch<InngestRun[]>(`/v2/events/${eventId}/runs`);
  },
  async getRun(runId: string) {
    if (env.INNGEST_DEV === 1) {
      const response = await inngestFetch<any>(`/v1/runs/${runId}`);
      return {
        data: {
          runId: response.data.run_id,
          functionId: response.data.function_id,
          status: typeof response.data.status === "string" ? response.data.status.toLowerCase() : response.data.status,
          startedAt: response.data.run_started_at,
        } as InngestRun,
      };
    }
    return inngestFetch<InngestRun>(`/v2/runs/${runId}`);
  },
};
