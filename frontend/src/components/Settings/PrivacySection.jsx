import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

function Toggle({ enabled, onChange, onLabel, offLabel }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
        enabled ? "bg-teal-500" : "bg-gray-200"
      }`}>
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-9" : "translate-x-1"
        }`}
      />
      <span
        className={`absolute text-[10px] font-bold tracking-wide transition-all ${
          enabled ? "left-2 text-white" : "right-2 text-gray-400"
        }`}>
        {enabled ? onLabel : offLabel}
      </span>
    </button>
  );
}

export function PrivacySection() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState({
    analytics: false,
    recommendations: true,
  });

  const toggle = (id) => setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));

  const PRIVACY_ITEMS = [
    {
      id: "analytics",
      label: t("settings.privacy.analytics"),
      description: t("settings.privacy.analyticsDesc"),
    },
    {
      id: "recommendations",
      label: t("settings.privacy.recommendations"),
      description: t("settings.privacy.recommendationsDesc"),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t("settings.privacy.title")}
        </h3>
      </div>
      <div className="space-y-4">
        {PRIVACY_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <Toggle
              enabled={prefs[item.id]}
              onChange={() => toggle(item.id)}
              onLabel={t("settings.privacy.on")}
              offLabel={t("settings.privacy.off")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
