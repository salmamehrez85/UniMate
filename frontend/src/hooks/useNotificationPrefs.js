import { useState, useEffect } from "react";
import {
  getNotificationPrefsFromServer,
  updateNotificationPrefs,
} from "../services/notificationService";

const STORAGE_KEY = "notificationPrefs";

const DEFAULTS = {
  assignments: true,
  quizzes: true,
  performance: false,
  emailDeadlines: false,
};

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState(loadLocal);

  // Hydrate from server on mount
  useEffect(() => {
    getNotificationPrefsFromServer()
      .then((serverPrefs) => {
        const merged = { ...DEFAULTS, ...serverPrefs };
        setPrefs(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      })
      .catch(() => {}); // silently fall back to localStorage
  }, []);

  const toggle = async (id) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    try {
      await updateNotificationPrefs({ [id]: next[id] });
    } catch {
      // Server update failed — local state is still updated
    }
  };

  return { prefs, toggle };
}

// Synchronous read for places that can't use hooks (e.g., legacy code)
export function getNotificationPrefs() {
  return loadLocal();
}
