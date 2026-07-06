import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@/db/client.js";
import { user } from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";

export async function getOnboardingStatus(c: Context) {
  const authenticatedUser = c.get("user");
  const onboardingUser = await db.query.user.findFirst({
    where: eq(user.id, authenticatedUser.id),
    columns: { crmTourCompletedAt: true },
  });

  return sendSuccess(
    c,
    {
      crmTourCompleted: Boolean(onboardingUser?.crmTourCompletedAt),
      crmTourCompletedAt: onboardingUser?.crmTourCompletedAt ?? null,
    },
    STATUS_CODES.OK,
  );
}

export async function completeCrmTour(c: Context) {
  const authenticatedUser = c.get("user");
  const completedAt = new Date();
  const [onboardingUser] = await db
    .update(user)
    .set({ crmTourCompletedAt: completedAt })
    .where(eq(user.id, authenticatedUser.id))
    .returning({ crmTourCompletedAt: user.crmTourCompletedAt });

  return sendSuccess(
    c,
    {
      crmTourCompleted: true,
      crmTourCompletedAt: onboardingUser?.crmTourCompletedAt ?? completedAt,
    },
    STATUS_CODES.OK,
  );
}
