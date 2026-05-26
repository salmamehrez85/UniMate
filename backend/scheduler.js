const cron = require("node-cron");
const {
  scanDeadlines,
  scanOverdueTasks,
  scanPhaseDeadlines,
  scanSpacedRepetition,
} = require("./services/notificationService");

/**
 * Start all background jobs.
 * Called once from app.js after DB connects.
 */
function startScheduler() {
  // Every hour: upcoming deadlines (≤3 days) + overdue tasks
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Running deadline & overdue scan...");
    try {
      await scanDeadlines(3);
      await scanOverdueTasks();
      await scanPhaseDeadlines();
      console.log("[Scheduler] Deadline & overdue scan complete.");
    } catch (err) {
      console.error("[Scheduler] Deadline scan failed:", err.message);
    }
  });

  // Every day at 8 AM: spaced repetition review reminders
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Running spaced repetition scan...");
    try {
      await scanSpacedRepetition();
      console.log("[Scheduler] Spaced repetition scan complete.");
    } catch (err) {
      console.error("[Scheduler] Spaced repetition scan failed:", err.message);
    }
  });

  console.log(
    "[Scheduler] Started — hourly deadline scan + daily 8AM review reminder.",
  );
}

module.exports = { startScheduler };
