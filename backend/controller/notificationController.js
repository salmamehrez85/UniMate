const Notification = require("../model/Notification");
const User = require("../model/User");

// @desc   Get all notifications for current user (unread first, max 50)
// @route  GET /api/notifications
// @access Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error("getNotifications error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

// @desc   Mark one notification as read
// @route  PATCH /api/notifications/:id/read
// @access Private
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("markRead error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
};

// @desc   Mark all notifications as read
// @route  PATCH /api/notifications/read-all
// @access Private
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true },
    );
    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllRead error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notifications" });
  }
};

// @desc   Delete a notification
// @route  DELETE /api/notifications/:id
// @access Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete notification" });
  }
};

// @desc   Delete all notifications for current user
// @route  DELETE /api/notifications
// @access Private
exports.deleteAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res
      .status(200)
      .json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    console.error("deleteAll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to clear notifications" });
  }
};

// @desc   Get notification preferences for current user
// @route  GET /api/notifications/prefs
// @access Private
exports.getPrefs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("notificationPrefs")
      .lean();
    res
      .status(200)
      .json({ success: true, prefs: user.notificationPrefs || {} });
  } catch (error) {
    console.error("getPrefs error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch preferences" });
  }
};

// @desc   Update notification preferences for current user
// @route  PATCH /api/notifications/prefs
// @access Private
exports.updatePrefs = async (req, res) => {
  try {
    const allowed = ["assignments", "quizzes", "performance", "emailDeadlines"];
    const update = {};
    for (const key of allowed) {
      if (typeof req.body[key] === "boolean") {
        update[`notificationPrefs.${key}`] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, select: "notificationPrefs" },
    );

    res.status(200).json({ success: true, prefs: user.notificationPrefs });
  } catch (error) {
    console.error("updatePrefs error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update preferences" });
  }
};
