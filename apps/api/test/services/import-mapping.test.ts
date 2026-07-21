import { describe, expect, it } from "vitest";
import {
  applyOrgMapping,
  applyPersonMapping,
  autoDetectMapping,
  isKnownOrgTarget,
  isKnownPersonTarget,
  validateMappedOrg,
  validateMappedPerson,
} from "@/services/import-mapping.js";

const mapping = [
  { sourceField: "Name", targetField: "name", customFieldId: null },
  { sourceField: "Email", targetField: "email", customFieldId: null },
  { sourceField: "Company", targetField: "orgName", customFieldId: null },
];

const defaultOptions = { normalizeSubaddressing: false };

describe("mapping auto-detection", () => {
  it("matches common header spellings for people", () => {
    const detected = autoDetectMapping(
      ["Full Name", "Email Address", "Phone Number", "Job Title", "Company"],
      "person",
    );

    expect(detected.map((field) => field.targetField)).toEqual([
      "name",
      "email",
      "phone",
      "jobTitle",
      "orgName",
    ]);
  });

  it("leaves unrecognized headers unmapped instead of dropping them", () => {
    const detected = autoDetectMapping(["Email", "Favourite Colour"], "person");

    expect(detected).toEqual([
      { sourceField: "Email", targetField: "email", customFieldId: null },
      { sourceField: "Favourite Colour", targetField: null, customFieldId: null },
    ]);
  });

  it("gives a target to the first claiming header only", () => {
    const detected = autoDetectMapping(["Email", "Work Email"], "person");

    expect(detected[0]!.targetField).toBe("email");
    expect(detected[1]!.targetField).toBeNull();
  });

  it("uses a different alias table for organizations", () => {
    const detected = autoDetectMapping(["Company Name", "Website", "Headcount"], "org");

    expect(detected.map((field) => field.targetField)).toEqual(["name", "domain", "size"]);
  });
});

describe("person mapping", () => {
  it("normalizes mapped values and infers the org domain from a corporate address", () => {
    const mapped = applyPersonMapping(
      { Name: "  Dana   Reeves ", Email: "Dana@Northwind.EXAMPLE", Company: "Acme, Inc." },
      mapping,
      defaultOptions,
    );

    expect(mapped.name).toBe("Dana Reeves");
    expect(mapped.email).toBe("dana@northwind.example");
    expect(mapped.orgName).toBe("Acme, Inc.");
    expect(mapped.orgNormalizedName).toBe("acme");
    expect(mapped.orgDomain).toBe("northwind.example");
  });

  it("does not invent an org domain from a free mailbox provider", () => {
    const mapped = applyPersonMapping(
      { Name: "Fen Zhao", Email: "fen.zhao@gmail.com", Company: "" },
      mapping,
      defaultOptions,
    );

    expect(mapped.orgDomain).toBeNull();
    expect(mapped.orgName).toBeNull();
  });

  it("derives a name when the source has only an address", () => {
    const mapped = applyPersonMapping({ Email: "s.patel@brightline.example" }, mapping, defaultOptions);

    expect(mapped.name).toBe("S Patel");
  });

  it("rejects an invalid address rather than storing it", () => {
    const mapped = applyPersonMapping({ Name: "Dana", Email: "not-an-email" }, mapping, defaultOptions);

    expect(mapped.email).toBeNull();
    expect(mapped.normalizedEmail).toBeNull();
  });

  it("routes unmapped columns into custom fields", () => {
    const mapped = applyPersonMapping(
      { Region: "EMEA", Email: "dana@northwind.example" },
      [
        { sourceField: "Region", targetField: null, customFieldId: "field-1" },
        { sourceField: "Email", targetField: "email", customFieldId: null },
      ],
      defaultOptions,
    );

    expect(mapped.customFields).toEqual({ "field-1": "EMEA" });
  });

  it("coerces numeric and boolean cells and ignores blanks", () => {
    const mapped = applyPersonMapping(
      { Name: "Dana", Email: "dana@northwind.example", Phone: 4155550142, Blank: "   " },
      [
        ...mapping,
        { sourceField: "Phone", targetField: "phone", customFieldId: null },
        { sourceField: "Blank", targetField: "jobTitle", customFieldId: null },
      ],
      defaultOptions,
    );

    expect(mapped.phone).toBe("4155550142");
    expect(mapped.jobTitle).toBeNull();
  });

  it("parses a last-contacted date and ignores an unparseable one", () => {
    const dateMapping = [{ sourceField: "Last", targetField: "lastContactedAt", customFieldId: null }];

    expect(
      applyPersonMapping({ Last: "2026-06-02T10:15:00.000Z" }, dateMapping, defaultOptions)
        .lastContactedAt,
    ).toEqual(new Date("2026-06-02T10:15:00.000Z"));
    expect(
      applyPersonMapping({ Last: "not a date" }, dateMapping, defaultOptions).lastContactedAt,
    ).toBeNull();
  });
});

describe("org mapping", () => {
  it("normalizes name and domain", () => {
    const mapped = applyOrgMapping(
      { Company: "Acme Corporation", Website: "https://www.acme.com/about" },
      [
        { sourceField: "Company", targetField: "name", customFieldId: null },
        { sourceField: "Website", targetField: "domain", customFieldId: null },
      ],
    );

    expect(mapped.name).toBe("Acme Corporation");
    expect(mapped.normalizedName).toBe("acme");
    expect(mapped.domain).toBe("acme.com");
  });
});

describe("record validation", () => {
  it("accepts a record with either a name or an email", () => {
    const mapped = applyPersonMapping({ Name: "Dana" }, mapping, defaultOptions);

    expect(validateMappedPerson(mapped, { skipRecordsWithoutEmail: false }, null)).toEqual([]);
  });

  it("reports a malformed address using the original value", () => {
    const mapped = applyPersonMapping({ Name: "Dana", Email: "nope" }, mapping, defaultOptions);
    const errors = validateMappedPerson(mapped, { skipRecordsWithoutEmail: false }, "nope");

    expect(errors).toEqual([
      { field: "email", message: '"nope" is not a valid email address' },
    ]);
  });

  it("rejects a record with neither a name nor an address", () => {
    const mapped = applyPersonMapping({}, mapping, defaultOptions);

    expect(validateMappedPerson(mapped, { skipRecordsWithoutEmail: false }, null)).toEqual([
      { field: "name", message: "Record has neither a name nor an email address" },
    ]);
  });

  it("honours the skip-without-email option", () => {
    const mapped = applyPersonMapping({ Name: "Dana" }, mapping, defaultOptions);

    expect(validateMappedPerson(mapped, { skipRecordsWithoutEmail: true }, null)).toEqual([
      { field: "email", message: "Record has no email address" },
    ]);
  });

  it("rejects automated senders picked up by mailbox mining", () => {
    const mapped = applyPersonMapping(
      { Name: "Notifications", Email: "noreply@stripe.com" },
      mapping,
      defaultOptions,
    );

    expect(validateMappedPerson(mapped, { skipRecordsWithoutEmail: false }, "noreply@stripe.com")).toEqual([
      { field: "email", message: "Address belongs to an automated sender" },
    ]);
  });

  it("requires organizations to have a name", () => {
    expect(validateMappedOrg(applyOrgMapping({}, []))).toEqual([
      { field: "name", message: "Organization has no name" },
    ]);
    expect(
      validateMappedOrg(
        applyOrgMapping({ Company: "Acme" }, [
          { sourceField: "Company", targetField: "name", customFieldId: null },
        ]),
      ),
    ).toEqual([]);
  });

  it("recognizes known target fields", () => {
    expect(isKnownPersonTarget("email")).toBe(true);
    expect(isKnownPersonTarget("nope")).toBe(false);
    expect(isKnownOrgTarget("domain")).toBe(true);
    expect(isKnownOrgTarget("nope")).toBe(false);
  });
});
