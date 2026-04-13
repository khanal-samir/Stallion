type NullableParamValue = string | number | boolean | null | undefined;
type ParamRecord = Record<string, NullableParamValue>;

export function cleanQueryParams<TParams extends ParamRecord>(params: TParams): Partial<TParams> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ) as Partial<TParams>;
}
