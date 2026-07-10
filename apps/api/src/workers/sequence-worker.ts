import { logger } from "@/config/logger.config.js";
import { executeDueSequenceWork } from "@/services/sequence.service.js";

const POLL_INTERVAL_MS = 60_000;
let running = false;

export async function runSequenceWorkerTick() {
  if (running) {
    logger.warn("Sequence worker tick skipped because the previous tick is still running");
    return [];
  }

  running = true;
  try {
    const results = await executeDueSequenceWork(new Date());
    logger.info({ processed: results.length }, "Sequence worker tick completed");
    return results;
  } catch (error) {
    logger.error({ error }, "Sequence worker tick failed");
    throw error;
  } finally {
    running = false;
  }
}

if (import.meta.main) {
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "Sequence worker started");
  setInterval(() => {
    void runSequenceWorkerTick();
  }, POLL_INTERVAL_MS);
  void runSequenceWorkerTick();
}
