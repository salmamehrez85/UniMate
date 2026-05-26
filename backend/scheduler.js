const cron = require("node-cron");
const { scanDeadlines } = require("./services/notificationService");

/**
 * Start all background jobs.
 * Called once from app.js after DB connects.
 */
function startScheduler() {
  // Run every hour on the hour
  // Scans tasks due within 3 days and creates deadline notifications
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Running deadline scan...");
    try {
      await scanDeadlines(3);
      console.log("[Scheduler] Deadline scan complete.");
    } catch (err) {
      console.error("[Scheduler] Deadline scan failed:", err.message);
    }
  });

  console.log("[Scheduler] Started — deadline scan runs every hour.");
}

module.exports = { startScheduler };
