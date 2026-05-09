import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "~/lib/http/api.http";

type ApiResponse<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: ApiErrorBody;
    };

interface ApiErrorBody {
  code: string;
  message: string;
  detail?: unknown;
}

export class ApiResponseError extends Error {
  readonly code: string;
  readonly detail?: unknown;
  readonly status: number;

  constructor(error: ApiErrorBody, status: number) {
    super(error.message);
    this.name = "ApiResponseError";
    this.code = error.code;
    this.detail = error.detail;
    this.status = status;
  }
}

function replacePathParams(
  path: string,
  pathParams?: Record<string, string | number>,
) {
  return path
    .replace(/^\/+/, "")
    .replace(/:([A-Za-z0-9_]+)/g, (placeholder, key: string) => {
      const value = pathParams?.[key];

      return value === undefined
        ? placeholder
        : encodeURIComponent(String(value));
    });
}

async function parseApiResponse<TData>(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    throw new ApiResponseError(
      {
        code: "INVALID_RESPONSE",
        message: "Expected a JSON response but received an empty response",
      },
      response.status,
    );
  }

  try {
    return JSON.parse(responseText) as ApiResponse<TData>;
  } catch {
    throw new ApiResponseError(
      {
        code: "INVALID_RESPONSE",
        message: "Expected a JSON response but received an invalid response",
        detail: responseText,
      },
      response.status,
    );
  }
}

interface IGetHttpOptions {
  path: string;
  headers?: HeadersInit;
  pathParams?: Record<string, string | number>;
}

export function getHttpQueryKey(opts: IGetHttpOptions) {
  const url = replacePathParams(opts.path, opts.pathParams);
  const pathParamKeys = Object.entries(opts.pathParams ?? {})
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`);

  return [...url.split("/").filter(Boolean), ...pathParamKeys];
}

export async function getHttpHandler<TData>(opts: IGetHttpOptions) {
  const url = replacePathParams(opts.path, opts.pathParams);
  const response = await api.get(url, {
    headers: opts.headers,
    throwHttpErrors: false,
  });
  const responseJson = await parseApiResponse<TData>(response);

  if (!responseJson.success) {
    throw new ApiResponseError(responseJson.error, response.status);
  }

  return responseJson.data;
}

export function getHttpQueryOptions<TData>(opts: IGetHttpOptions) {
  return queryOptions({
    queryKey: getHttpQueryKey(opts),
    queryFn: () => getHttpHandler<TData>(opts),
  });
}

export const useGetHttp = <TData>(opts: IGetHttpOptions) => {
  return useQuery(getHttpQueryOptions<TData>(opts));
};
