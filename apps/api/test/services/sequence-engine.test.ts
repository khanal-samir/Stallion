import { describe, expect, it } from "vitest";
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
  toStepSnapshot,
  validatePublishableSteps,
} from "@/services/sequence-engine.js";
import type { SequenceDraftStepInput } from "@workspace/validators/schemas/sequence";

const emailStep = (position = 0): SequenceDraftStepInput => ({
  type: "email",
  name: "Intro email",
  position,
  config: { subject: "Hello", body: "Hi there" },
});

describe("sequence engine behavior", () => {
  it("validates publishable linear steps and normalizes snapshots", () => {
    const steps = validatePublishableSteps([
      {
        type: "wait",
        name: "Wait",
        position: 1,
        config: { days: "2" },
      },
      emailStep(0),
    ]);

    expect(steps.map((step) => step.position)).toEqual([0, 1]);
    expect(toStepSnapshot(steps[1]!).config).toEqual({ days: 2 });
  });

  it("rejects incomplete email content and non-linear positions before publishing", () => {
    expect(() =>
      validatePublishableSteps([
        { type: "email", name: "Bad email", position: 0, config: { subject: "" } },
      ]),
    ).toThrow(AppError);
    expect(() => validatePublishableSteps([emailStep(1)])).toThrow(AppError);
  });

  it("schedules first emails and follow-ups inside the sending window", () => {
    const fridayAfterHours = new Date("2026-07-10T18:15:00.000Z");
    const mondayMorning = new Date("2026-07-13T09:00:00.000Z");
    const steps = [
      toStepSnapshot(emailStep(0)),
      toStepSnapshot({ type: "wait", name: "Wait", position: 1, config: { days: 2 } }),
      toStepSnapshot(emailStep(2)),
    ];

    expect(isWithinSendingWindow(mondayMorning, DEFAULT_SENDING_WINDOW)).toBe(true);
    expect(nextSendingWindowSlot(fridayAfterHours, DEFAULT_SENDING_WINDOW)).toEqual(mondayMorning);
    expect(firstStepDueAt(steps, fridayAfterHours, DEFAULT_SENDING_WINDOW)).toEqual(mondayMorning);
    expect(nextDueAtAfterStep(steps, 1, fridayAfterHours, DEFAULT_SENDING_WINDOW)).toEqual(
      mondayMorning,
    );
  });

  it("normalizes email addresses and protects token material", () => {
    const token = createPublicToken();
    const secret = "x".repeat(32);
    const encrypted = encryptSecretToken("gmail-refresh-token", secret);

    expect(token).toHaveLength(43);
    expect(hashPublicToken(token)).toHaveLength(64);
    expect(encrypted).not.toContain("gmail-refresh-token");
    expect(decryptSecretToken(encrypted, secret)).toBe("gmail-refresh-token");
    expect(normalizeEmailAddress(" Ada@Example.TEST ")).toBe("ada@example.test");
  });
});
