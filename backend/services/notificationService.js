const nodemailer = require("nodemailer");
const Notification = require("../model/Notification");

// ─── Email transporter (reuses same pattern as authController) ───────────────

async function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      transporter: nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      }),
      from: `"UniMate" <${process.env.EMAIL_USER}>`,
    };
  }
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transporter, from: `"UniMate" <${testAccount.user}>`, isTest: true };
}

// ─── Core: create a Notification document ────────────────────────────────────

/**
 * Create a notification in the DB.
 * If the user has email enabled for this type, also send an email.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {"deadline"|"quiz"|"performance"|"summary"} opts.type
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {object} [opts.metadata]
 * @param {string} [opts.userEmail]   - supply to also attempt email delivery
 * @param {boolean} [opts.sendEmail]  - whether to send email
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
  userEmail,
  sendEmail = false,
}) {
  // Avoid duplicate notifications for the same event on the same day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const duplicate = await Notification.findOne({
    userId,
    type,
    title,
    createdAt: { $gte: startOfDay },
  });

  if (duplicate) return duplicate;

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    metadata,
  });

  if (sendEmail && userEmail) {
    try {
      await sendEmailNotification({ to: userEmail, title, message });
      notification.emailSent = true;
      await notification.save();
    } catch (err) {
      console.error("[NotificationService] Email failed:", err.message);
    }
  }

  return notification;
}

// ─── Email delivery ───────────────────────────────────────────────────────────

async function sendEmailNotification({ to, title, message }) {
  const { transporter, from, isTest } = await createTransporter();

  const mailOptions = {
    from,
    to,
    subject: `UniMate – ${title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#163C60;">${title}</h2>
        <p style="color:#374151;">${message}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:12px;">UniMate – Your University Companion</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (isTest) {
    console.log(
      "[NotificationService] Dev email preview:",
      nodemailer.getTestMessageUrl(info),
    );
  }
}

// ─── Bulk deadline scan (called by scheduler) ────────────────────────────────

/**
 * Scan all active courses for tasks due in the next `withinDays` days
 * and create notifications (+ optional emails) for each user.
 */
async function scanDeadlines(withinDays = 3) {
  const Course = require("../model/Course");
  const User = require("../model/User");

  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  // Fetch active courses with incomplete tasks in range
  const courses = await Course.find({
    "tasks.dueDate": { $gte: now, $lte: cutoff },
    "tasks.status": { $ne: "done" },
  }).lean();

  if (!courses.length) return;

  // Group by userId to batch user lookups
  const userIds = [...new Set(courses.map((c) => String(c.userId)))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("email notificationPrefs")
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));

  for (const course of courses) {
    const user = userMap[String(course.userId)];
    if (!user) continue;

    const prefs = user.notificationPrefs || {};
    if (prefs.assignments === false) continue; // user opted out

    for (const task of course.tasks) {
      if (task.status === "done" || !task.dueDate) continue;

      const due = new Date(task.dueDate);
      if (due < now || due > cutoff) continue;

      const daysLeft = Math.ceil((due - now) / 86400000);
      const urgency =
        daysLeft === 0
          ? "today"
          : daysLeft === 1
            ? "tomorrow"
            : `in ${daysLeft} days`;
      const title = `Task due ${urgency}: ${task.title}`;
      const message = `Your task "${task.title}" for ${course.name || course.code} is due ${urgency}. Make sure to complete it on time.`;

      await createNotification({
        userId: course.userId,
        type: "deadline",
        title,
        message,
        metadata: { courseId: course._id, taskId: task.id, daysLeft },
        userEmail: user.email,
        sendEmail: prefs.emailDeadlines !== false && daysLeft <= 1,
      });
    }
  }
}

module.exports = { createNotification, scanDeadlines, sendEmailNotification };
