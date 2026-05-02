import { Palette } from "lucide-react";
import { useAppearance } from "../../hooks/useAppearance";
import { useTranslation } from "react-i18next";

export function AppearanceSection() {
  const { t } = useTranslation();
  const { prefs, setTheme, setFontSize } = useAppearance();

  const THEMES = [
    {
      id: "light",
      label: t("settings.appearance.light"),
      bg: "bg-white",
      border: "border-gray-200",
    },
    {
      id: "dark",
      label: t("settings.appearance.dark"),
      bg: "bg-gray-900",
      border: "border-gray-700",
    },
  ];

  const FONT_SIZES = [
    { id: "Small", label: t("settings.appearance.small") },
    { id: "Medium", label: t("settings.appearance.medium") },
    { id: "Large", label: t("settings.appearance.large") },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("settings.appearance.title")}
        </h3>
      </div>

      {/* Theme */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t("settings.appearance.theme")}
        </p>
        <div className="flex gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer group`}>
              <div
                className={`w-12 h-8 rounded-md border-2 ${theme.bg} ${
                  prefs.theme === theme.id
                    ? "border-primary-500 ring-2 ring-primary-200"
                    : theme.border
                } transition`}
              />
              <span
                className={`text-xs font-medium ${
                  prefs.theme === theme.id
                    ? "text-primary-600"
                    : "text-gray-500"
                }`}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t("settings.appearance.fontSize")}
        </p>
        <div className="flex gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.id}
              onClick={() => setFontSize(size.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                prefs.fontSize === size.id
                  ? "bg-primary-600 text-black border-primary-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
              }`}>
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
