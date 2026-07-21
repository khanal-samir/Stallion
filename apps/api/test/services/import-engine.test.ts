import { describe, expect, it } from "vitest";
import {
  deriveNameFromEmail,
  deriveRecordFingerprint,
  fieldPolicy,
  getEmailDomain,
  getEmailLocalPart,
  isAutomatedEmail,
  isFreeEmailDomain,
  isValidEmail,
  normalizeDomain,
  normalizeEmail,
  normalizeEmailForMatching,
  normalizeLinkedinUrl,
  normalizeOrgName,
  normalizePersonName,
  normalizePhone,
  parseAddressList,
  resolveFieldValue,
  resolveOrgMatch,
  resolvePersonMatch,
  shouldSkipExistingRecord,
} from "@/services/import-engine.js";

describe("import engine email handling", () => {
  it("normalizes and validates addresses", () => {
    expect(normalizeEmail("  Dana@Northwind.EXAMPLE ")).toBe("dana@northwind.example");
    expect(isValidEmail("dana@northwind.example")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(getEmailDomain("dana@northwind.example")).toBe("northwind.example");
    expect(getEmailDomain("broken")).toBeNull();
    expect(getEmailLocalPart("dana@northwind.example")).toBe("dana");
  });

  it("recognizes automated senders so they never become CRM records", () => {
    expect(isAutomatedEmail("noreply@stripe.com")).toBe(true);
    expect(isAutomatedEmail("no-reply@stripe.com")).toBe(true);
    expect(isAutomatedEmail("bounces+tag@sendgrid.net")).toBe(true);
    expect(isAutomatedEmail("dana@northwind.example")).toBe(false);
    expect(isAutomatedEmail("broken")).toBe(false);
  });

  it("collapses subaddressing only for providers that treat it as equivalent", () => {
    expect(normalizeEmailForMatching("Da.Na+crm@gmail.com", true)).toBe("dana@gmail.com");
    // Off by default: some domains route dots and tags to distinct mailboxes.
    expect(normalizeEmailForMatching("da.na+crm@gmail.com", false)).toBe("da.na+crm@gmail.com");
    // Opting in must not rewrite addresses on domains that do not support it.
    expect(normalizeEmailForMatching("da.na+crm@northwind.example", true)).toBe(
      "da.na+crm@northwind.example",
    );
    expect(normalizeEmailForMatching("broken", true)).toBe("broken");
  });

  it("derives a readable name when a source supplies only an address", () => {
    expect(deriveNameFromEmail("dana.reeves@northwind.example")).toBe("Dana Reeves");
    expect(deriveNameFromEmail("s_patel+news@brightline.example")).toBe("S Patel");
    expect(deriveNameFromEmail("123@northwind.example")).toBeNull();
    expect(deriveNameFromEmail("broken")).toBeNull();
  });
});

describe("import engine domain and name normalization", () => {
  it("reduces urls and hostnames to a comparable domain", () => {
    expect(normalizeDomain("https://www.Acme.com/pricing?ref=x")).toBe("acme.com");
    expect(normalizeDomain("acme.com:8080")).toBe("acme.com");
    expect(normalizeDomain("dana@acme.com")).toBe("acme.com");
    expect(normalizeDomain("   ")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
  });

  it("refuses to treat a free mailbox provider as an organization domain", () => {
    // Otherwise every personal Gmail address would invent an org called "Gmail".
    expect(normalizeDomain("gmail.com")).toBeNull();
    expect(normalizeDomain("https://outlook.com")).toBeNull();
    expect(isFreeEmailDomain("proton.me")).toBe(true);
    expect(isFreeEmailDomain("northwind.example")).toBe(false);
    expect(isFreeEmailDomain(null)).toBe(false);
  });

  it("collapses legal suffixes and casing so one company resolves to one org", () => {
    expect(normalizeOrgName("Acme, Inc.")).toBe("acme");
    expect(normalizeOrgName("ACME")).toBe("acme");
    expect(normalizeOrgName("Acme Corporation")).toBe("acme");
    expect(normalizeOrgName("Bright Line LLC")).toBe("bright line");
    // A name that is only a suffix must survive rather than normalize to nothing.
    expect(normalizeOrgName("Inc")).toBe("inc");
    expect(normalizeOrgName("   ")).toBeNull();
    expect(normalizeOrgName("!!!")).toBeNull();
  });

  it("normalizes people names, phones, and linkedin urls", () => {
    expect(normalizePersonName("  Dana   Reeves ")).toBe("Dana Reeves");
    expect(normalizePhone("+1 (415) 555-0142")).toBe("+14155550142");
    expect(normalizePhone("415-555-0142")).toBe("4155550142");
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("  ")).toBeNull();
    expect(normalizeLinkedinUrl("linkedin.com/in/dana-reeves/")).toBe(
      "https://www.linkedin.com/in/dana-reeves",
    );
    expect(normalizeLinkedinUrl("https://LinkedIn.com/company/acme?trk=x")).toBe(
      "https://www.linkedin.com/company/acme",
    );
    expect(normalizeLinkedinUrl("https://twitter.com/dana")).toBeNull();
    expect(normalizeLinkedinUrl("  ")).toBeNull();
  });
});

describe("import engine address list parsing", () => {
  it("parses display names, bare addresses, and quoted names containing commas", () => {
    const parsed = parseAddressList(
      '"Reeves, Dana" <dana@northwind.example>, marcus@lumen-labs.example',
    );

    expect(parsed).toEqual([
      { name: "Reeves, Dana", email: "dana@northwind.example" },
      { name: null, email: "marcus@lumen-labs.example" },
    ]);
  });

  it("drops unparseable entries instead of producing junk records", () => {
    expect(parseAddressList("")).toEqual([]);
    expect(parseAddressList("not-an-address, , dana@northwind.example")).toEqual([
      { name: null, email: "dana@northwind.example" },
    ]);
  });
});

describe("import engine identity resolution", () => {
  const lookups = {
    byExternalId: new Map([["ext-1", "person-from-identity"]]),
    byEmail: new Map([["dana@northwind.example", "person-from-email"]]),
  };

  it("prefers external identity over email so a changed address still matches", () => {
    expect(
      resolvePersonMatch(
        { externalId: "ext-1", email: "new@northwind.example", normalizedEmail: "new@northwind.example" },
        lookups,
      ),
    ).toEqual({ personId: "person-from-identity", reason: "external_identity" });
  });

  it("falls back to email, then reports no match", () => {
    expect(
      resolvePersonMatch(
        { externalId: null, email: "dana@northwind.example", normalizedEmail: "dana@northwind.example" },
        lookups,
      ),
    ).toEqual({ personId: "person-from-email", reason: "email" });

    expect(
      resolvePersonMatch({ externalId: "unknown", email: null, normalizedEmail: null }, lookups),
    ).toEqual({ personId: null, reason: "none" });
  });

  it("matches organizations on domain before name", () => {
    const orgLookups = {
      byDomain: new Map([["acme.com", "org-by-domain"]]),
      byNormalizedName: new Map([["acme", "org-by-name"]]),
    };

    expect(resolveOrgMatch({ domain: "acme.com", normalizedName: "acme" }, orgLookups)).toEqual({
      orgId: "org-by-domain",
      reason: "domain",
    });
    expect(resolveOrgMatch({ domain: null, normalizedName: "acme" }, orgLookups)).toEqual({
      orgId: "org-by-name",
      reason: "name",
    });
    expect(resolveOrgMatch({ domain: null, normalizedName: null }, orgLookups)).toEqual({
      orgId: null,
      reason: "none",
    });
  });
});

describe("import engine record fingerprint", () => {
  const person = {
    name: "Dana Reeves",
    email: "dana@northwind.example",
    phone: null,
    orgName: "Acme",
  };

  it("is deterministic so a re-uploaded row resolves to the same identity", () => {
    // This is what stops an emailless CSV row from duplicating on every re-import: with no
    // real external id and a nullable-email unique constraint, the fingerprint is the only
    // stable handle the record has.
    expect(deriveRecordFingerprint(person)).toBe(deriveRecordFingerprint({ ...person }));
    expect(deriveRecordFingerprint(person)).toMatch(/^fp_[0-9a-f]{32}$/);
  });

  it("is insensitive to name and org casing but sensitive to identity changes", () => {
    expect(deriveRecordFingerprint(person)).toBe(
      deriveRecordFingerprint({ ...person, name: "DANA REEVES", orgName: "ACME" }),
    );
    expect(deriveRecordFingerprint(person)).not.toBe(
      deriveRecordFingerprint({ ...person, email: "dana@elsewhere.example" }),
    );
    expect(deriveRecordFingerprint(person)).not.toBe(
      deriveRecordFingerprint({ ...person, phone: "+14155550142" }),
    );
  });

  it("distinguishes an absent field from an empty one without collision", () => {
    const withOrg = deriveRecordFingerprint({ name: "A", email: null, phone: null, orgName: "X" });
    const withName = deriveRecordFingerprint({ name: "AX", email: null, phone: null, orgName: null });

    // A naive concatenation would let "A"+"X" collide with "AX"+""; the delimiter prevents it.
    expect(withOrg).not.toBe(withName);
  });
});

describe("import engine conflict policy", () => {
  it("never overwrites with an empty incoming value", () => {
    expect(resolveFieldValue("Existing", null, "source_wins")).toBe("Existing");
    expect(resolveFieldValue("Existing", "", "source_wins")).toBe("Existing");
    expect(resolveFieldValue("Existing", undefined, "fill_empty")).toBe("Existing");
  });

  it("distinguishes source_wins from fill_empty", () => {
    expect(resolveFieldValue("Existing", "Incoming", "source_wins")).toBe("Incoming");
    expect(resolveFieldValue("Existing", "Incoming", "fill_empty")).toBe("Existing");
    expect(resolveFieldValue(null, "Incoming", "fill_empty")).toBe("Incoming");
    expect(resolveFieldValue("", "Incoming", "fill_empty")).toBe("Incoming");
  });

  it("treats crm_wins as a record-level skip rather than a field rule", () => {
    // Collapsing it into a field rule would make it identical to fill_empty.
    expect(shouldSkipExistingRecord("crm_wins")).toBe(true);
    expect(shouldSkipExistingRecord("fill_empty")).toBe(false);
    expect(shouldSkipExistingRecord("source_wins")).toBe(false);

    expect(fieldPolicy("crm_wins")).toBe("fill_empty");
    expect(fieldPolicy("fill_empty")).toBe("fill_empty");
    expect(fieldPolicy("source_wins")).toBe("source_wins");
  });
});
