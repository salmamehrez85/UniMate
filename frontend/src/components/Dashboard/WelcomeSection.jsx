export function WelcomeSection({ userName = "Student", tasksToday = 0 }) {
  const taskText =
    tasksToday === 0
      ? "You have no tasks due today. Great work!"
      : `You have ${tasksToday} task${tasksToday > 1 ? "s" : ""} due today. Keep making progress toward your academic goals.`;

  return (
    <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-12 shadow-lg">
      <h2 className="text-4xl font-bold mb-4 text-black leading-tight">
        Welcome back, {userName}
      </h2>
      <p className="text-black text-lg leading-relaxed max-w-2xl">{taskText}</p>
    </div>
  );
}
