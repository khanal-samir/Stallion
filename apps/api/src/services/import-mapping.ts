import type { ImportFieldMapping, ImportJobOptions } from "@workspace/validators/schemas/import";
import type {
  ImportEntityType,
  ImportOrgTargetField,
  ImportPersonTargetField,
} from "@workspace/validators/types/import";
import {
  IMPORT_ORG_TARGET_FIELD_VALUES,
  IMPORT_PERSON_TARGET_FIELD_VALUES,
} from "@workspace/validators/types/import";
import type { ImportRecordError } from "@/db/schema/import.schema.js";
import {
  deriveNameFromEmail,
  getEmailDomain,
  isAutomatedEmail,
  isValidEmail,
  normalizeDomain,
  normalizeEmail,
  normalizeEmailForMatching,
  normalizeLinkedinUrl,
  normalizeOrgName,
  normalizePersonName,
  normalizePhone,
} from "@/services/import-engine.js";

/**
 * Header aliases for mapping auto-detection. Keys are the normalized source header,
 * values the CRM target. Detection is a convenience — the user always confirms in review.
 */
const PERSON_FIELD_ALIASES: Record<string, ImportPersonTargetField> = {
  name: "name",
  fullname: "name",
  full_name: "name",
  contactname: "name",
  person: "name",
  email: "email",
  emailaddress: "email",
  email_address: "email",
  workemail: "email",
  primaryemail: "email",
  mail: "email",
  phone: "phone",
  phonenumber: "phone",
  phone_number: "phone",
  mobile: "phone",
  telephone: "phone",
  tel: "phone",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  title: "jobTitle",
  role: "jobTitle",
  position: "jobTitle",
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  linkedinprofile: "linkedinUrl",
  company: "orgName",
  companyname: "orgName",
  company_name: "orgName",
  organization: "orgName",
  organisation: "orgName",
  account: "orgName",
  employer: "orgName",
  domain: "orgDomain",
  website: "orgDomain",
  companydomain: "orgDomain",
  companywebsite: "orgDomain",
  status: "status",
  stage: "status",
  lastcontacted: "lastContactedAt",
  last_contacted: "lastContactedAt",
  lastcontactedat: "lastContactedAt",
};

const ORG_FIELD_ALIASES: Record<string, ImportOrgTargetField> = {
  name: "name",
  companyname: "name",
  company_name: "name",
  company: "name",
  organization: "name",
  account: "name",
  domain: "domain",
  website: "domain",
  url: "domain",
  industry: "industry",
  sector: "industry",
  size: "size",
  employees: "size",
  headcount: "size",
  companysize: "size",
  location: "location",
  city: "location",
  country: "location",
  address: "location",
};

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[\s\-.]/g, "");
}

/**
 * Best-effort header matching so a well-formed CSV needs no manual mapping. Unmatched
 * headers are returned with a null target rather than dropped, so they stay visible in the
 * review step and can be routed to a custom field.
 */
export function autoDetectMapping(
  sourceFields: string[],
  entityType: ImportEntityType,
): ImportFieldMapping[] {
  const aliases = entityType === "org" ? ORG_FIELD_ALIASES : PERSON_FIELD_ALIASES;
  const claimed = new Set<string>();

  return sourceFields.map((sourceField) => {
    const normalized = normalizeHeader(sourceField);
    const underscored = normalized.replace(/_/g, "");
    const target = aliases[normalized] ?? aliases[underscored];

    // First header to claim a target wins; later duplicates stay unmapped.
    if (!target || claimed.has(target)) {
      return { sourceField, targetField: null, customFieldId: null };
    }

    claimed.add(target);
    return { sourceField, targetField: target, customFieldId: null };
  });
}

export type MappedPerson = {
  name: string | null;
  email: string | null;
  normalizedEmail: string | null;
  phone: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  status: string | null;
  orgName: string | null;
  orgNormalizedName: string | null;
  orgDomain: string | null;
  lastContactedAt: Date | null;
  customFields: Record<string, unknown>;
};

export type MappedOrg = {
  name: string | null;
  normalizedName: string | null;
  domain: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  customFields: Record<string, unknown>;
};

function readString(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() === "" ? null : value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function toDateOrNull(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function collectTargets(raw: Record<string, unknown>, mapping: ImportFieldMapping[]) {
  const targets = new Map<string, string>();
  const customFields: Record<string, unknown> = {};

  for (const field of mapping) {
    const value = readString(raw, field.sourceField);
    if (value === null) continue;

    if (field.customFieldId) {
      customFields[field.customFieldId] = value;
      continue;
    }
    if (field.targetField && !targets.has(field.targetField)) {
      targets.set(field.targetField, value);
    }
  }

  return { targets, customFields };
}

export function applyPersonMapping(
  raw: Record<string, unknown>,
  mapping: ImportFieldMapping[],
  options: Pick<ImportJobOptions, "normalizeSubaddressing">,
): MappedPerson {
  const { targets, customFields } = collectTargets(raw, mapping);

  const rawEmail = targets.get("email");
  const email = rawEmail && isValidEmail(rawEmail) ? normalizeEmail(rawEmail) : null;

  const rawName = targets.get("name");
  const name = rawName
    ? normalizePersonName(rawName)
    : email
      ? deriveNameFromEmail(email)
      : null;

  const orgNameValue = targets.get("orgName") ?? null;
  const orgDomainValue = targets.get("orgDomain") ?? null;

  // Falling back to the email domain only works for corporate mailboxes; normalizeDomain
  // returns null for free providers so personal addresses never invent an org.
  const orgDomain = orgDomainValue
    ? normalizeDomain(orgDomainValue)
    : email
      ? normalizeDomain(getEmailDomain(email) ?? "")
      : null;

  return {
    name,
    email,
    normalizedEmail: email
      ? normalizeEmailForMatching(email, options.normalizeSubaddressing)
      : null,
    phone: targets.has("phone") ? normalizePhone(targets.get("phone")!) : null,
    jobTitle: targets.get("jobTitle") ?? null,
    linkedinUrl: targets.has("linkedinUrl")
      ? normalizeLinkedinUrl(targets.get("linkedinUrl")!)
      : null,
    status: targets.get("status") ?? null,
    orgName: orgNameValue ? normalizePersonName(orgNameValue) : null,
    orgNormalizedName: orgNameValue ? normalizeOrgName(orgNameValue) : null,
    orgDomain,
    lastContactedAt: toDateOrNull(targets.get("lastContactedAt") ?? null),
    customFields,
  };
}

export function applyOrgMapping(
  raw: Record<string, unknown>,
  mapping: ImportFieldMapping[],
): MappedOrg {
  const { targets, customFields } = collectTargets(raw, mapping);
  const nameValue = targets.get("name") ?? null;
  const domainValue = targets.get("domain") ?? null;

  return {
    name: nameValue ? normalizePersonName(nameValue) : null,
    normalizedName: nameValue ? normalizeOrgName(nameValue) : null,
    domain: domainValue ? normalizeDomain(domainValue) : null,
    industry: targets.get("industry") ?? null,
    size: targets.get("size") ?? null,
    location: targets.get("location") ?? null,
    customFields,
  };
}

/**
 * A record is invalid only when it cannot become a usable CRM row. Missing optional fields
 * are not errors — they are the normal case for mined sources.
 */
export function validateMappedPerson(
  person: MappedPerson,
  options: Pick<ImportJobOptions, "skipRecordsWithoutEmail">,
  rawEmail: string | null,
): ImportRecordError[] {
  const errors: ImportRecordError[] = [];

  if (rawEmail && !person.email) {
    errors.push({ field: "email", message: `"${rawEmail}" is not a valid email address` });
  }

  if (!person.name && !person.email) {
    errors.push({ field: "name", message: "Record has neither a name nor an email address" });
  }

  if (options.skipRecordsWithoutEmail && !person.email) {
    errors.push({ field: "email", message: "Record has no email address" });
  }

  if (person.email && isAutomatedEmail(person.email)) {
    errors.push({ field: "email", message: "Address belongs to an automated sender" });
  }

  return errors;
}

export function validateMappedOrg(orgValue: MappedOrg): ImportRecordError[] {
  if (!orgValue.name) {
    return [{ field: "name", message: "Organization has no name" }];
  }

  return [];
}

export function isKnownPersonTarget(value: string): value is ImportPersonTargetField {
  return (IMPORT_PERSON_TARGET_FIELD_VALUES as readonly string[]).includes(value);
}

export function isKnownOrgTarget(value: string): value is ImportOrgTargetField {
  return (IMPORT_ORG_TARGET_FIELD_VALUES as readonly string[]).includes(value);
}
