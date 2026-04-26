import { useState } from "react";

const STORAGE_KEY = "notificationPrefs";

const DEFAULTS = {
  assignments: true,
  quizzes: true,
  performance: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState(load);

  const toggle = (id) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { prefs, toggle };
}

export function getNotificationPrefs() {
  return load();
}
