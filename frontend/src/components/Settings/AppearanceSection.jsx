import { Palette } from "lucide-react";
import { useAppearance } from "../../hooks/useAppearance";

const THEMES = [
  { id: "light", label: "Light", bg: "bg-white", border: "border-gray-200" },
  { id: "dark", label: "Dark", bg: "bg-gray-900", border: "border-gray-700" },
];

const FONT_SIZES = ["Small", "Medium", "Large"];

export function AppearanceSection() {
  const { prefs, setTheme, setFontSize } = useAppearance();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
      </div>

      {/* Theme */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Theme</p>
        <div className="flex gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer group`}>
              <div
                className={`w-12 h-8 rounded-md border-2 ${t.bg} ${
                  prefs.theme === t.id
                    ? "border-primary-500 ring-2 ring-primary-200"
                    : t.border
                } transition`}
              />
              <span
                className={`text-xs font-medium ${
                  prefs.theme === t.id ? "text-primary-600" : "text-gray-500"
                }`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Font Size</p>
        <div className="flex gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                prefs.fontSize === size
                  ? "bg-primary-600 text-black border-primary-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
              }`}>
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
