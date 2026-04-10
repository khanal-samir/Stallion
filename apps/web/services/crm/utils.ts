import type { ApiSuccessResponse } from "@workspace/validators/types/auth";

type NullableParamValue = string | number | boolean | null | undefined;
type ParamRecord = Record<string, NullableParamValue>;

export function buildQueryParams<TParams extends ParamRecord>(params: TParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams;
}

export function cleanQueryParams<TParams extends ParamRecord>(params: TParams): Partial<TParams> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as Partial<TParams>;
}

export function unwrapApiResponse<TData>(response: ApiSuccessResponse<TData>): TData {
  return response.data;
}
