import { randomUUID } from "node:crypto";
import type {
  SequenceDraftStepInput,
  SequenceSendingWindow,
  SequenceStepType,
} from "@workspace/validators/schemas/sequence";
import { DEFAULT_SEQUENCE_SENDING_WINDOW } from "@workspace/validators/types/sequence";
import { AppError } from "@/lib/app-error.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import type { SequenceStepSnapshot } from "@/db/schema/sequence.schema.js";

export const DEFAULT_SENDING_WINDOW: SequenceSendingWindow = {
  weekdays: [...DEFAULT_SEQUENCE_SENDING_WINDOW.weekdays],
  startHour: DEFAULT_SEQUENCE_SENDING_WINDOW.startHour,
  endHour: DEFAULT_SEQUENCE_SENDING_WINDOW.endHour,
};

export function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

function getConfigString(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return typeof value === "string" ? value.trim() : "";
}

function getConfigNumber(config: Record<string, unknown>, key: string, fallback: number) {
  const value = config[key];
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }

  return fallback;
}

export function validatePublishableSteps(steps: SequenceDraftStepInput[]) {
  if (steps.length === 0) {
    throw new AppError("Add at least one sequence step before publishing", STATUS_CODES.BAD_REQUEST);
  }

  const positions = new Set<number>();
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  sortedSteps.forEach((step, index) => {
    if (positions.has(step.position)) {
      throw new AppError("Step positions must be unique", STATUS_CODES.BAD_REQUEST);
    }
    positions.add(step.position);

    if (step.position !== index) {
      throw new AppError("Step positions must be linear starting at zero", STATUS_CODES.BAD_REQUEST);
    }

    validateStepConfig(step.type, step.config);
  });

  return sortedSteps;
}

export function validateStepConfig(type: SequenceStepType, config: Record<string, unknown>) {
  if (type === "email") {
    if (!getConfigString(config, "subject") || !getConfigString(config, "body")) {
      throw new AppError("Email steps require a saved subject and body", STATUS_CODES.BAD_REQUEST);
    }
  }

  if (type === "wait") {
    const days = getConfigNumber(config, "days", 1);
    if (days < 0 || days > 365) {
      throw new AppError("Wait steps must be between 0 and 365 days", STATUS_CODES.BAD_REQUEST);
    }
  }
}

export function toStepSnapshot(step: SequenceDraftStepInput): SequenceStepSnapshot {
  return {
    id: step.id ?? randomUUID(),
    type: step.type,
    name: step.name,
    position: step.position,
    config: normalizeStepConfig(step.type, step.config),
  };
}

export function normalizeStepConfig(type: SequenceStepType, config: Record<string, unknown>) {
  if (type === "email") {
    return {
      prompt: getConfigString(config, "prompt"),
      subject: getConfigString(config, "subject"),
      body: getConfigString(config, "body"),
    };
  }

  if (type === "wait") {
    return {
      days: getConfigNumber(config, "days", 1),
    };
  }

  return {
    prompt: getConfigString(config, "prompt"),
    title: getConfigString(config, "title"),
    body: getConfigString(config, "body"),
  };
}

export function isEmailStep(step: SequenceStepSnapshot) {
  return step.type === "email";
}

export function sequenceHasEmailStep(steps: SequenceStepSnapshot[]) {
  return steps.some(isEmailStep);
}

export function isWithinSendingWindow(date: Date, window: SequenceSendingWindow) {
  const weekday = date.getUTCDay();
  const hour = date.getUTCHours();

  return window.weekdays.includes(weekday) && hour >= window.startHour && hour < window.endHour;
}

export function nextSendingWindowSlot(date: Date, window: SequenceSendingWindow) {
  if (isWithinSendingWindow(date, window)) {
    return date;
  }

  const candidate = new Date(date);
  candidate.setUTCMinutes(0, 0, 0);

  if (candidate.getUTCHours() >= window.endHour) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    candidate.setUTCHours(window.startHour, 0, 0, 0);
  }

  for (let offset = 0; offset <= 14; offset += 1) {
    const weekday = candidate.getUTCDay();
    if (window.weekdays.includes(weekday)) {
      if (candidate.getUTCHours() < window.startHour) {
        candidate.setUTCHours(window.startHour, 0, 0, 0);
        return candidate;
      }
      if (candidate.getUTCHours() >= window.startHour && candidate.getUTCHours() < window.endHour) {
        return candidate;
      }
    }

    candidate.setUTCDate(candidate.getUTCDate() + 1);
    candidate.setUTCHours(window.startHour, 0, 0, 0);
  }

  throw new AppError("No valid sending window could be calculated", STATUS_CODES.BAD_REQUEST);
}

export function firstStepDueAt(steps: SequenceStepSnapshot[], now: Date, window: SequenceSendingWindow) {
  const firstStep = steps[0];
  if (!firstStep) return null;

  return firstStep.type === "email" ? nextSendingWindowSlot(now, window) : now;
}

export function nextDueAtAfterStep(
  steps: SequenceStepSnapshot[],
  completedPosition: number,
  completedAt: Date,
  window: SequenceSendingWindow,
) {
  const completedStep = steps.find((step) => step.position === completedPosition);
  const nextStep = steps.find((step) => step.position === completedPosition + 1);
  if (!completedStep || !nextStep) {
    return null;
  }

  const baseDate = new Date(completedAt);
  if (completedStep.type === "wait") {
    const days = getConfigNumber(completedStep.config, "days", 1);
    baseDate.setUTCDate(baseDate.getUTCDate() + days);
  }

  return nextStep.type === "email" ? nextSendingWindowSlot(baseDate, window) : baseDate;
}

export function readableStepType(type: SequenceStepType) {
  const labels: Record<SequenceStepType, string> = {
    email: "Email",
    wait: "Wait",
    linkedin_task: "LinkedIn task",
    general_task: "General task",
  };

  return labels[type];
}
