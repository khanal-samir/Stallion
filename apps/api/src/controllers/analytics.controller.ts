import type { Context } from "hono";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client.js";
import { deals, people } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

const DEAL_STAGES = ["new", "contacted", "demo", "proposal", "won", "lost"] as const;
const PEOPLE_STATUSES = ["lead", "prospect", "qualified", "customer", "churned"] as const;

type StageCount = { stage: (typeof DEAL_STAGES)[number]; count: number };
type StatusCount = { status: (typeof PEOPLE_STATUSES)[number]; count: number };

export async function pipelineByStage(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);

  const rows = await db
    .select({
      stage: deals.stage,
      count: count(),
    })
    .from(deals)
    .where(eq(deals.workspaceId, workspaceId))
    .groupBy(deals.stage);

  const countMap = new Map(rows.map((r) => [r.stage, Number(r.count)]));

  const result: StageCount[] = DEAL_STAGES.map((stage) => ({
    stage,
    count: countMap.get(stage) ?? 0,
  }));

  return sendSuccess(c, { pipeline: result }, STATUS_CODES.OK);
}

export async function peopleByStatus(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);

  const rows = await db
    .select({
      status: people.status,
      count: count(),
    })
    .from(people)
    .where(eq(people.workspaceId, workspaceId))
    .groupBy(people.status);

  const countMap = new Map(rows.map((r) => [r.status, Number(r.count)]));

  const result: StatusCount[] = PEOPLE_STATUSES.map((status) => ({
    status,
    count: countMap.get(status) ?? 0,
  }));

  return sendSuccess(c, { peopleStatus: result }, STATUS_CODES.OK);
}

export async function winRate(c: Context) {
  const workspaceId = getSessionWorkspaceId(c);

  const rows = await db
    .select({
      stage: deals.stage,
      count: count(),
    })
    .from(deals)
    .where(and(eq(deals.workspaceId, workspaceId), sql`${deals.stage} IN ('won', 'lost')`))
    .groupBy(deals.stage);

  const countMap = new Map(rows.map((r) => [r.stage, Number(r.count)]));
  const won = countMap.get("won") ?? 0;
  const lost = countMap.get("lost") ?? 0;
  const total = won + lost;
  const rate = total === 0 ? 0 : Math.round((won / total) * 100);

  return sendSuccess(
    c,
    { won, lost, total, rate },
    STATUS_CODES.OK,
  );
}
