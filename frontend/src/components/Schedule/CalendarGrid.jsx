import { MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

const HOUR_HEIGHT = 80; // px per hour

const BADGE_COLORS = [
  { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
];

const colorCache = {};
let colorIdx = 0;
function colorFor(code) {
  if (!colorCache[code]) {
    colorCache[code] = BADGE_COLORS[colorIdx % BADGE_COLORS.length];
    colorIdx++;
  }
  return colorCache[code];
}

function timeToMinutes(token) {
  if (!token) return null;
  const ampmMatch = token.match(/([AaPp][Mm])$/);
  const period = ampmMatch ? ampmMatch[1].toUpperCase() : null;
  const clean = token.replace(/\s*[AaPp][Mm]$/, "").trim();
  const parts = clean.split(":");
  let h = parseInt(parts[0]);
  const m = parseInt(parts[1] || "0");
  if (isNaN(h)) return null;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function parseEntryTime(raw) {
  if (!raw) return { startMin: null, endMin: null };
  const parts = raw.split(/\s*[-–]\s*(?=\d)/);
  const startMin = timeToMinutes(parts[0].trim());
  const endMin =
    parts.length > 1
      ? timeToMinutes(parts[1].trim())
      : startMin !== null
        ? startMin + 60
        : null;
  return { startMin, endMin };
}

function hourLabel(h) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export function CalendarGrid({ schedule }) {
  const { t } = useTranslation();
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

  const daysToShow = DAYS.filter(
    (d) => (schedule[d] && schedule[d].length > 0) || d === todayLabel,
  );

  // Compute visible hour range from all entries
  let minHour = 8;
  let maxHour = 18;
  daysToShow.forEach((day) => {
    (schedule[day] || []).forEach((entry) => {
      const { startMin, endMin } = parseEntryTime(entry.time);
      if (startMin !== null)
        minHour = Math.min(minHour, Math.floor(startMin / 60));
      if (endMin !== null) maxHour = Math.max(maxHour, Math.ceil(endMin / 60));
    });
  });
  minHour = Math.max(0, minHour - 1);
  maxHour = Math.min(24, maxHour + 1);

  const hours = Array.from(
    { length: maxHour - minHour },
    (_, i) => minHour + i,
  );
  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Day header row */}
      <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
        {/* time gutter header */}
        <div className="w-16 flex-shrink-0 border-r border-gray-100" />
        {daysToShow.map((day) => (
          <div
            key={day}
            className={`flex-1 min-w-0 text-center py-3 border-l border-gray-100 ${
              day === todayLabel ? "bg-teal-50/60" : ""
            }`}>
            <span
              className={`text-sm font-bold ${
                day === todayLabel ? "text-teal-600" : "text-gray-700"
              }`}>
              {t(`schedule.days.${day.toLowerCase()}`)}
            </span>
            {day === todayLabel && (
              <span className="ml-2 text-xs bg-teal-500 text-white px-1.5 py-0.5 rounded-full">
                {t("schedule.today")}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable grid body */}
      <div className="flex overflow-y-auto max-h-[580px]">
        {/* Time gutter */}
        <div
          className="w-16 flex-shrink-0 relative border-r border-gray-100"
          style={{ height: totalHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-0 left-0 flex items-start justify-end pr-2"
              style={{ top: (h - minHour) * HOUR_HEIGHT }}>
              <span className="text-[11px] text-gray-400 font-medium -mt-2 whitespace-nowrap">
                {hourLabel(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {daysToShow.map((day) => (
          <div
            key={day}
            className={`flex-1 min-w-0 relative border-l border-gray-100 ${
              day === todayLabel ? "bg-teal-50/10" : ""
            }`}
            style={{ height: totalHeight }}>
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-gray-100"
                style={{ top: (h - minHour) * HOUR_HEIGHT }}
              />
            ))}

            {/* Course blocks */}
            {(schedule[day] || []).map((entry, i) => {
              const { startMin, endMin } = parseEntryTime(entry.time);
              if (startMin === null) return null;
              const top = ((startMin - minHour * 60) / 60) * HOUR_HEIGHT;
              const rawDuration = endMin ? endMin - startMin : 60;
              const duration = Math.max(rawDuration, 45);
              const height = (duration / 60) * HOUR_HEIGHT - 4;
              const color = colorFor(entry.code);

              return (
                <div
                  key={i}
                  className={`absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden border ${color.bg} ${color.text} ${color.border}`}
                  style={{ top, height }}>
                  <p className="text-xs font-bold truncate leading-tight">
                    {entry.code}
                  </p>
                  <p className="text-xs truncate opacity-80 leading-tight mt-0.5">
                    {entry.name}
                  </p>
                  {entry.location && (
                    <p className="text-[10px] truncate opacity-60 mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      {entry.location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
