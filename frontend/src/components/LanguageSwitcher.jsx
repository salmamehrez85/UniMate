import { useLanguage } from "../hooks/useLanguage";

export function LanguageSwitcher({ className = "" }) {
  const { prefs, setLanguage } = useLanguage();

  return (
    <div
      className={`flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm font-semibold ${className}`}>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 transition-colors cursor-pointer ${
          prefs.language === "en"
            ? "bg-primary-600 text-black"
            : "text-gray-500 hover:bg-gray-50"
        }`}>
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={`px-3 py-1.5 transition-colors cursor-pointer ${
          prefs.language === "ar"
            ? "bg-primary-600 text-black"
            : "text-gray-500 hover:bg-gray-50"
        }`}>
        AR
      </button>
    </div>
  );
}
