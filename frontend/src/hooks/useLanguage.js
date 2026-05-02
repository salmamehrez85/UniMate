import { useState } from "react";
import i18n from "../i18n";

const STORAGE_KEY = "languagePrefs";
const DEFAULTS = { language: "en" };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyLanguage(prefs) {
  const lang = prefs.language || "en";
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}

export function getLanguagePrefs() {
  return load();
}

export function useLanguage() {
  const [prefs, setPrefs] = useState(() => {
    const p = load();
    applyLanguage(p);
    return p;
  });

  const setLanguage = (language) => {
    const next = { ...prefs, language };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyLanguage(next);
    i18n.changeLanguage(language);
    setPrefs(next);
  };

  return { prefs, setLanguage };
}
