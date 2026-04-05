import { MapPin, ExternalLink } from "lucide-react";

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

// Convert a single time token like "10:00", "14:00", or "1:00PM" → "10:00 AM" / "2:00 PM"
function formatSingleTime(token) {
  if (!token) return "";
  const ampmMatch = token.match(/([AaPp][Mm])$/);
  const explicitPeriod = ampmMatch ? ampmMatch[1].toUpperCase() : null;
  const clean = token.replace(/\s*[AaPp][Mm]$/, "").trim();
  const [h, m] = clean.split(":").map(Number);
  if (isNaN(h)) return token;
  if (explicitPeriod) {
    const hour = h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, "0")} ${explicitPeriod}`;
  }
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// Format a time range "10:00-11:30", "10:00 AM-11:30 AM", "1:00 PM - 2:30 PM" → "10:00 AM – 11:30 AM"
// Falls back to just start time if no end found
function formatTimeRange(raw) {
  if (!raw) return "";
  // Split on dash/en-dash that is NOT inside a time token
  // We split on a dash surrounded by non-digit chars or at a space-dash-space boundary
  const parts = raw.split(/\s*[-–]\s*(?=\d)/);
  const start = formatSingleTime(parts[0].trim());
  if (parts.length < 2) return start;
  const end = formatSingleTime(parts[1].trim());
  return `${start} – ${end}`;
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function ClassRow({ entry }) {
  const badge = badgeColorFor(entry.code);
  const hasLocation = Boolean(entry.location);
  const locationIsUrl = hasLocation && isUrl(entry.location);

  return (
    <div className="flex items-center gap-4 py-4 px-5 border-b border-gray-100 last:border-0">
      {/* Time range */}
      <div className="w-36 flex-shrink-0">
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
          {formatTimeRange(entry.time)}
        </span>
      </div>

      {/* Badge */}
      <span
        className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-md ${badge}`}>
        {entry.code}
      </span>

      {/* Course name + location stacked */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {entry.name}
        </p>
        {hasLocation &&
          (locationIsUrl ? (
            <a
              href={entry.location}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 mt-0.5">
              <ExternalLink className="w-3 h-3" />
              Join online
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {entry.location}
            </span>
          ))}
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
