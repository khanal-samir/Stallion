import { z } from "zod";
import { idSchema } from "./common.validator.js";
import {
  DEFAULT_GMAIL_DAILY_LIMIT,
  DEFAULT_GMAIL_HOURLY_LIMIT,
  DEFAULT_SEQUENCE_SENDING_WINDOW,
  GMAIL_CONNECTION_STATUS_VALUES,
  SEQUENCE_ACTIVITY_TYPE_VALUES,
  SEQUENCE_ENROLLMENT_STATUS_VALUES,
  SEQUENCE_ENROLLMENT_STEP_STATUS_VALUES,
  SEQUENCE_STATUS_VALUES,
  SEQUENCE_STEP_TYPE_VALUES,
  SEQUENCE_TASK_STATUS_VALUES,
  SEQUENCE_TASK_TYPE_VALUES,
} from "../types/sequence.types.js";

const optionalTrimmedString = (max: number) => z.string().trim().min(1).max(max).optional();

export const sequenceStatusSchema = z.enum(SEQUENCE_STATUS_VALUES);
export const sequenceStepTypeSchema = z.enum(SEQUENCE_STEP_TYPE_VALUES);
export const sequenceEnrollmentStatusSchema = z.enum(SEQUENCE_ENROLLMENT_STATUS_VALUES);
export const sequenceEnrollmentStepStatusSchema = z.enum(SEQUENCE_ENROLLMENT_STEP_STATUS_VALUES);
export const sequenceTaskStatusSchema = z.enum(SEQUENCE_TASK_STATUS_VALUES);
export const sequenceTaskTypeSchema = z.enum(SEQUENCE_TASK_TYPE_VALUES);
export const sequenceActivityTypeSchema = z.enum(SEQUENCE_ACTIVITY_TYPE_VALUES);
export const gmailConnectionStatusSchema = z.enum(GMAIL_CONNECTION_STATUS_VALUES);

export const sequenceSendingWindowSchema = z.object({
  weekdays: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .default([...DEFAULT_SEQUENCE_SENDING_WINDOW.weekdays]),
  startHour: z.coerce
    .number()
    .int()
    .min(0)
    .max(23)
    .default(DEFAULT_SEQUENCE_SENDING_WINDOW.startHour),
  endHour: z.coerce
    .number()
    .int()
    .min(1)
    .max(24)
    .default(DEFAULT_SEQUENCE_SENDING_WINDOW.endHour),
});

export const emailStepConfigSchema = z.object({
  prompt: z.string().trim().max(5_000).optional().default(""),
  subject: z.string().trim().max(255).optional().default(""),
  body: z.string().trim().max(20_000).optional().default(""),
});

export const waitStepConfigSchema = z.object({
  days: z.coerce.number().int().min(0).max(365).default(1),
});

export const taskStepConfigSchema = z.object({
  prompt: z.string().trim().max(5_000).optional().default(""),
  title: z.string().trim().max(255).optional().default(""),
  body: z.string().trim().max(20_000).optional().default(""),
});

export const sequenceStepConfigSchema = z.record(z.string(), z.unknown());

export const sequenceDraftStepInputSchema = z.object({
  id: idSchema.optional(),
  type: sequenceStepTypeSchema,
  name: z.string().trim().min(1).max(255),
  position: z.coerce.number().int().min(0).max(99),
  config: sequenceStepConfigSchema,
});

export const listSequencesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  status: sequenceStatusSchema.optional(),
  search: optionalTrimmedString(255),
});

export const sequenceParamsSchema = z.object({ id: idSchema });
export const sequenceStepParamsSchema = z.object({ id: idSchema, stepId: idSchema });
export const sequenceEnrollmentParamsSchema = z.object({ enrollmentId: idSchema });
export const sequenceTaskParamsSchema = z.object({ taskId: idSchema });
export const gmailIntegrationParamsSchema = z.object({ gmailIntegrationId: idSchema });
export const unsubscribeTokenParamsSchema = z.object({
  token: z.string().trim().min(32).max(512),
});

export const createSequenceSchema = z.object({
  name: z.string().trim().min(1).max(255),
  timezone: z.string().trim().min(1).max(100).optional().default("UTC"),
  sendingWindow: sequenceSendingWindowSchema.optional(),
});

export const updateSequenceSchema = z.object({
  name: optionalTrimmedString(255),
  timezone: optionalTrimmedString(100),
  sendingWindow: sequenceSendingWindowSchema.optional(),
  steps: z.array(sequenceDraftStepInputSchema).min(1).max(50).optional(),
});

export const updateSequenceStepSchema = z.object({
  name: optionalTrimmedString(255),
  config: sequenceStepConfigSchema.optional(),
});

export const enrollPeopleSchema = z.object({
  personIds: z.array(idSchema).min(1).max(250),
  gmailIntegrationId: idSchema.optional(),
});

export const listEnrollmentsQuerySchema = z.object({
  status: sequenceEnrollmentStatusSchema.optional(),
});

export const connectGmailSchema = z.object({
  email: z.string().trim().email().max(255),
  grantedScopes: z.array(z.string().trim().min(1).max(255)).min(1),
  accessToken: z.string().min(1).max(10_000),
  refreshToken: z.string().min(1).max(10_000),
  tokenExpiresAt: z.string().datetime().optional(),
  timezone: z.string().trim().min(1).max(100).optional().default("UTC"),
  dailyLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .default(DEFAULT_GMAIL_DAILY_LIMIT),
  hourlyLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_GMAIL_HOURLY_LIMIT),
  sendingWindow: sequenceSendingWindowSchema.optional(),
});

export const generateEmailContentSchema = z.object({
  prompt: z.string().trim().min(1).max(5_000),
});

export type SequenceStatus = z.infer<typeof sequenceStatusSchema>;
export type SequenceStepType = z.infer<typeof sequenceStepTypeSchema>;
export type SequenceEnrollmentStatus = z.infer<typeof sequenceEnrollmentStatusSchema>;
export type SequenceEnrollmentStepStatus = z.infer<typeof sequenceEnrollmentStepStatusSchema>;
export type SequenceTaskStatus = z.infer<typeof sequenceTaskStatusSchema>;
export type SequenceTaskType = z.infer<typeof sequenceTaskTypeSchema>;
export type SequenceActivityType = z.infer<typeof sequenceActivityTypeSchema>;
export type GmailConnectionStatus = z.infer<typeof gmailConnectionStatusSchema>;
export type SequenceSendingWindow = z.infer<typeof sequenceSendingWindowSchema>;
export type SequenceStepConfig = z.infer<typeof sequenceStepConfigSchema>;
export type SequenceDraftStepInput = z.infer<typeof sequenceDraftStepInputSchema>;
export type ListSequencesQuery = z.infer<typeof listSequencesQuerySchema>;
export type CreateSequenceInput = z.infer<typeof createSequenceSchema>;
export type UpdateSequenceInput = z.infer<typeof updateSequenceSchema>;
export type UpdateSequenceStepInput = z.infer<typeof updateSequenceStepSchema>;
export type SequenceParams = z.infer<typeof sequenceParamsSchema>;
export type SequenceStepParams = z.infer<typeof sequenceStepParamsSchema>;
export type EnrollPeopleInput = z.infer<typeof enrollPeopleSchema>;
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
export type ConnectGmailInput = z.infer<typeof connectGmailSchema>;
export type GenerateEmailContentInput = z.infer<typeof generateEmailContentSchema>;
