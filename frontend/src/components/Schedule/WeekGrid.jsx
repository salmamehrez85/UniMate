const BADGE_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
];

const colorCache = {};
let colorIdx = 0;
function badgeColorFor(code) {
  if (!colorCache[code]) {
    colorCache[code] = BADGE_COLORS[colorIdx % BADGE_COLORS.length];
    colorIdx++;
  }
  return colorCache[code];
}

// Format "10:00" → "10:00 AM", "14:00" → "2:00 PM", "1:00PM" → "1:00 PM"
function formatTime(raw) {
  if (!raw) return "";
  // Check if the full string ends with AM/PM (covers ranges like "1:00-2:30PM")
  const ampmSuffix = raw.match(/([AaPp][Mm])$/);
  const explicitPeriod = ampmSuffix ? ampmSuffix[1].toUpperCase() : null;
  // Take only the start time and strip any embedded AM/PM
  const start = raw
    .split(/[-–]/)[0]
    .trim()
    .replace(/\s*[AaPp][Mm]$/, "");
  const [h, m] = start.split(":").map(Number);
  if (isNaN(h)) return raw;
  if (explicitPeriod) {
    // Already 12-hour format – just normalise display
    const hour = h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, "0")} ${explicitPeriod}`;
  }
  // 24-hour format
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function ClassRow({ entry }) {
  const badge = badgeColorFor(entry.code);
  return (
    <div className="flex items-center gap-4 py-4 px-5 border-b border-gray-100 last:border-0">
      <span className="w-24 flex-shrink-0 text-sm text-gray-400 font-medium">
        {formatTime(entry.time)}
      </span>
      <span
        className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-md ${badge}`}>
        {entry.code}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {entry.name}
        </p>
        {entry.location && (
          <p className="text-xs text-gray-400 mt-0.5">{entry.location}</p>
        )}
      </div>
    </div>
  );
}

export function WeekGrid({ schedule }) {
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const todayLabel = DAYS[new Date().getDay()];

  // Show days that have classes + always show today even if empty
  const daysToShow = DAYS.filter(
    (d) => (schedule[d] && schedule[d].length > 0) || d === todayLabel,
  );

  if (daysToShow.length === 0) return null;

  return (
    <div className="space-y-4">
      {daysToShow.map((day) => {
        const entries = schedule[day] || [];
        const isToday = day === todayLabel;

        return (
          <div
            key={day}
            className={`rounded-xl border bg-white overflow-hidden ${
              isToday ? "border-teal-300" : "border-gray-100"
            }`}>
            {/* Day header */}
            <div
              className={`px-5 py-3 flex items-center gap-3 ${isToday ? "bg-teal-50/60" : ""}`}>
              <h2
                className={`text-base font-bold ${isToday ? "text-teal-600" : "text-gray-800"}`}>
                {day}
              </h2>
              {isToday && (
                <span className="text-xs font-semibold bg-teal-500 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>

            {/* Class rows */}
            {entries.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-300">
                No classes today
              </p>
            ) : (
              entries.map((entry, i) => <ClassRow key={i} entry={entry} />)
            )}
          </div>
        );
      })}
    </div>
  );
}
