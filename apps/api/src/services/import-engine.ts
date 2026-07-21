import { createHash } from "node:crypto";
import type { ImportMatchReason } from "@workspace/validators/types/import";

/**
 * Local parts that identify automated senders rather than people. Gmail and Outlook mining
 * surface these constantly, and importing them produces CRM records nobody can reply to.
 */
const AUTOMATED_LOCAL_PARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "notifications",
  "notification",
  "mailer-daemon",
  "postmaster",
  "bounce",
  "bounces",
  "automated",
  "alerts",
  "alert",
]);

const ORG_SUFFIXES = [
  "incorporated",
  "inc",
  "llc",
  "l.l.c",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "gmbh",
  "bv",
  "nv",
  "plc",
  "pty",
  "ag",
  "sa",
  "srl",
  "oy",
  "ab",
];

/**
 * Domains where the mailbox belongs to a person rather than an organization, so the domain
 * must never be used to infer or match an org.
 */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "fastmail.com",
  "hey.com",
]);

const SUBADDRESSING_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function getEmailDomain(value: string) {
  const normalized = normalizeEmail(value);
  const domain = normalized.split("@")[1];
  return domain ?? null;
}

export function getEmailLocalPart(value: string) {
  const normalized = normalizeEmail(value);
  const localPart = normalized.split("@")[0];
  return localPart ?? null;
}

export function isAutomatedEmail(value: string) {
  const localPart = getEmailLocalPart(value);
  if (!localPart) return false;

  const withoutTag = localPart.split("+")[0] ?? localPart;
  return AUTOMATED_LOCAL_PARTS.has(withoutTag);
}

export function isFreeEmailDomain(domain: string | null) {
  if (!domain) return false;
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

/**
 * Collapses dots and plus-addressing so `a.b+tag@gmail.com` matches `ab@gmail.com`.
 * Only applied to providers that actually treat those as equivalent, and only when the
 * job opts in — it is wrong for domains that route them to distinct mailboxes.
 */
export function normalizeEmailForMatching(value: string, collapseSubaddressing: boolean) {
  const normalized = normalizeEmail(value);
  if (!collapseSubaddressing) return normalized;

  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain || !SUBADDRESSING_DOMAINS.has(domain)) return normalized;

  const withoutTag = localPart.split("+")[0] ?? localPart;
  return `${withoutTag.replaceAll(".", "")}@${domain}`;
}

/**
 * Reduces a URL, bare hostname, or email domain to a comparable apex-ish form.
 * Returns null for free mailbox providers so a personal address never resolves to an org.
 */
export function normalizeDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "") return null;

  const withoutScheme = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  const withoutAuth = withoutScheme.includes("@")
    ? (withoutScheme.split("@").pop() ?? withoutScheme)
    : withoutScheme;
  const hostname = withoutAuth.split("/")[0]?.split("?")[0]?.split("#")[0] ?? "";
  const withoutPort = hostname.split(":")[0] ?? "";
  const withoutWww = withoutPort.replace(/^www\./, "");

  if (withoutWww === "" || !withoutWww.includes(".") || withoutWww.startsWith(".")) return null;
  if (FREE_EMAIL_DOMAINS.has(withoutWww)) return null;

  return withoutWww;
}

export function normalizePersonName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Case, punctuation, and legal-suffix insensitive org key. This is what makes "Acme",
 * "acme", and "Acme, Inc." resolve to one organization instead of three.
 */
export function normalizeOrgName(value: string): string | null {
  const collapsed = value.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  if (collapsed === "") return null;

  const words = collapsed.split(" ");
  while (words.length > 1) {
    const last = words[words.length - 1]!;
    if (!ORG_SUFFIXES.includes(last)) break;
    words.pop();
  }

  const result = words.join(" ").replace(/[^a-z0-9 &-]/g, "").replace(/\s+/g, " ").trim();
  return result === "" ? null : result;
}

export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return null;

  return hasPlus ? `+${digits}` : digits;
}

export function normalizeLinkedinUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = trimmed.match(/linkedin\.com\/(in|company)\/([^/?#\s]+)/i);
  if (!match) return null;

  return `https://www.linkedin.com/${match[1]!.toLowerCase()}/${match[2]}`;
}

/**
 * Parses an RFC 5322 address list of the form `Name <a@b.com>, c@d.com`.
 * Quoted display names containing commas are handled; groups and comments are not,
 * because neither appears in Gmail or Graph metadata headers in practice.
 */
export function parseAddressList(header: string): { name: string | null; email: string }[] {
  const results: { name: string | null; email: string }[] = [];
  let current = "";
  let inQuotes = false;
  let inAngle = false;

  const flush = () => {
    const entry = parseSingleAddress(current);
    if (entry) results.push(entry);
    current = "";
  };

  for (const char of header) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "<" && !inQuotes) inAngle = true;
    else if (char === ">" && !inQuotes) inAngle = false;

    if (char === "," && !inQuotes && !inAngle) {
      flush();
      continue;
    }
    current += char;
  }
  flush();

  return results;
}

function parseSingleAddress(raw: string): { name: string | null; email: string } | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const angleMatch = trimmed.match(/^(.*)<([^>]+)>$/);
  const emailPart = angleMatch ? angleMatch[2]!.trim() : trimmed;
  const email = normalizeEmail(emailPart);
  if (!isValidEmail(email)) return null;

  const rawName = angleMatch ? angleMatch[1]!.trim().replace(/^"|"$/g, "").trim() : "";
  const name = rawName === "" ? null : normalizePersonName(rawName);

  return { name, email };
}

/**
 * Falls back to a human-ish name when a source gives an address but no display name,
 * so imported records are not a wall of raw email addresses.
 */
export function deriveNameFromEmail(email: string): string | null {
  // Guarded so a malformed value can never be laundered into a person's name.
  if (!isValidEmail(email)) return null;

  const localPart = getEmailLocalPart(email);
  if (!localPart) return null;

  const withoutTag = localPart.split("+")[0] ?? localPart;
  const words = withoutTag
    .split(/[._-]+/)
    .filter((word) => word !== "" && !/^\d+$/.test(word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.length === 0 ? null : words.join(" ");
}

/**
 * Synthetic identifier for sources that supply nothing stable — a CSV upload, or a webhook
 * push without an `externalId`.
 *
 * Without this, a record with no email address has nothing to match on: the email rule
 * cannot fire, and `people_workspace_email_unique` is scoped to a nullable column, so
 * Postgres happily accepts unlimited NULL-email rows. Re-uploading the same file would
 * create the same people again on every run.
 *
 * Hashing the identifying fields makes an identical row resolve to an identical id, so a
 * re-upload updates instead of duplicating. It is intentionally content-derived: change a
 * person's details and it becomes a different record, which is the correct trade for a
 * source that offers no real identity.
 */
export function deriveRecordFingerprint(parts: {
  name: string | null;
  email: string | null;
  phone: string | null;
  orgName: string | null;
}) {
  const canonical = [
    parts.name?.toLowerCase() ?? "",
    parts.email ?? "",
    parts.phone ?? "",
    parts.orgName?.toLowerCase() ?? "",
  ].join("|");

  return `fp_${createHash("sha256").update(canonical).digest("hex").slice(0, 32)}`;
}

export type PersonMatchCandidate = {
  externalId: string | null;
  email: string | null;
  normalizedEmail: string | null;
};

export type PersonMatchLookups = {
  byExternalId: Map<string, string>;
  byEmail: Map<string, string>;
};

export type PersonMatchResult = {
  personId: string | null;
  reason: ImportMatchReason;
};

/**
 * Match order, first hit wins. External identity comes first because it is the only rule
 * that works for records with no email, and the only one that survives a person changing
 * their address at the source.
 *
 * Name-based matching is deliberately absent: it belongs in the review step as a
 * suggestion, never as an automatic write.
 */
export function resolvePersonMatch(
  candidate: PersonMatchCandidate,
  lookups: PersonMatchLookups,
): PersonMatchResult {
  if (candidate.externalId) {
    const byIdentity = lookups.byExternalId.get(candidate.externalId);
    if (byIdentity) return { personId: byIdentity, reason: "external_identity" };
  }

  if (candidate.normalizedEmail) {
    const byEmail = lookups.byEmail.get(candidate.normalizedEmail);
    if (byEmail) return { personId: byEmail, reason: "email" };
  }

  return { personId: null, reason: "none" };
}

export type OrgMatchCandidate = {
  domain: string | null;
  normalizedName: string | null;
};

export type OrgMatchLookups = {
  byDomain: Map<string, string>;
  byNormalizedName: Map<string, string>;
};

export type OrgMatchResult = {
  orgId: string | null;
  reason: ImportMatchReason;
};

/**
 * Domain before name, because domain is stable and names drift. Both are advisory —
 * `org_workspace_name_unique` still governs the actual write.
 */
export function resolveOrgMatch(
  candidate: OrgMatchCandidate,
  lookups: OrgMatchLookups,
): OrgMatchResult {
  if (candidate.domain) {
    const byDomain = lookups.byDomain.get(candidate.domain);
    if (byDomain) return { orgId: byDomain, reason: "domain" };
  }

  if (candidate.normalizedName) {
    const byName = lookups.byNormalizedName.get(candidate.normalizedName);
    if (byName) return { orgId: byName, reason: "name" };
  }

  return { orgId: null, reason: "none" };
}

/**
 * Applies the job's conflict policy to a single field. `fill_empty` is the default because
 * most import sources are lower-trust than data a user typed into the CRM by hand.
 *
 * `crm_wins` is deliberately absent here: it means "leave the matched record untouched"
 * and is enforced at record level before any field is considered. Treating it as a
 * per-field rule would make it identical to `fill_empty`.
 */
export function resolveFieldValue<T>(
  existing: T | null | undefined,
  incoming: T | null | undefined,
  policy: "source_wins" | "fill_empty",
): T | null | undefined {
  const incomingIsEmpty = incoming === null || incoming === undefined || incoming === "";
  if (incomingIsEmpty) return existing;

  if (policy === "source_wins") return incoming;

  const existingIsEmpty = existing === null || existing === undefined || existing === "";
  return existingIsEmpty ? incoming : existing;
}

/**
 * Under `crm_wins` a matched record is left exactly as the user left it. New records are
 * still created — the policy governs conflicts, not whether the import runs.
 */
export function shouldSkipExistingRecord(policy: "source_wins" | "crm_wins" | "fill_empty") {
  return policy === "crm_wins";
}

export function fieldPolicy(policy: "source_wins" | "crm_wins" | "fill_empty") {
  return policy === "source_wins" ? ("source_wins" as const) : ("fill_empty" as const);
}
