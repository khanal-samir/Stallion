import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeDueImportWork: vi.fn(),
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/services/import.service.js", () => ({
  executeDueImportWork: mocks.executeDueImportWork,
}));
vi.mock("@/config/logger.config.js", () => ({
  logger: mocks.logger,
}));

import { runImportWorkerTick } from "@/workers/import-worker.js";

describe("import worker", () => {
  beforeEach(() => {
    mocks.executeDueImportWork.mockResolvedValue([{ jobId: "job", outcome: "loaded_batch" }]);
  });

  it("runs one due-work tick and logs the processed count", async () => {
    await expect(runImportWorkerTick()).resolves.toEqual([
      { jobId: "job", outcome: "loaded_batch" },
    ]);

    expect(mocks.executeDueImportWork).toHaveBeenCalledWith(expect.any(Date));
    expect(mocks.logger.info).toHaveBeenCalledWith({ processed: 1 }, "Import worker tick completed");
  });

  it("does not overlap concurrent ticks", async () => {
    let resolveWork: (value: never[]) => void = () => {};
    mocks.executeDueImportWork.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWork = resolve;
      }),
    );

    const firstTick = runImportWorkerTick();
    await expect(runImportWorkerTick()).resolves.toEqual([]);
    resolveWork([]);
    await firstTick;

    expect(mocks.executeDueImportWork).toHaveBeenCalledTimes(1);
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "Import worker tick skipped because the previous tick is still running",
    );
  });

  it("logs and rethrows a failing tick so the interval surfaces the error", async () => {
    const failure = new Error("extraction exploded");
    mocks.executeDueImportWork.mockRejectedValueOnce(failure);

    await expect(runImportWorkerTick()).rejects.toThrow("extraction exploded");
    expect(mocks.logger.error).toHaveBeenCalledWith({ error: failure }, "Import worker tick failed");

    // The running guard must be released even when the tick throws.
    await expect(runImportWorkerTick()).resolves.toEqual([
      { jobId: "job", outcome: "loaded_batch" },
    ]);
  });
});
