export enum HttpMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
}

export enum HttpError {
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_GATEWAY = "BAD_GATEWAY",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  CONFLICT = "CONFLICT",
  FORBIDDEN = "FORBIDDEN",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

export const HttpErrorStatus = {
  [HttpError.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [HttpError.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [HttpError.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [HttpError.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [HttpError.CONFLICT]: HttpStatus.CONFLICT,
  [HttpError.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
  [HttpError.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [HttpError.BAD_GATEWAY]: HttpStatus.BAD_GATEWAY,
} as const satisfies Record<HttpError, number>;

export type IHttpResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: HttpError;
        message: string;
        detail?: unknown;
      };
    };
