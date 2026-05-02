import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../hooks/useLanguage";

export function LanguageSection() {
  const { t } = useTranslation();
  const { prefs, setLanguage } = useLanguage();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Languages className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("settings.language.title")}
        </h3>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-3">
        {t("settings.language.label")}
      </p>
      <div className="flex gap-2">
        {[
          { code: "en", label: t("settings.language.english") },
          { code: "ar", label: t("settings.language.arabic") },
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
              prefs.language === lang.code
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
            }`}>
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
