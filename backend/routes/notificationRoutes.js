const express = require("express");
const router = express.Router();
const ctrl = require("../controller/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

// Preferences (before /:id routes to avoid conflicts)
router.route("/prefs").get(ctrl.getPrefs).patch(ctrl.updatePrefs);

// Bulk operations
router.route("/read-all").patch(ctrl.markAllRead);
router.route("/").get(ctrl.getNotifications).delete(ctrl.deleteAll);

// Single notification
router.route("/:id/read").patch(ctrl.markRead);
router.route("/:id").delete(ctrl.deleteNotification);

module.exports = router;
