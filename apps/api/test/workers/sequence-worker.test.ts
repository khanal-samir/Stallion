import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeDueSequenceWork: vi.fn(),
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/services/sequence.service.js", () => ({
  executeDueSequenceWork: mocks.executeDueSequenceWork,
}));
vi.mock("@/config/logger.config.js", () => ({
  logger: mocks.logger,
}));

import { runSequenceWorkerTick } from "@/workers/sequence-worker.js";

describe("sequence worker", () => {
  beforeEach(() => {
    mocks.executeDueSequenceWork.mockResolvedValue([{ stepId: "step", status: "completed" }]);
  });

  it("runs one due-work tick and logs the processed count", async () => {
    await expect(runSequenceWorkerTick()).resolves.toEqual([
      { stepId: "step", status: "completed" },
    ]);

    expect(mocks.executeDueSequenceWork).toHaveBeenCalledWith(expect.any(Date));
    expect(mocks.logger.info).toHaveBeenCalledWith(
      { processed: 1 },
      "Sequence worker tick completed",
    );
  });

  it("does not overlap concurrent ticks", async () => {
    let resolveWork: (value: never[]) => void = () => {};
    mocks.executeDueSequenceWork.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWork = resolve;
      }),
    );

    const firstTick = runSequenceWorkerTick();
    await expect(runSequenceWorkerTick()).resolves.toEqual([]);
    resolveWork([]);
    await firstTick;

    expect(mocks.executeDueSequenceWork).toHaveBeenCalledTimes(1);
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "Sequence worker tick skipped because the previous tick is still running",
    );
  });
});
