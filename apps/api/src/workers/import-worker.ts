import { logger } from "@/config/logger.config.js";
import { executeDueImportWork } from "@/services/import.service.js";

const POLL_INTERVAL_MS = 15_000;
let running = false;

export async function runImportWorkerTick() {
  if (running) {
    logger.warn("Import worker tick skipped because the previous tick is still running");
    return [];
  }

  running = true;
  try {
    const results = await executeDueImportWork(new Date());
    logger.info({ processed: results.length }, "Import worker tick completed");
    return results;
  } catch (error) {
    logger.error({ error }, "Import worker tick failed");
    throw error;
  } finally {
    running = false;
  }
}

if (import.meta.main) {
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "Import worker started");
  setInterval(() => {
    void runImportWorkerTick();
  }, POLL_INTERVAL_MS);
  void runImportWorkerTick();
}
