const getDayStart = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const getDaysUntil = (dueDate) => {
  const today = getDayStart(new Date());
  const due = getDayStart(dueDate);
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const formatDueLabel = (daysLeft) => {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day(s) overdue`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
};
