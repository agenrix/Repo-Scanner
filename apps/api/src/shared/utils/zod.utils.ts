import type z from "zod";
import type { IResult } from "../types/result.types";

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");

      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export function validate<TSchema extends z.ZodType>(
  schema: TSchema,
  value: z.input<TSchema>,
): z.output<TSchema> {
  return schema.parse(value);
}
export function safeValidate<TSchema extends z.ZodType>(
  schema: TSchema,
  value: z.input<TSchema>,
): IResult<z.output<TSchema>> {
  const validationResult = schema.safeParse(value);

  if (!validationResult.success) {
    return {
      success: false,
      error: { message: formatZodIssues(validationResult.error) },
    };
  }

  return { success: true, data: validationResult.data };
}
