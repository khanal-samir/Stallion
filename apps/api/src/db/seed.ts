import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDirectory, "../../.env"), quiet: true });
config({ path: resolve(currentDirectory, "../../../../.env"), quiet: true });

const { and, eq } = await import("drizzle-orm");
const { hashPassword } = await import("better-auth/crypto");
const { db, dbClient } = await import("./client.js");
const {
  account,
  crmCustomFieldDefinitions,
  deals,
  org,
  people,
  user,
  workspaceMembers,
  workspaces,
} = await import("./schema/index.js");

const DEMO_EMAIL = "demo@gmail.com";
const DEMO_PASSWORD = "12345678";

const workspaceSeeds = [
  {
    name: "Stallion Demo Sales",
    slug: "stallion-demo-sales",
    market: "Outbound sales",
    orgCount: 28,
    peopleCount: 90,
    dealCount: 36,
    offset: 0,
  },
  {
    name: "Stallion Demo Success",
    slug: "stallion-demo-success",
    market: "Customer expansion",
    orgCount: 17,
    peopleCount: 45,
    dealCount: 20,
    offset: 11,
  },
] as const;

const industries = [
  "SaaS",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Education",
  "Logistics",
  "Manufacturing",
  "Real Estate",
] as const;

const companyAdjectives = [
  "Apex",
  "Northstar",
  "Summit",
  "Brightline",
  "Nimbus",
  "Vertex",
  "Copper",
  "Atlas",
  "Signal",
  "Keystone",
  "Harbor",
  "Prairie",
] as const;

const companyNouns = [
  "Analytics",
  "Cloud",
  "Systems",
  "Commerce",
  "Health",
  "Labs",
  "Networks",
  "Works",
  "Logistics",
  "Learning",
  "Capital",
  "Robotics",
] as const;

const locations = [
  "New York, NY",
  "Austin, TX",
  "San Francisco, CA",
  "Chicago, IL",
  "Denver, CO",
  "Seattle, WA",
  "Boston, MA",
  "Atlanta, GA",
] as const;

const sizes = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;

const firstNames = [
  "Maya",
  "Ethan",
  "Ava",
  "Noah",
  "Sophia",
  "Liam",
  "Isabella",
  "Lucas",
  "Olivia",
  "Mason",
  "Amelia",
  "Logan",
  "Harper",
  "Elijah",
  "Evelyn",
  "James",
  "Charlotte",
  "Benjamin",
  "Mia",
  "Henry",
  "Aria",
  "Jack",
  "Layla",
  "Owen",
] as const;

const lastNames = [
  "Patel",
  "Chen",
  "Johnson",
  "Garcia",
  "Williams",
  "Nguyen",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Robinson",
  "Lewis",
  "Walker",
  "Young",
  "King",
] as const;

const jobTitles = [
  "VP of Sales",
  "Head of Revenue",
  "Sales Operations Manager",
  "Founder",
  "Chief Operating Officer",
  "Product Lead",
  "Finance Director",
  "Customer Success Director",
  "Marketing Manager",
  "Procurement Lead",
] as const;

const peopleStatuses = ["lead", "prospect", "qualified", "customer", "churned"] as const;
const peopleSources = ["manual", "csv", "api"] as const;
const dealStages = ["new", "contacted", "demo", "proposal", "won", "lost"] as const;
const dealThemes = [
  "Pilot rollout",
  "Team expansion",
  "Annual subscription",
  "Workflow automation",
  "Enterprise upgrade",
  "Renewal package",
] as const;

type WorkspaceSeed = (typeof workspaceSeeds)[number];
type SelectOption = { id: string; label: string };
type CustomField = {
  id: string;
  label: string;
  options: SelectOption[];
};

function requireValue<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${label} to exist while seeding demo data.`);
  }

  return value;
}

function makeOptions(labels: readonly string[]): SelectOption[] {
  return labels.map((label) => ({ id: randomUUID(), label }));
}

function optionId(options: SelectOption[], index: number) {
  return requireValue(options[index % options.length], "custom field option").id;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function dateTimeString(days: number) {
  return daysFromNow(days).toISOString().slice(0, 16);
}

function closeDateForStage(stage: (typeof dealStages)[number], index: number) {
  if (stage === "won" || stage === "lost") {
    return daysFromNow(-10 - index);
  }

  return daysFromNow(14 + index * 3);
}

async function upsertDemoUser() {
  const password = await hashPassword(DEMO_PASSWORD);
  const now = new Date();
  const [demoUser] = await db
    .insert(user)
    .values({
      name: "Demo User",
      email: DEMO_EMAIL,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: user.email,
      set: {
        name: "Demo User",
        emailVerified: true,
        updatedAt: now,
      },
    })
    .returning();

  const result = requireValue(demoUser, "demo user");

  await db
    .delete(account)
    .where(and(eq(account.userId, result.id), eq(account.providerId, "credential")));

  await db.insert(account).values({
    userId: result.id,
    accountId: result.id,
    providerId: "credential",
    password,
    createdAt: now,
    updatedAt: now,
  });

  return result;
}

async function upsertWorkspace(seed: WorkspaceSeed, ownerId: string) {
  const now = new Date();
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: seed.name,
      slug: seed.slug,
      ownerId,
      metadata: {
        seeded: true,
        market: seed.market,
      },
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: workspaces.slug,
      set: {
        name: seed.name,
        ownerId,
        metadata: {
          seeded: true,
          market: seed.market,
        },
        updatedAt: now,
      },
    })
    .returning();

  const result = requireValue(workspace, `workspace ${seed.name}`);

  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: result.id,
      userId: ownerId,
      role: "owner",
      joinedAt: now,
    })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: {
        role: "owner",
        joinedAt: now,
      },
    });

  return result;
}

function fieldByLabel(fields: CustomField[], label: string) {
  return requireValue(
    fields.find((field) => field.label === label),
    `custom field ${label}`,
  );
}

async function reseedWorkspaceCrm(workspaceId: string, ownerId: string, seed: WorkspaceSeed) {
  return db.transaction(async (tx) => {
    await tx.delete(deals).where(eq(deals.workspaceId, workspaceId));
    await tx.delete(people).where(eq(people.workspaceId, workspaceId));
    await tx.delete(org).where(eq(org.workspaceId, workspaceId));
    await tx
      .delete(crmCustomFieldDefinitions)
      .where(eq(crmCustomFieldDefinitions.workspaceId, workspaceId));

    const buyingRoleOptions = makeOptions(["Economic buyer", "Champion", "Evaluator", "End user"]);
    const channelOptions = makeOptions(["Email", "Phone", "LinkedIn", "Referral"]);
    const tierOptions = makeOptions(["Strategic", "Growth", "Startup"]);

    const fields = (await tx
      .insert(crmCustomFieldDefinitions)
      .values([
        {
          workspaceId,
          entityType: "people",
          fieldType: "select",
          label: "Buying Role",
          options: buyingRoleOptions,
        },
        {
          workspaceId,
          entityType: "people",
          fieldType: "number",
          label: "Lead Score",
          options: [],
        },
        {
          workspaceId,
          entityType: "people",
          fieldType: "select",
          label: "Preferred Channel",
          options: channelOptions,
        },
        {
          workspaceId,
          entityType: "org",
          fieldType: "select",
          label: "Account Tier",
          options: tierOptions,
        },
        {
          workspaceId,
          entityType: "org",
          fieldType: "number",
          label: "Estimated ARR",
          options: [],
        },
        {
          workspaceId,
          entityType: "org",
          fieldType: "dateTime",
          label: "Renewal Date",
          options: [],
        },
      ])
      .returning()) as CustomField[];

    const buyingRoleField = fieldByLabel(fields, "Buying Role");
    const leadScoreField = fieldByLabel(fields, "Lead Score");
    const channelField = fieldByLabel(fields, "Preferred Channel");
    const tierField = fieldByLabel(fields, "Account Tier");
    const arrField = fieldByLabel(fields, "Estimated ARR");
    const renewalField = fieldByLabel(fields, "Renewal Date");

    const orgRows = Array.from({ length: seed.orgCount }, (_, index) => {
      const baseName = `${companyAdjectives[(index + seed.offset) % companyAdjectives.length]} ${companyNouns[(index * 3 + seed.offset) % companyNouns.length]}`;
      const name = `${baseName} ${index + 1}`;
      const domain = `${slugify(name)}.example.com`;

      return {
        workspaceId,
        ownerId,
        name,
        domain,
        industry: industries[(index + seed.offset) % industries.length],
        size: sizes[(index + seed.offset) % sizes.length],
        location: locations[(index * 2 + seed.offset) % locations.length],
        customFields: {
          [tierField.id]: optionId(tierOptions, index + seed.offset),
          [arrField.id]: 25000 + index * 8500 + seed.offset * 1000,
          [renewalField.id]: dateTimeString(30 + index * 9),
        },
      };
    });

    const insertedOrgs = await tx.insert(org).values(orgRows).returning();

    const peopleRows = Array.from({ length: seed.peopleCount }, (_, index) => {
      const company = requireValue(insertedOrgs[index % insertedOrgs.length], "seeded org");
      const firstName = firstNames[(index + seed.offset) % firstNames.length];
      const lastName = lastNames[(index * 2 + seed.offset) % lastNames.length];
      const emailLocalPart = `${firstName}.${lastName}.${index + 1}`.toLowerCase();
      const domain = company.domain ?? `${seed.slug}.example.com`;
      const contactedRecently = index % 5 !== 0;

      return {
        workspaceId,
        orgId: company.id,
        ownerId,
        name: `${firstName} ${lastName}`,
        email: `${emailLocalPart}@${domain}`,
        phone: `+1-555-${String(1000 + index + seed.offset * 10).slice(0, 4)}`,
        jobTitle: jobTitles[(index + seed.offset) % jobTitles.length],
        linkedinUrl: `https://www.linkedin.com/in/${emailLocalPart}`,
        status: peopleStatuses[(index + seed.offset) % peopleStatuses.length],
        source: peopleSources[(index + seed.offset) % peopleSources.length],
        lastContactedAt: contactedRecently ? daysFromNow(-(index % 21) - 1) : null,
        customFields: {
          [buyingRoleField.id]: optionId(buyingRoleOptions, index),
          [leadScoreField.id]: 35 + ((index * 7 + seed.offset) % 66),
          [channelField.id]: optionId(channelOptions, index + seed.offset),
        },
      };
    });

    const insertedPeople = await tx.insert(people).values(peopleRows).returning();

    const dealRows = Array.from({ length: seed.dealCount }, (_, index) => {
      const person = requireValue(
        insertedPeople[(index * 2) % insertedPeople.length],
        "seeded person",
      );
      const company =
        insertedOrgs.find((item) => item.id === person.orgId) ??
        requireValue(insertedOrgs[index % insertedOrgs.length], "seeded deal org");
      const stage = requireValue(
        dealStages[(index + seed.offset) % dealStages.length],
        "deal stage",
      );

      return {
        workspaceId,
        personId: person.id,
        orgId: company.id,
        ownerId,
        title: `${company.name} - ${dealThemes[(index + seed.offset) % dealThemes.length]}`,
        value: String(7500 + index * 2750 + seed.offset * 1250),
        currency: "USD",
        stage,
        closeDate: closeDateForStage(stage, index),
      };
    });

    const insertedDeals = await tx.insert(deals).values(dealRows).returning();

    return {
      orgs: insertedOrgs.length,
      people: insertedPeople.length,
      deals: insertedDeals.length,
      customFields: fields.length,
    };
  });
}

async function main() {
  console.log(`Seeding demo account ${DEMO_EMAIL}...`);

  const demoUser = await upsertDemoUser();
  const summaries = [];

  for (const seed of workspaceSeeds) {
    const workspace = await upsertWorkspace(seed, demoUser.id);
    const summary = await reseedWorkspaceCrm(workspace.id, demoUser.id, seed);
    summaries.push({ workspace: workspace.name, ...summary });
  }

  console.log("Demo seed complete.");
  console.log(`Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.table(summaries);
}

try {
  await main();
} catch (error) {
  console.error("Demo seed failed:", error);
  process.exitCode = 1;
} finally {
  await dbClient.end();
}
