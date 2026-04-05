import { useEffect, useState } from "react";
import { ScheduleHeader } from "../components/Schedule/ScheduleHeader";
import { WeekGrid } from "../components/Schedule/WeekGrid";
import { CalendarGrid } from "../components/Schedule/CalendarGrid";
import { EmptySchedule } from "../components/Schedule/EmptySchedule";
import { getCourses } from "../services/courseService";
import { List, LayoutGrid } from "lucide-react";

// Maps abbreviated day tokens to full day names
const DAY_MAP = {
  // Full names
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
  // 3-letter abbreviations
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
  // Short codes
  m: "Monday",
  t: "Tuesday",
  w: "Wednesday",
  th: "Thursday",
  f: "Friday",
  sa: "Saturday",
  su: "Sunday",
};

/**
 * Parse a course.schedule string like "Mon/Wed 10:00-11:30 Room 204"
 * Returns: { days: ["Monday","Wednesday"], time: "10:00-11:30", location: "Room 204" }
 */
function parseSchedule(raw) {
  if (!raw) return { days: [], time: "", location: "" };

  // Extract time portion — handles all formats:
  // "10:00-11:30", "10:00 AM - 11:30 AM", "1:00 PM", "13:00-14:30"
  const timeMatch = raw.match(
    /\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?\s*(?:[-–]\s*\d{1,2}:\d{2}\s*(?:[AaPp][Mm])?)?/,
  );
  const time = timeMatch ? timeMatch[0].trim() : "";

  // Remove time, then split what remains into day tokens vs location
  let remaining = raw.replace(timeMatch ? timeMatch[0] : "", "").trim();

  // Collect day tokens first
  const tokens = remaining.split(/[/,&\s]+/).filter(Boolean);
  const days = [];
  const locationTokens = [];

  tokens.forEach((token) => {
    const key = token.toLowerCase().replace(/\./g, "");
    if (DAY_MAP[key]) {
      days.push(DAY_MAP[key]);
    } else if (/^[ap]m$/i.test(token)) {
      // skip stray AM/PM tokens (already captured in time string)
    } else {
      locationTokens.push(token);
    }
  });

  const location = locationTokens.join(" ");
  return { days, time, location };
}

/**
 * Build a schedule map: { Monday: [{name, code, instructor, time}], ... }
 */
function buildScheduleMap(courses) {
  const map = {};
  courses.forEach((course) => {
    const {
      days,
      time,
      location: parsedLocation,
    } = parseSchedule(course.schedule);
    // Prefer the dedicated location field; fall back to whatever was parsed from schedule
    const location = course.location || parsedLocation;
    days.forEach((day) => {
      if (!map[day]) map[day] = [];
      map[day].push({
        name: course.name,
        code: course.code,
        instructor: course.instructor || "",
        time,
        location,
      });
    });
  });
  return map;
}

export function Schedule() {
  const [activeCourses, setActiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");

  useEffect(() => {
    getCourses()
      .then((data) => {
        const courses = (data.courses || []).filter(
          (c) => c.isOldCourse !== true,
        );
        setActiveCourses(courses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scheduleMap = buildScheduleMap(activeCourses);
  const hasAnySchedule = activeCourses.some((c) => c.schedule);

  if (loading) {
    return (
      <div className="mt-20 px-6">
        <ScheduleHeader />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-gray-100 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 px-6 pb-24 md:pb-6 space-y-6">
      {/* Header + toggle */}
      <div className="flex items-start justify-between gap-4">
        <ScheduleHeader />
        {hasAnySchedule && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0 mt-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
          </div>
        )}
      </div>

      {hasAnySchedule ? (
        view === "grid" ? (
          <CalendarGrid schedule={scheduleMap} />
        ) : (
          <WeekGrid schedule={scheduleMap} />
        )
      ) : (
        <EmptySchedule />
      )}
    </div>
  );
}
