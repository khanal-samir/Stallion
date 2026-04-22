export function formatColumnLabel(id: string) {
  return id
    .replace(/^_+/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .trim();
}

export function getColumnLabel(id: string, header: unknown) {
  if (typeof header === "string") {
    return header;
  }
  return formatColumnLabel(id);
}

export function getVisiblePageNumbers(
  pageIndex: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const current = pageIndex + 1;
  const pages: Array<number | "ellipsis"> = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < pageCount - 2) pages.push("ellipsis");

  pages.push(pageCount);
  return pages;
}
