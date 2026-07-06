import { faker } from "@faker-js/faker";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { formatColumnLabel, getColumnLabel, getVisiblePageNumbers } from "@/lib/data-table-utils";
import {
  isBetterAuthError,
  isHandledAppError,
  normalizeAppError,
  toBetterAuthError,
} from "@/lib/error";
import { getInitials, slugify } from "@/lib/utils";
import { cleanQueryParams } from "@/services/crm/utils";

describe("web utilities", () => {
  beforeEach(() => {
    faker.seed(20260706);
  });

  it("formats labels, slugs, and initials", () => {
    expect(formatColumnLabel("__lastContactedAt")).toBe("last Contacted At");
    expect(formatColumnLabel("owner-id")).toBe("owner id");
    expect(getColumnLabel("createdAt", "Created")).toBe("Created");
    expect(getColumnLabel("createdAt", null)).toBe("created At");
    expect(slugify("  Acmé  Sales -- Team! ")).toBe("acm-sales-team");
    expect(getInitials("Ada Lovelace Byron")).toBe("AL");
  });

  it("builds compact pagination ranges", () => {
    expect(getVisiblePageNumbers(0, 0)).toEqual([]);
    expect(getVisiblePageNumbers(0, 4)).toEqual([1, 2, 3, 4]);
    expect(getVisiblePageNumbers(0, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getVisiblePageNumbers(4, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(getVisiblePageNumbers(9, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("removes only empty query values", () => {
    expect(
      cleanQueryParams({
        search: "",
        ownerId: undefined,
        stage: null,
        page: 0,
        enabled: false,
        name: faker.company.name(),
      }),
    ).toEqual(expect.objectContaining({ page: 0, enabled: false }));
  });

  it("normalizes Better Auth and generic errors", () => {
    const fallback = faker.lorem.sentence();
    expect(isBetterAuthError(null)).toBe(false);
    expect(isBetterAuthError({})).toBe(false);
    expect(isBetterAuthError({ code: "INVALID" })).toBe(true);
    expect(toBetterAuthError(undefined, fallback)).toEqual({ message: fallback });
    expect(toBetterAuthError({ message: "specific", status: 400 }, fallback)).toEqual({
      message: "specific",
      status: 400,
    });
    expect(normalizeAppError({ status: 401, statusText: "Unauthorized" })).toEqual({
      code: undefined,
      message: "Please sign in again",
      status: 401,
    });
    expect(normalizeAppError(new Error("broken"))).toEqual({ message: "broken" });
    expect(normalizeAppError("broken")).toEqual({ message: "An unexpected error occurred" });
    expect(isHandledAppError(new Error("handled"))).toBe(true);
    expect(isHandledAppError(Symbol("unhandled"))).toBe(false);
  });

  it("normalizes API errors and friendly status messages", () => {
    const createAxiosError = (status: number, data: unknown) =>
      new AxiosError("network message", "ERR_BAD_RESPONSE", undefined, undefined, {
        status,
        statusText: "Error",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data,
      });

    expect(
      normalizeAppError(
        createAxiosError(403, {
          success: false,
          error: { message: "raw", details: "owner role required" },
        }),
      ),
    ).toEqual({
      details: "owner role required",
      message: "You don't have permission to do that",
      status: 403,
    });
    expect(normalizeAppError(createAxiosError(404, { message: "missing" })).message).toBe(
      "Resource not found",
    );
    expect(normalizeAppError(createAxiosError(500, {})).message).toBe(
      "Something went wrong. Please try again.",
    );
    expect(isBetterAuthError(createAxiosError(400, {}))).toBe(false);
    expect(isHandledAppError(createAxiosError(400, {}))).toBe(true);
  });
});
