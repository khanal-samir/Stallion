export const VALIDATION_TARGET = {
  FORM: "form",
  JSON: "json",
  QUERY: "query",
  PARAM: "param",
} as const;

export type ValidationTarget = (typeof VALIDATION_TARGET)[keyof typeof VALIDATION_TARGET];
