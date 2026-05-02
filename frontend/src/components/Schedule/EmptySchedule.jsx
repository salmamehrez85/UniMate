import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptySchedule() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="flex justify-center mb-4">
        <Info className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        {t("schedule.empty.title")}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">
        {t("schedule.empty.description")}
      </p>
    </div>
  );
}
