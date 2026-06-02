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
    try {
      await scanDeadlines(3);
      await scanOverdueTasks();
      await scanPhaseDeadlines();
    } catch (err) {
      console.error("[Scheduler] Deadline scan failed:", err.message);
    }
  });

  // Every day at 8 AM: spaced repetition review reminders
  cron.schedule("0 8 * * *", async () => {
    try {
      await scanSpacedRepetition();
    } catch (err) {
      console.error("[Scheduler] Spaced repetition scan failed:", err.message);
    }
  });
}

module.exports = { startScheduler };
