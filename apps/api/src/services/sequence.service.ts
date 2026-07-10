import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type {
  ConnectGmailInput,
  CreateSequenceInput,
  EnrollPeopleInput,
  ListEnrollmentsQuery,
  ListSequencesQuery,
  SequenceDraftStepInput,
  SequenceSendingWindow,
  UpdateSequenceInput,
  UpdateSequenceStepInput,
} from "@workspace/validators/schemas/sequence";
import { db } from "@/db/client.js";
import {
  gmailIntegrations,
  people,
  sequenceActivityEvents,
  sequenceEnrollments,
  sequenceEnrollmentSteps,
  sequences,
  sequenceSteps,
  sequenceSuppressions,
  sequenceTasks,
  sequenceUnsubscribeTokens,
  sequenceVersions,
} from "@/db/schema/index.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { env } from "@/config/env.config.js";
import { AppError } from "@/lib/app-error.js";
import {
  createPublicToken,
  decryptSecretToken,
  encryptSecretToken,
  hashPublicToken,
} from "@/lib/token-crypto.js";
import {
  DEFAULT_SENDING_WINDOW,
  firstStepDueAt,
  isWithinSendingWindow,
  nextDueAtAfterStep,
  nextSendingWindowSlot,
  normalizeEmailAddress,
  normalizeStepConfig,
  readableStepType,
  sequenceHasEmailStep,
  toStepSnapshot,
  validatePublishableSteps,
} from "./sequence-engine.js";
import { generateEmailContent, generateTaskCopy, sendSequenceEmail } from "./sequence-adapters.js";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GMAIL_METADATA_SCOPE = "https://www.googleapis.com/auth/gmail.metadata";

type SequenceActivityType = typeof sequenceActivityEvents.$inferInsert.type;

type ActivityInput = {
  workspaceId: string;
  sequenceId?: string | null;
  enrollmentId?: string | null;
  personId?: string | null;
  type: SequenceActivityType;
  message: string;
  metadata?: Record<string, unknown>;
};

function defaultSendingWindow(input?: SequenceSendingWindow) {
  return input ?? DEFAULT_SENDING_WINDOW;
}

function tokenSecret() {
  return env.BETTER_AUTH_SECRET;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcHour(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
    ),
  );
}

async function recordActivity(input: ActivityInput) {
  const [event] = await db
    .insert(sequenceActivityEvents)
    .values({
      workspaceId: input.workspaceId,
      sequenceId: input.sequenceId,
      enrollmentId: input.enrollmentId,
      personId: input.personId,
      type: input.type,
      message: input.message,
      metadata: input.metadata ?? {},
    })
    .returning();

  return event;
}

async function getSequenceOrThrow(workspaceId: string, sequenceId: string) {
  const sequence = await db.query.sequences.findFirst({
    where: and(eq(sequences.workspaceId, workspaceId), eq(sequences.id, sequenceId)),
    with: {
      steps: {
        orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
      },
    },
  });

  if (!sequence) {
    throw new AppError("Sequence not found", STATUS_CODES.NOT_FOUND);
  }

  return sequence;
}

async function getLatestPublishedVersionOrThrow(workspaceId: string, sequenceId: string) {
  const sequence = await db.query.sequences.findFirst({
    where: and(eq(sequences.workspaceId, workspaceId), eq(sequences.id, sequenceId)),
  });

  if (!sequence || !sequence.latestPublishedVersionId) {
    throw new AppError("Publish the sequence before enrolling people", STATUS_CODES.BAD_REQUEST);
  }

  if (sequence.status === "archived") {
    throw new AppError("Archived sequences cannot accept new enrollments", STATUS_CODES.BAD_REQUEST);
  }

  const version = await db.query.sequenceVersions.findFirst({
    where: and(
      eq(sequenceVersions.workspaceId, workspaceId),
      eq(sequenceVersions.id, sequence.latestPublishedVersionId),
    ),
  });

  if (!version) {
    throw new AppError("Published sequence version not found", STATUS_CODES.NOT_FOUND);
  }

  return { sequence, version };
}

function toDraftStepInput(step: typeof sequenceSteps.$inferSelect): SequenceDraftStepInput {
  return {
    id: step.id,
    type: step.type,
    name: step.name,
    position: step.position,
    config: step.config,
  };
}

async function replaceDraftSteps(
  workspaceId: string,
  sequenceId: string,
  stepInputs: SequenceDraftStepInput[],
) {
  const normalizedSteps = stepInputs
    .map((step) => ({
      ...step,
      id: step.id ?? randomUUID(),
      config: normalizeStepConfig(step.type, step.config),
    }))
    .sort((a, b) => a.position - b.position);

  await db.transaction(async (tx) => {
    await tx.delete(sequenceSteps).where(eq(sequenceSteps.sequenceId, sequenceId));
    if (normalizedSteps.length > 0) {
      await tx.insert(sequenceSteps).values(
        normalizedSteps.map((step) => ({
          id: step.id,
          workspaceId,
          sequenceId,
          type: step.type,
          name: step.name,
          position: step.position,
          config: step.config,
        })),
      );
    }
  });
}

export async function listSequences(workspaceId: string, query: ListSequencesQuery) {
  const { page, pageSize, search, status } = query;
  const offset = (page - 1) * pageSize;
  const conditions = [eq(sequences.workspaceId, workspaceId)];
  if (status) conditions.push(eq(sequences.status, status));
  if (search) conditions.push(ilike(sequences.name, `%${search}%`));

  const whereClause = and(...conditions);
  const [rows, totalCountResult] = await Promise.all([
    db
      .select()
      .from(sequences)
      .where(whereClause)
      .orderBy(desc(sequences.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ totalCount: count() }).from(sequences).where(whereClause),
  ]);

  const sequenceIds = rows.map((sequence) => sequence.id);
  const [enrollmentRows, sentRows, replyRows, failureRows] =
    sequenceIds.length === 0
      ? [[], [], [], []]
      : await Promise.all([
          db
            .select({ sequenceId: sequenceEnrollments.sequenceId, total: count() })
            .from(sequenceEnrollments)
            .where(inArray(sequenceEnrollments.sequenceId, sequenceIds))
            .groupBy(sequenceEnrollments.sequenceId),
          db
            .select({ sequenceId: sequenceActivityEvents.sequenceId, total: count() })
            .from(sequenceActivityEvents)
            .where(
              and(
                inArray(sequenceActivityEvents.sequenceId, sequenceIds),
                inArray(sequenceActivityEvents.type, ["email_sent", "email_would_send"]),
              ),
            )
            .groupBy(sequenceActivityEvents.sequenceId),
          db
            .select({ sequenceId: sequenceActivityEvents.sequenceId, total: count() })
            .from(sequenceActivityEvents)
            .where(
              and(
                inArray(sequenceActivityEvents.sequenceId, sequenceIds),
                eq(sequenceActivityEvents.type, "reply_detected"),
              ),
            )
            .groupBy(sequenceActivityEvents.sequenceId),
          db
            .select({ sequenceId: sequenceEnrollments.sequenceId, total: count() })
            .from(sequenceEnrollmentSteps)
            .innerJoin(
              sequenceEnrollments,
              eq(sequenceEnrollmentSteps.enrollmentId, sequenceEnrollments.id),
            )
            .where(
              and(
                inArray(sequenceEnrollments.sequenceId, sequenceIds),
                eq(sequenceEnrollmentSteps.status, "failed"),
              ),
            )
            .groupBy(sequenceEnrollments.sequenceId),
        ]);

  const countBySequence = (items: Array<{ sequenceId: string | null; total: number }>) =>
    new Map(items.filter((item) => item.sequenceId).map((item) => [item.sequenceId!, Number(item.total)]));

  const enrollments = countBySequence(enrollmentRows);
  const sent = countBySequence(sentRows);
  const replies = countBySequence(replyRows);
  const failures = countBySequence(failureRows);
  const totalCount = Number(totalCountResult[0]?.totalCount ?? 0);

  return {
    sequences: rows.map((sequence) => ({
      ...sequence,
      metrics: {
        enrollments: enrollments.get(sequence.id) ?? 0,
        sent: sent.get(sequence.id) ?? 0,
        replies: replies.get(sequence.id) ?? 0,
        failures: failures.get(sequence.id) ?? 0,
      },
    })),
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
    },
  };
}

export async function createSequence(
  workspaceId: string,
  userId: string,
  input: CreateSequenceInput,
) {
  const [sequence] = await db
    .insert(sequences)
    .values({
      workspaceId,
      createdById: userId,
      name: input.name,
      timezone: input.timezone,
      sendingWindow: defaultSendingWindow(input.sendingWindow),
    })
    .returning();

  if (!sequence) throw new AppError("Unable to create sequence");
  await recordActivity({
    workspaceId,
    sequenceId: sequence.id,
    type: "sequence_created",
    message: `Sequence "${sequence.name}" was created.`,
  });

  return sequence;
}

export async function getSequence(workspaceId: string, sequenceId: string) {
  const sequence = await getSequenceOrThrow(workspaceId, sequenceId);
  const [enrollmentsResult, activityResult] = await Promise.all([
    db
      .select({ totalCount: count() })
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.sequenceId, sequenceId)),
    db
      .select({ totalCount: count() })
      .from(sequenceActivityEvents)
      .where(eq(sequenceActivityEvents.sequenceId, sequenceId)),
  ]);

  return {
    sequence,
    counts: {
      enrollments: Number(enrollmentsResult[0]?.totalCount ?? 0),
      activity: Number(activityResult[0]?.totalCount ?? 0),
    },
  };
}

export async function updateSequence(
  workspaceId: string,
  sequenceId: string,
  input: UpdateSequenceInput,
) {
  const existing = await getSequenceOrThrow(workspaceId, sequenceId);
  if (existing.status === "archived") {
    throw new AppError("Archived sequences cannot be edited", STATUS_CODES.BAD_REQUEST);
  }

  await db
    .update(sequences)
    .set({
      name: input.name,
      timezone: input.timezone,
      sendingWindow: input.sendingWindow,
      updatedAt: new Date(),
    })
    .where(and(eq(sequences.workspaceId, workspaceId), eq(sequences.id, sequenceId)));

  if (input.steps) {
    await replaceDraftSteps(workspaceId, sequenceId, input.steps);
  }

  await recordActivity({
    workspaceId,
    sequenceId,
    type: "sequence_updated",
    message: `Sequence "${input.name ?? existing.name}" was updated.`,
  });

  return getSequence(workspaceId, sequenceId);
}

export async function updateSequenceStep(
  workspaceId: string,
  sequenceId: string,
  stepId: string,
  input: UpdateSequenceStepInput,
) {
  const step = await db.query.sequenceSteps.findFirst({
    where: and(
      eq(sequenceSteps.workspaceId, workspaceId),
      eq(sequenceSteps.sequenceId, sequenceId),
      eq(sequenceSteps.id, stepId),
    ),
  });

  if (!step) {
    throw new AppError("Sequence step not found", STATUS_CODES.NOT_FOUND);
  }

  const [updatedStep] = await db
    .update(sequenceSteps)
    .set({
      name: input.name,
      config: input.config ? normalizeStepConfig(step.type, input.config) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(sequenceSteps.id, stepId))
    .returning();

  return updatedStep;
}

export async function publishSequence(workspaceId: string, sequenceId: string, userId: string) {
  const sequence = await getSequenceOrThrow(workspaceId, sequenceId);
  if (sequence.status === "archived") {
    throw new AppError("Archived sequences cannot be published", STATUS_CODES.BAD_REQUEST);
  }

  const sortedSteps = validatePublishableSteps(sequence.steps.map(toDraftStepInput));
  const stepSnapshots = sortedSteps.map(toStepSnapshot);
  const [latestVersion] = await db
    .select({ versionNumber: sequenceVersions.versionNumber })
    .from(sequenceVersions)
    .where(eq(sequenceVersions.sequenceId, sequenceId))
    .orderBy(desc(sequenceVersions.versionNumber))
    .limit(1);
  const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  const version = await db.transaction(async (tx) => {
    const [createdVersion] = await tx
      .insert(sequenceVersions)
      .values({
        workspaceId,
        sequenceId,
        versionNumber,
        name: sequence.name,
        stepsSnapshot: stepSnapshots,
        publishedById: userId,
      })
      .returning();

    if (!createdVersion) throw new AppError("Unable to publish sequence");

    await tx
      .update(sequences)
      .set({
        status: "published",
        latestPublishedVersionId: createdVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(sequences.id, sequenceId));

    return createdVersion;
  });

  await recordActivity({
    workspaceId,
    sequenceId,
    type: "sequence_published",
    message: `Version ${version.versionNumber} was published.`,
    metadata: { versionId: version.id },
  });

  return version;
}

export async function archiveSequence(workspaceId: string, sequenceId: string) {
  const [sequence] = await db
    .update(sequences)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(sequences.workspaceId, workspaceId), eq(sequences.id, sequenceId)))
    .returning();

  if (!sequence) {
    throw new AppError("Sequence not found", STATUS_CODES.NOT_FOUND);
  }

  await recordActivity({
    workspaceId,
    sequenceId,
    type: "sequence_archived",
    message: `Sequence "${sequence.name}" was archived.`,
  });

  return sequence;
}

export async function deleteSequence(workspaceId: string, sequenceId: string) {
  const sequence = await getSequenceOrThrow(workspaceId, sequenceId);
  if (sequence.status !== "draft") {
    throw new AppError("Only draft sequences can be deleted", STATUS_CODES.BAD_REQUEST);
  }

  const [enrollmentCount, eventCount] = await Promise.all([
    db
      .select({ totalCount: count() })
      .from(sequenceEnrollments)
      .where(eq(sequenceEnrollments.sequenceId, sequenceId)),
    db
      .select({ totalCount: count() })
      .from(sequenceActivityEvents)
      .where(
        and(
          eq(sequenceActivityEvents.sequenceId, sequenceId),
          or(
            eq(sequenceActivityEvents.type, "enrollment_started"),
            eq(sequenceActivityEvents.type, "email_sent"),
            eq(sequenceActivityEvents.type, "email_would_send"),
            eq(sequenceActivityEvents.type, "reply_detected"),
            eq(sequenceActivityEvents.type, "unsubscribed"),
          ),
        ),
      ),
  ]);

  if (Number(enrollmentCount[0]?.totalCount ?? 0) > 0 || Number(eventCount[0]?.totalCount ?? 0) > 0) {
    throw new AppError("Sequence history must be archived, not deleted", STATUS_CODES.BAD_REQUEST);
  }

  const [deletedSequence] = await db
    .delete(sequences)
    .where(and(eq(sequences.workspaceId, workspaceId), eq(sequences.id, sequenceId)))
    .returning();

  return deletedSequence;
}

export async function enrollPeople(
  workspaceId: string,
  sequenceId: string,
  userId: string,
  input: EnrollPeopleInput,
  now = new Date(),
) {
  const { sequence, version } = await getLatestPublishedVersionOrThrow(workspaceId, sequenceId);
  const hasEmailStep = sequenceHasEmailStep(version.stepsSnapshot);
  let gmailIntegration: typeof gmailIntegrations.$inferSelect | undefined;

  if (input.gmailIntegrationId) {
    gmailIntegration =
      (await db.query.gmailIntegrations.findFirst({
        where: and(
          eq(gmailIntegrations.workspaceId, workspaceId),
          eq(gmailIntegrations.userId, userId),
          eq(gmailIntegrations.id, input.gmailIntegrationId),
        ),
      })) ?? undefined;
  }

  if (hasEmailStep && !gmailIntegration) {
    throw new AppError("Choose a connected Gmail sender for email sequences", STATUS_CODES.BAD_REQUEST);
  }

  const selectedPeople = await db
    .select()
    .from(people)
    .where(and(eq(people.workspaceId, workspaceId), inArray(people.id, input.personIds)));
  if (selectedPeople.length !== input.personIds.length) {
    throw new AppError("One or more people were not found", STATUS_CODES.BAD_REQUEST);
  }

  const window = gmailIntegration?.sendingWindow ?? sequence.sendingWindow;
  const firstDue = firstStepDueAt(version.stepsSnapshot, now, window);

  const createdEnrollments = await db.transaction(async (tx) => {
    const enrollments: Array<typeof sequenceEnrollments.$inferSelect> = [];
    for (const person of selectedPeople) {
      const [enrollment] = await tx
        .insert(sequenceEnrollments)
        .values({
          workspaceId,
          sequenceId,
          versionId: version.id,
          personId: person.id,
          gmailIntegrationId: gmailIntegration?.id,
          enrolledById: userId,
          currentPosition: 0,
          nextStepDueAt: firstDue,
        })
        .returning();
      if (!enrollment) continue;

      await tx.insert(sequenceEnrollmentSteps).values(
        version.stepsSnapshot.map((step) => ({
          workspaceId,
          enrollmentId: enrollment.id,
          stepId: step.id,
          type: step.type,
          name: step.name,
          position: step.position,
          stepSnapshot: step,
          dueAt: step.position === 0 ? firstDue : null,
        })),
      );
      enrollments.push(enrollment);
    }

    return enrollments;
  });

  await Promise.all(
    createdEnrollments.map((enrollment) =>
      recordActivity({
        workspaceId,
        sequenceId,
        enrollmentId: enrollment.id,
        personId: enrollment.personId,
        type: "enrollment_started",
        message: `Enrollment started for sequence "${sequence.name}".`,
        metadata: { versionId: version.id },
      }),
    ),
  );

  return createdEnrollments;
}

export async function listSequenceEnrollments(
  workspaceId: string,
  sequenceId: string,
  query: ListEnrollmentsQuery,
) {
  const conditions = [
    eq(sequenceEnrollments.workspaceId, workspaceId),
    eq(sequenceEnrollments.sequenceId, sequenceId),
  ];
  if (query.status) conditions.push(eq(sequenceEnrollments.status, query.status));

  return db.query.sequenceEnrollments.findMany({
    where: and(...conditions),
    with: {
      person: {
        columns: {
          id: true,
          name: true,
          email: true,
          linkedinUrl: true,
        },
      },
      gmailIntegration: {
        columns: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
  });
}

export async function listSequenceActivity(workspaceId: string, sequenceId: string) {
  return db.query.sequenceActivityEvents.findMany({
    where: and(
      eq(sequenceActivityEvents.workspaceId, workspaceId),
      eq(sequenceActivityEvents.sequenceId, sequenceId),
    ),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
    limit: 100,
  });
}

export async function pauseEnrollment(workspaceId: string, enrollmentId: string) {
  const [enrollment] = await db
    .update(sequenceEnrollments)
    .set({ status: "paused", pausedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sequenceEnrollments.workspaceId, workspaceId), eq(sequenceEnrollments.id, enrollmentId)))
    .returning();

  if (!enrollment) throw new AppError("Enrollment not found", STATUS_CODES.NOT_FOUND);
  await recordActivity({
    workspaceId,
    sequenceId: enrollment.sequenceId,
    enrollmentId,
    personId: enrollment.personId,
    type: "paused",
    message: "Enrollment was paused.",
  });

  return enrollment;
}

export async function resumeEnrollment(workspaceId: string, enrollmentId: string) {
  const [enrollment] = await db
    .update(sequenceEnrollments)
    .set({ status: "active", pausedAt: null, updatedAt: new Date() })
    .where(and(eq(sequenceEnrollments.workspaceId, workspaceId), eq(sequenceEnrollments.id, enrollmentId)))
    .returning();

  if (!enrollment) throw new AppError("Enrollment not found", STATUS_CODES.NOT_FOUND);
  await recordActivity({
    workspaceId,
    sequenceId: enrollment.sequenceId,
    enrollmentId,
    personId: enrollment.personId,
    type: "resumed",
    message: "Enrollment was resumed.",
  });

  return enrollment;
}

async function failEnrollmentStep(input: {
  workspaceId: string;
  step: typeof sequenceEnrollmentSteps.$inferSelect;
  enrollment: typeof sequenceEnrollments.$inferSelect;
  message: string;
  taskTitle: string;
  now: Date;
  status?: "failed" | "unsubscribed" | "paused";
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(sequenceEnrollmentSteps)
      .set({
        status: "failed",
        lastError: input.message,
        processedAt: input.now,
        updatedAt: input.now,
      })
      .where(eq(sequenceEnrollmentSteps.id, input.step.id));
    await tx
      .update(sequenceEnrollments)
      .set({
        status: input.status ?? "failed",
        lastError: input.message,
        nextStepDueAt: null,
        updatedAt: input.now,
      })
      .where(eq(sequenceEnrollments.id, input.enrollment.id));
    await tx.insert(sequenceTasks).values({
      workspaceId: input.workspaceId,
      sequenceId: input.enrollment.sequenceId,
      enrollmentId: input.enrollment.id,
      enrollmentStepId: input.step.id,
      personId: input.enrollment.personId,
      assignedToId: input.enrollment.enrolledById,
      type: input.status === "paused" ? "gmail_warning" : "failure",
      title: input.taskTitle,
      body: input.message,
      dueAt: input.now,
    });
  });

  await recordActivity({
    workspaceId: input.workspaceId,
    sequenceId: input.enrollment.sequenceId,
    enrollmentId: input.enrollment.id,
    personId: input.enrollment.personId,
    type: input.status === "paused" ? "gmail_warning" : "email_failed",
    message: input.message,
  });
}

async function advanceEnrollment(
  enrollment: typeof sequenceEnrollments.$inferSelect,
  completedStep: typeof sequenceEnrollmentSteps.$inferSelect,
  now: Date,
  window: SequenceSendingWindow,
) {
  const steps = await db.query.sequenceEnrollmentSteps.findMany({
    where: eq(sequenceEnrollmentSteps.enrollmentId, enrollment.id),
    orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
  });
  const snapshots = steps.map((step) => step.stepSnapshot);
  const nextDue = nextDueAtAfterStep(snapshots, completedStep.position, now, window);
  const nextStep = steps.find((step) => step.position === completedStep.position + 1);

  if (!nextDue || !nextStep) {
    await db
      .update(sequenceEnrollments)
      .set({
        status: "completed",
        completedAt: now,
        nextStepDueAt: null,
        updatedAt: now,
      })
      .where(eq(sequenceEnrollments.id, enrollment.id));
    await recordActivity({
      workspaceId: enrollment.workspaceId,
      sequenceId: enrollment.sequenceId,
      enrollmentId: enrollment.id,
      personId: enrollment.personId,
      type: "completed",
      message: "Enrollment completed.",
    });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(sequenceEnrollmentSteps)
      .set({ dueAt: nextDue, status: "pending", updatedAt: now })
      .where(eq(sequenceEnrollmentSteps.id, nextStep.id));
    await tx
      .update(sequenceEnrollments)
      .set({
        currentPosition: nextStep.position,
        nextStepDueAt: nextDue,
        updatedAt: now,
      })
      .where(eq(sequenceEnrollments.id, enrollment.id));
  });
}

async function countSentForGmail(workspaceId: string, gmailIntegrationId: string, since: Date) {
  const [result] = await db
    .select({ totalCount: count() })
    .from(sequenceActivityEvents)
    .where(
      and(
        eq(sequenceActivityEvents.workspaceId, workspaceId),
        inArray(sequenceActivityEvents.type, ["email_sent", "email_would_send"]),
        gte(sequenceActivityEvents.createdAt, since),
        sql`${sequenceActivityEvents.metadata}->>'gmailIntegrationId' = ${gmailIntegrationId}`,
      ),
    );

  return Number(result?.totalCount ?? 0);
}

async function createUnsubscribeUrl(input: {
  workspaceId: string;
  sequenceId: string;
  enrollmentId: string;
  personId: string;
  email: string;
}) {
  const token = createPublicToken();
  await db.insert(sequenceUnsubscribeTokens).values({
    workspaceId: input.workspaceId,
    sequenceId: input.sequenceId,
    enrollmentId: input.enrollmentId,
    personId: input.personId,
    email: normalizeEmailAddress(input.email),
    tokenHash: hashPublicToken(token),
  });

  return `${env.WEB_URL}/unsubscribe/${encodeURIComponent(token)}`;
}

export async function executeDueSequenceWork(now = new Date(), limit = 25) {
  const dueRows = await db
    .select({
      step: sequenceEnrollmentSteps,
      enrollment: sequenceEnrollments,
      person: people,
      sequence: sequences,
      gmailIntegration: gmailIntegrations,
    })
    .from(sequenceEnrollmentSteps)
    .innerJoin(sequenceEnrollments, eq(sequenceEnrollmentSteps.enrollmentId, sequenceEnrollments.id))
    .innerJoin(people, eq(sequenceEnrollments.personId, people.id))
    .innerJoin(sequences, eq(sequenceEnrollments.sequenceId, sequences.id))
    .leftJoin(gmailIntegrations, eq(sequenceEnrollments.gmailIntegrationId, gmailIntegrations.id))
    .where(
      and(
        eq(sequenceEnrollmentSteps.status, "pending"),
        lte(sequenceEnrollmentSteps.dueAt, now),
        eq(sequenceEnrollments.status, "active"),
        eq(sequences.status, "published"),
      ),
    )
    .orderBy(asc(sequenceEnrollmentSteps.dueAt))
    .limit(limit);

  const results = [];
  for (const row of dueRows) {
    results.push(await executeEnrollmentStep(row, now));
  }

  return results;
}

async function executeEnrollmentStep(
  row: {
    step: typeof sequenceEnrollmentSteps.$inferSelect;
    enrollment: typeof sequenceEnrollments.$inferSelect;
    person: typeof people.$inferSelect;
    sequence: typeof sequences.$inferSelect;
    gmailIntegration: typeof gmailIntegrations.$inferSelect | null;
  },
  now: Date,
) {
  const { step, enrollment, person, sequence, gmailIntegration } = row;
  const [claimedStep] = await db
    .update(sequenceEnrollmentSteps)
    .set({
      status: "processing",
      attempts: step.attempts + 1,
      updatedAt: now,
    })
    .where(and(eq(sequenceEnrollmentSteps.id, step.id), eq(sequenceEnrollmentSteps.status, "pending")))
    .returning();

  if (!claimedStep) {
    return { stepId: step.id, status: "skipped" };
  }

  const window = gmailIntegration?.sendingWindow ?? sequence.sendingWindow;

  if (claimedStep.type === "wait") {
    await db
      .update(sequenceEnrollmentSteps)
      .set({ status: "completed", processedAt: now, updatedAt: now })
      .where(eq(sequenceEnrollmentSteps.id, claimedStep.id));
    await advanceEnrollment(enrollment, claimedStep, now, window);
    return { stepId: claimedStep.id, status: "completed" };
  }

  if (claimedStep.type === "general_task" || claimedStep.type === "linkedin_task") {
    const config = claimedStep.stepSnapshot.config;
    const fallbackTitle =
      typeof config.title === "string" && config.title.trim()
        ? config.title.trim()
        : `${readableStepType(claimedStep.type)} for ${person.name}`;
    const taskBody = await generateTaskCopy({
      prompt: typeof config.prompt === "string" ? config.prompt : undefined,
      personName: person.name,
      fallback:
        typeof config.body === "string" && config.body.trim()
          ? config.body.trim()
          : `Complete ${readableStepType(claimedStep.type).toLowerCase()} for ${person.name}.`,
    });
    const [task] = await db
      .insert(sequenceTasks)
      .values({
        workspaceId: enrollment.workspaceId,
        sequenceId: enrollment.sequenceId,
        enrollmentId: enrollment.id,
        enrollmentStepId: claimedStep.id,
        personId: person.id,
        assignedToId: enrollment.enrolledById,
        type: claimedStep.type,
        title: fallbackTitle,
        body: taskBody,
        dueAt: now,
      })
      .returning();

    await db.transaction(async (tx) => {
      await tx
        .update(sequenceEnrollmentSteps)
        .set({ createdTaskId: task?.id, status: "processing", updatedAt: now })
        .where(eq(sequenceEnrollmentSteps.id, claimedStep.id));
      await tx
        .update(sequenceEnrollments)
        .set({ nextStepDueAt: null, updatedAt: now })
        .where(eq(sequenceEnrollments.id, enrollment.id));
    });

    await recordActivity({
      workspaceId: enrollment.workspaceId,
      sequenceId: enrollment.sequenceId,
      enrollmentId: enrollment.id,
      personId: person.id,
      type: "task_created",
      message: `${readableStepType(claimedStep.type)} was created.`,
      metadata: { taskId: task?.id },
    });
    return { stepId: claimedStep.id, status: "task_created" };
  }

  if (!person.email) {
    await failEnrollmentStep({
      workspaceId: enrollment.workspaceId,
      step: claimedStep,
      enrollment,
      message: `${person.name} does not have an email address.`,
      taskTitle: "Add recipient email before continuing sequence",
      now,
    });
    return { stepId: claimedStep.id, status: "failed" };
  }

  const normalizedEmail = normalizeEmailAddress(person.email);
  const suppression = await db.query.sequenceSuppressions.findFirst({
    where: and(
      eq(sequenceSuppressions.workspaceId, enrollment.workspaceId),
      eq(sequenceSuppressions.email, normalizedEmail),
    ),
  });
  if (suppression) {
    await failEnrollmentStep({
      workspaceId: enrollment.workspaceId,
      step: claimedStep,
      enrollment,
      message: `${normalizedEmail} is suppressed for this workspace.`,
      taskTitle: "Recipient has unsubscribed",
      now,
      status: "unsubscribed",
    });
    return { stepId: claimedStep.id, status: "unsubscribed" };
  }

  if (!gmailIntegration || gmailIntegration.status !== "connected") {
    await failEnrollmentStep({
      workspaceId: enrollment.workspaceId,
      step: claimedStep,
      enrollment,
      message: "Reconnect Gmail before this sequence can continue.",
      taskTitle: "Reconnect Gmail sender",
      now,
      status: "paused",
    });
    return { stepId: claimedStep.id, status: "paused" };
  }

  if (
    !gmailIntegration.grantedScopes.includes(GMAIL_SEND_SCOPE) ||
    !gmailIntegration.grantedScopes.includes(GMAIL_METADATA_SCOPE)
  ) {
    await db
      .update(gmailIntegrations)
      .set({ status: "reconnect_required", updatedAt: now })
      .where(eq(gmailIntegrations.id, gmailIntegration.id));
    await failEnrollmentStep({
      workspaceId: enrollment.workspaceId,
      step: claimedStep,
      enrollment,
      message: "Gmail needs send and metadata scopes before automation can continue.",
      taskTitle: "Reconnect Gmail permissions",
      now,
      status: "paused",
    });
    return { stepId: claimedStep.id, status: "paused" };
  }

  if (!isWithinSendingWindow(now, window)) {
    const nextDue = nextSendingWindowSlot(now, window);
    await db.transaction(async (tx) => {
      await tx
        .update(sequenceEnrollmentSteps)
        .set({ status: "pending", dueAt: nextDue, updatedAt: now })
        .where(eq(sequenceEnrollmentSteps.id, claimedStep.id));
      await tx
        .update(sequenceEnrollments)
        .set({ nextStepDueAt: nextDue, updatedAt: now })
        .where(eq(sequenceEnrollments.id, enrollment.id));
    });
    return { stepId: claimedStep.id, status: "rescheduled", dueAt: nextDue };
  }

  const sentToday = await countSentForGmail(
    enrollment.workspaceId,
    gmailIntegration.id,
    startOfUtcDay(now),
  );
  const sentThisHour = await countSentForGmail(
    enrollment.workspaceId,
    gmailIntegration.id,
    startOfUtcHour(now),
  );
  if (sentToday >= gmailIntegration.dailyLimit || sentThisHour >= gmailIntegration.hourlyLimit) {
    const nextDue = new Date(now);
    nextDue.setUTCHours(nextDue.getUTCHours() + 1, 0, 0, 0);
    await db
      .update(sequenceEnrollmentSteps)
      .set({ status: "pending", dueAt: nextSendingWindowSlot(nextDue, window), updatedAt: now })
      .where(eq(sequenceEnrollmentSteps.id, claimedStep.id));
    return { stepId: claimedStep.id, status: "rate_limited" };
  }

  const config = claimedStep.stepSnapshot.config;
  const subject = typeof config.subject === "string" ? config.subject : "";
  const body = typeof config.body === "string" ? config.body : "";
  if (!subject.trim() || !body.trim()) {
    await failEnrollmentStep({
      workspaceId: enrollment.workspaceId,
      step: claimedStep,
      enrollment,
      message: "Email step is missing saved subject or body.",
      taskTitle: "Fix sequence email content",
      now,
    });
    return { stepId: claimedStep.id, status: "failed" };
  }

  const unsubscribeUrl = await createUnsubscribeUrl({
    workspaceId: enrollment.workspaceId,
    sequenceId: enrollment.sequenceId,
    enrollmentId: enrollment.id,
    personId: person.id,
    email: normalizedEmail,
  });
  const sendResult = await sendSequenceEmail({
    accessToken: decryptSecretToken(gmailIntegration.accessTokenEncrypted, tokenSecret()),
    fromEmail: gmailIntegration.email,
    toEmail: normalizedEmail,
    subject,
    body,
    unsubscribeUrl,
  });
  const activityType = sendResult.live ? "email_sent" : "email_would_send";

  await db.transaction(async (tx) => {
    await tx
      .update(sequenceEnrollmentSteps)
      .set({
        status: "completed",
        gmailMessageId: sendResult.gmailMessageId,
        gmailThreadId: sendResult.gmailThreadId,
        processedAt: now,
        updatedAt: now,
      })
      .where(eq(sequenceEnrollmentSteps.id, claimedStep.id));
    await tx
      .update(people)
      .set({ lastContactedAt: now, updatedAt: now })
      .where(eq(people.id, person.id));
  });
  await recordActivity({
    workspaceId: enrollment.workspaceId,
    sequenceId: enrollment.sequenceId,
    enrollmentId: enrollment.id,
    personId: person.id,
    type: activityType,
    message: sendResult.live ? "Sequence email sent." : "Sequence email would send.",
    metadata: {
      gmailIntegrationId: gmailIntegration.id,
      gmailThreadId: sendResult.gmailThreadId,
      gmailMessageId: sendResult.gmailMessageId,
      unsubscribeUrl,
    },
  });
  await advanceEnrollment(enrollment, claimedStep, now, window);

  return { stepId: claimedStep.id, status: activityType };
}

export async function completeSequenceTask(workspaceId: string, taskId: string, now = new Date()) {
  const task = await db.query.sequenceTasks.findFirst({
    where: and(eq(sequenceTasks.workspaceId, workspaceId), eq(sequenceTasks.id, taskId)),
  });

  if (!task) throw new AppError("Sequence task not found", STATUS_CODES.NOT_FOUND);
  if (task.status !== "open") return task;

  const [updatedTask] = await db
    .update(sequenceTasks)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(sequenceTasks.id, taskId))
    .returning();

  if (task.enrollmentId && task.enrollmentStepId) {
    const enrollment = await db.query.sequenceEnrollments.findFirst({
      where: eq(sequenceEnrollments.id, task.enrollmentId),
      with: { gmailIntegration: true, sequence: true },
    });
    const step = await db.query.sequenceEnrollmentSteps.findFirst({
      where: eq(sequenceEnrollmentSteps.id, task.enrollmentStepId),
    });
    if (enrollment && step) {
      await db
        .update(sequenceEnrollmentSteps)
        .set({ status: "completed", processedAt: now, updatedAt: now })
        .where(eq(sequenceEnrollmentSteps.id, step.id));
      await advanceEnrollment(
        enrollment,
        step,
        now,
        enrollment.gmailIntegration?.sendingWindow ?? enrollment.sequence.sendingWindow,
      );
    }
  }

  await recordActivity({
    workspaceId,
    sequenceId: task.sequenceId,
    enrollmentId: task.enrollmentId,
    personId: task.personId,
    type: "task_completed",
    message: `Task "${task.title}" was completed.`,
    metadata: { taskId },
  });

  return updatedTask;
}

export async function detectSequenceReplies(
  workspaceId: string,
  replies: Array<{ gmailThreadId: string; repliedAt: Date }>,
) {
  const detected = [];
  for (const reply of replies) {
    const step = await db.query.sequenceEnrollmentSteps.findFirst({
      where: and(
        eq(sequenceEnrollmentSteps.workspaceId, workspaceId),
        eq(sequenceEnrollmentSteps.gmailThreadId, reply.gmailThreadId),
      ),
    });
    if (!step) continue;

    const enrollment = await db.query.sequenceEnrollments.findFirst({
      where: and(
        eq(sequenceEnrollments.workspaceId, workspaceId),
        eq(sequenceEnrollments.id, step.enrollmentId),
      ),
    });
    if (!enrollment || enrollment.status !== "active") continue;

    await db
      .update(sequenceEnrollments)
      .set({ status: "replied", nextStepDueAt: null, updatedAt: reply.repliedAt })
      .where(eq(sequenceEnrollments.id, enrollment.id));
    await recordActivity({
      workspaceId,
      sequenceId: enrollment.sequenceId,
      enrollmentId: enrollment.id,
      personId: enrollment.personId,
      type: "reply_detected",
      message: "Gmail reply detected for this enrollment.",
      metadata: { gmailThreadId: reply.gmailThreadId },
    });
    detected.push(enrollment.id);
  }

  return detected;
}

export async function listGmailIntegrations(workspaceId: string, userId: string) {
  return db.query.gmailIntegrations.findMany({
    where: and(eq(gmailIntegrations.workspaceId, workspaceId), eq(gmailIntegrations.userId, userId)),
    columns: {
      id: true,
      workspaceId: true,
      userId: true,
      email: true,
      status: true,
      grantedScopes: true,
      tokenExpiresAt: true,
      lastSyncAt: true,
      timezone: true,
      sendingWindow: true,
      dailyLimit: true,
      hourlyLimit: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function connectGmail(workspaceId: string, userId: string, input: ConnectGmailInput) {
  const [integration] = await db
    .insert(gmailIntegrations)
    .values({
      workspaceId,
      userId,
      email: normalizeEmailAddress(input.email),
      status: "connected",
      grantedScopes: input.grantedScopes,
      accessTokenEncrypted: encryptSecretToken(input.accessToken, tokenSecret()),
      refreshTokenEncrypted: encryptSecretToken(input.refreshToken, tokenSecret()),
      tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
      timezone: input.timezone,
      sendingWindow: defaultSendingWindow(input.sendingWindow),
      dailyLimit: input.dailyLimit,
      hourlyLimit: input.hourlyLimit,
    })
    .onConflictDoUpdate({
      target: [gmailIntegrations.workspaceId, gmailIntegrations.userId, gmailIntegrations.email],
      set: {
        status: "connected",
        grantedScopes: input.grantedScopes,
        accessTokenEncrypted: encryptSecretToken(input.accessToken, tokenSecret()),
        refreshTokenEncrypted: encryptSecretToken(input.refreshToken, tokenSecret()),
        tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
        timezone: input.timezone,
        sendingWindow: defaultSendingWindow(input.sendingWindow),
        dailyLimit: input.dailyLimit,
        hourlyLimit: input.hourlyLimit,
        updatedAt: new Date(),
      },
    })
    .returning();

  return integration;
}

export async function disconnectGmail(workspaceId: string, userId: string, gmailIntegrationId: string) {
  const integration = await db.query.gmailIntegrations.findFirst({
    where: and(
      eq(gmailIntegrations.workspaceId, workspaceId),
      eq(gmailIntegrations.userId, userId),
      eq(gmailIntegrations.id, gmailIntegrationId),
    ),
  });
  if (!integration) throw new AppError("Gmail integration not found", STATUS_CODES.NOT_FOUND);

  await db.transaction(async (tx) => {
    await tx
      .update(sequenceEnrollments)
      .set({
        status: "paused",
        lastError: "Gmail sender was disconnected.",
        pausedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sequenceEnrollments.gmailIntegrationId, gmailIntegrationId));
    await tx.delete(gmailIntegrations).where(eq(gmailIntegrations.id, gmailIntegrationId));
  });

  await recordActivity({
    workspaceId,
    type: "gmail_warning",
    message: `Gmail sender ${integration.email} was disconnected.`,
    metadata: { gmailIntegrationId },
  });

  return integration;
}

export async function getSequenceDashboard(workspaceId: string, now = new Date()) {
  const dayStart = startOfUtcDay(now);
  const [active, sentToday, replies, failed, dueTasks, warnings, activity] = await Promise.all([
    db
      .select({ totalCount: count() })
      .from(sequenceEnrollments)
      .where(
        and(
          eq(sequenceEnrollments.workspaceId, workspaceId),
          eq(sequenceEnrollments.status, "active"),
        ),
      ),
    db
      .select({ totalCount: count() })
      .from(sequenceActivityEvents)
      .where(
        and(
          eq(sequenceActivityEvents.workspaceId, workspaceId),
          inArray(sequenceActivityEvents.type, ["email_sent", "email_would_send"]),
          gte(sequenceActivityEvents.createdAt, dayStart),
        ),
      ),
    db
      .select({ totalCount: count() })
      .from(sequenceActivityEvents)
      .where(
        and(
          eq(sequenceActivityEvents.workspaceId, workspaceId),
          eq(sequenceActivityEvents.type, "reply_detected"),
        ),
      ),
    db
      .select({ totalCount: count() })
      .from(sequenceEnrollmentSteps)
      .where(
        and(
          eq(sequenceEnrollmentSteps.workspaceId, workspaceId),
          eq(sequenceEnrollmentSteps.status, "failed"),
        ),
      ),
    db.query.sequenceTasks.findMany({
      where: and(
        eq(sequenceTasks.workspaceId, workspaceId),
        eq(sequenceTasks.status, "open"),
        lte(sequenceTasks.dueAt, now),
      ),
      with: { person: { columns: { id: true, name: true, email: true } } },
      orderBy: (table, { asc: orderAsc }) => [orderAsc(table.dueAt)],
      limit: 20,
    }),
    db.query.gmailIntegrations.findMany({
      where: and(
        eq(gmailIntegrations.workspaceId, workspaceId),
        inArray(gmailIntegrations.status, ["reconnect_required", "disconnected"]),
      ),
      columns: { id: true, email: true, status: true, updatedAt: true },
      limit: 20,
    }),
    db.query.sequenceActivityEvents.findMany({
      where: eq(sequenceActivityEvents.workspaceId, workspaceId),
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
      limit: 20,
    }),
  ]);

  return {
    counters: {
      activeEnrollments: Number(active[0]?.totalCount ?? 0),
      emailsSentToday: Number(sentToday[0]?.totalCount ?? 0),
      repliesDetected: Number(replies[0]?.totalCount ?? 0),
      failedSteps: Number(failed[0]?.totalCount ?? 0),
    },
    dueTasks,
    gmailWarnings: warnings,
    recentActivity: activity,
  };
}

export async function previewUnsubscribe(token: string) {
  const tokenHash = hashPublicToken(token);
  const unsubscribeToken = await db.query.sequenceUnsubscribeTokens.findFirst({
    where: eq(sequenceUnsubscribeTokens.tokenHash, tokenHash),
    with: {
      sequence: { columns: { id: true, name: true } },
    },
  });

  if (!unsubscribeToken) {
    throw new AppError("Unsubscribe link not found", STATUS_CODES.NOT_FOUND);
  }

  const suppression = await db.query.sequenceSuppressions.findFirst({
    where: and(
      eq(sequenceSuppressions.workspaceId, unsubscribeToken.workspaceId),
      eq(sequenceSuppressions.email, unsubscribeToken.email),
    ),
  });

  return {
    email: unsubscribeToken.email,
    sequence: unsubscribeToken.sequence,
    alreadyUnsubscribed: Boolean(suppression),
  };
}

export async function confirmUnsubscribe(token: string, now = new Date()) {
  const tokenHash = hashPublicToken(token);
  const unsubscribeToken = await db.query.sequenceUnsubscribeTokens.findFirst({
    where: eq(sequenceUnsubscribeTokens.tokenHash, tokenHash),
    with: {
      sequence: { columns: { id: true, name: true } },
    },
  });

  if (!unsubscribeToken) {
    throw new AppError("Unsubscribe link not found", STATUS_CODES.NOT_FOUND);
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(sequenceSuppressions)
      .values({
        workspaceId: unsubscribeToken.workspaceId,
        email: unsubscribeToken.email,
        reason: "unsubscribe",
        source: "public_unsubscribe",
      })
      .onConflictDoNothing();
    await tx
      .update(sequenceUnsubscribeTokens)
      .set({ consumedAt: now })
      .where(eq(sequenceUnsubscribeTokens.id, unsubscribeToken.id));
    await tx
      .update(sequenceEnrollments)
      .set({
        status: "unsubscribed",
        nextStepDueAt: null,
        updatedAt: now,
      })
      .where(eq(sequenceEnrollments.id, unsubscribeToken.enrollmentId));
  });

  await recordActivity({
    workspaceId: unsubscribeToken.workspaceId,
    sequenceId: unsubscribeToken.sequenceId,
    enrollmentId: unsubscribeToken.enrollmentId,
    personId: unsubscribeToken.personId,
    type: "unsubscribed",
    message: `${unsubscribeToken.email} unsubscribed.`,
  });

  return {
    email: unsubscribeToken.email,
    sequence: unsubscribeToken.sequence,
  };
}

export async function generateSequenceEmailContent(prompt: string) {
  return generateEmailContent(prompt);
}
