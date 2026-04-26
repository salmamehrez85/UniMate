const STORAGE_KEY = "appearancePrefs";

const DEFAULTS = { theme: "light", fontSize: "Medium" };

const FONT_SIZE_MAP = { Small: "14px", Medium: "16px", Large: "18px" };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyAppearance(prefs) {
  const root = document.documentElement;
  root.setAttribute("data-theme", prefs.theme);
  root.style.setProperty(
    "--app-font-size",
    FONT_SIZE_MAP[prefs.fontSize] || "16px",
  );
}

export function getAppearancePrefs() {
  return load();
}

import { useState } from "react";

export function useAppearance() {
  const [prefs, setPrefs] = useState(() => {
    const p = load();
    applyAppearance(p);
    return p;
  });

  const setTheme = (theme) => {
    const next = { ...prefs, theme };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyAppearance(next);
    setPrefs(next);
  };

  const setFontSize = (fontSize) => {
    const next = { ...prefs, fontSize };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyAppearance(next);
    setPrefs(next);
  };

  return { prefs, setTheme, setFontSize };
}
