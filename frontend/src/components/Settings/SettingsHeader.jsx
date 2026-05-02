import { useTranslation } from "react-i18next";

export function SettingsHeader() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-600">{t("settings.subtitle")}</p>
    </div>
  );
}
