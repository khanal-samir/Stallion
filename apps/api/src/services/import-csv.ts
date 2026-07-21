import { AppError } from "@/lib/app-error.js";
import { STATUS_CODES } from "@/constants/status-codes.js";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

/**
 * RFC 4180 parser. Written rather than pulled in as a dependency because the surface we
 * need is small and the pipeline requires it to be pure and fully testable.
 *
 * Handles quoted fields, escaped quotes (`""`), embedded newlines and commas, CRLF and LF
 * line endings, and a UTF-8 BOM. Does not handle alternate delimiters.
 */
export function parseCsv(content: string): ParsedCsv {
  const withoutBom = content.startsWith("﻿") ? content.slice(1) : content;
  const rows = parseRows(withoutBom);

  if (rows.length === 0) {
    throw new AppError("The uploaded file is empty", STATUS_CODES.UNPROCESSABLE_ENTITY);
  }

  const headers = dedupeHeaders(rows[0]!.map((header) => header.trim()));
  if (headers.every((header) => header === "")) {
    throw new AppError("The uploaded file has no header row", STATUS_CODES.UNPROCESSABLE_ENTITY);
  }

  const dataRows = rows.slice(1).filter((cells) => !isBlankRow(cells));
  const parsedRows = dataRows.map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header === "") return;
      row[header] = (cells[index] ?? "").trim();
    });
    return row;
  });

  return { headers: headers.filter((header) => header !== ""), rows: parsedRows };
}

function parseRows(content: string): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let value = "";
  let inQuotes = false;
  let index = 0;

  const endCell = () => {
    cells.push(value);
    value = "";
  };

  const endRow = () => {
    endCell();
    rows.push(cells);
    cells = [];
  };

  while (index < content.length) {
    const char = content[index]!;

    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          value += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      value += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ",") {
      endCell();
      index += 1;
      continue;
    }

    if (char === "\r" || char === "\n") {
      endRow();
      index += char === "\r" && content[index + 1] === "\n" ? 2 : 1;
      continue;
    }

    value += char;
    index += 1;
  }

  // A trailing newline produces no final row; anything else is a real last row.
  if (value !== "" || cells.length > 0) endRow();

  return rows;
}

function isBlankRow(cells: string[]) {
  return cells.every((cell) => cell.trim() === "");
}

/**
 * Spreadsheet exports frequently repeat a header. Suffixing keeps every column addressable
 * in the mapping UI instead of silently dropping all but the last.
 */
function dedupeHeaders(headers: string[]) {
  const seen = new Map<string, number>();

  return headers.map((header) => {
    if (header === "") return header;

    const count = seen.get(header) ?? 0;
    seen.set(header, count + 1);
    return count === 0 ? header : `${header} (${count + 1})`;
  });
}
