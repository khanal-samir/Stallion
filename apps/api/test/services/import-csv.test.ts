import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/app-error.js";
import { parseCsv } from "@/services/import-csv.js";

describe("csv parsing", () => {
  it("parses headers and rows with trimming", () => {
    const parsed = parseCsv("Name, Email\nDana Reeves, dana@northwind.example\n");

    expect(parsed.headers).toEqual(["Name", "Email"]);
    expect(parsed.rows).toEqual([{ Name: "Dana Reeves", Email: "dana@northwind.example" }]);
  });

  it("handles quoted fields containing commas, newlines, and escaped quotes", () => {
    const parsed = parseCsv(
      'Name,Notes\n"Reeves, Dana","Said ""yes"" on the call\nFollow up Monday"\n',
    );

    expect(parsed.rows).toEqual([
      { Name: "Reeves, Dana", Notes: 'Said "yes" on the call\nFollow up Monday' },
    ]);
  });

  it("supports CRLF endings, a BOM, and a missing trailing newline", () => {
    const parsed = parseCsv("﻿Name,Email\r\nDana,dana@northwind.example");

    expect(parsed.headers).toEqual(["Name", "Email"]);
    expect(parsed.rows).toEqual([{ Name: "Dana", Email: "dana@northwind.example" }]);
  });

  it("skips blank rows and tolerates short rows", () => {
    const parsed = parseCsv("Name,Email\nDana\n\n   \nMarcus,marcus@lumen-labs.example\n");

    expect(parsed.rows).toEqual([
      { Name: "Dana", Email: "" },
      { Name: "Marcus", Email: "marcus@lumen-labs.example" },
    ]);
  });

  it("suffixes duplicate headers so every column stays addressable", () => {
    const parsed = parseCsv("Email,Email\na@x.example,b@x.example\n");

    expect(parsed.headers).toEqual(["Email", "Email (2)"]);
    expect(parsed.rows[0]).toEqual({ Email: "a@x.example", "Email (2)": "b@x.example" });
  });

  it("ignores unnamed columns rather than creating an empty key", () => {
    const parsed = parseCsv("Name,,Email\nDana,junk,dana@northwind.example\n");

    expect(parsed.headers).toEqual(["Name", "Email"]);
    expect(parsed.rows[0]).toEqual({ Name: "Dana", Email: "dana@northwind.example" });
  });

  it("rejects an empty file and a header-less file", () => {
    expect(() => parseCsv("")).toThrow(AppError);
    expect(() => parseCsv(",,\n")).toThrow(AppError);
  });
});
