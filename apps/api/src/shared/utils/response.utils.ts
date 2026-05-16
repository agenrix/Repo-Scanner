import z from "zod";
import type { IHttpContext } from "~/cmd/http/types";
import { HttpError, HttpErrorStatus, HttpStatus } from "../types/http.types";
import { validate } from "./zod.utils";

export const ResponseSchema = <TData extends z.ZodType = z.ZodNull>(args?: {
  data?: TData;
}) => {
  return z.discriminatedUnion("success", [
    z
      .object({
        success: z.literal(true),
        data: (args?.data ?? z.null()) as TData,
      })
      .strict(),
    z
      .object({
        success: z.literal(false),
        error: z
          .object({
            code: z.enum(HttpError),
            message: z.string(),
            detail: z.unknown().optional(),
          })
          .strict(),
      })
      .strict(),
  ]);
};

export type AnyResponseSchema = ReturnType<typeof ResponseSchema>;
type ResponseData<TResponseSchema extends AnyResponseSchema> = Extract<
  z.input<TResponseSchema>,
  { success: true }
>["data"];

export interface IResponseUtils<TResponseSchema extends AnyResponseSchema> {
  success(data: ResponseData<TResponseSchema>): Response;
  successCreated(data: ResponseData<TResponseSchema>): Response;
  unauthorized(message?: string): Response;
  unsuccessful(args: IUnsuccessfulResponse): Response;
  somethingWentWrong(message?: string): Response;
  redirect(url: URL): Response;
}

interface IUnsuccessfulResponse {
  code: HttpError;
  message: string;
  detail?: unknown;
}

export class ResponseUtils<TResponseSchema extends AnyResponseSchema>
  implements IResponseUtils<TResponseSchema>
{
  constructor(
    private readonly ctx: IHttpContext,
    private readonly responseSchema: TResponseSchema,
  ) {}

  success(data: ResponseData<TResponseSchema>): Response {
    const response = validate(this.responseSchema, {
      success: true,
      data,
    } as z.input<TResponseSchema>);

    return this.ctx.json(response, HttpStatus.OK);
  }

  successCreated(data: ResponseData<TResponseSchema>): Response {
    const response = validate(this.responseSchema, {
      success: true,
      data,
    } as z.input<TResponseSchema>);

    return this.ctx.json(response, HttpStatus.CREATED);
  }

  unsuccessful({ code, message, detail }: IUnsuccessfulResponse): Response {
    const response = validate(this.responseSchema, {
      success: false,
      error: { code, message, detail },
    } as z.input<TResponseSchema>);

    return this.ctx.json(response, HttpErrorStatus[code]);
  }

  unauthorized(message = "Authentication required"): Response {
    return this.unsuccessful({ code: HttpError.UNAUTHORIZED, message });
  }

  somethingWentWrong(message = "Something went wrong"): Response {
    const response = validate(this.responseSchema, {
      success: false,
      error: { code: HttpError.INTERNAL_SERVER_ERROR, message },
    } as z.input<TResponseSchema>);

    return this.ctx.json(response, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  redirect(url: URL): Response {
    return this.ctx.redirect(url);
  }
}
