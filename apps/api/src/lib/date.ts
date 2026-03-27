export function toDate(value: string | Date | undefined) {
  if (value === undefined || value instanceof Date) {
    return value;
  }

  return new Date(value);
}
