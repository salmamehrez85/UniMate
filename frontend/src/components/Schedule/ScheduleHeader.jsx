import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ScheduleHeader() {
  const { t } = useTranslation();
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <Calendar className="w-7 h-7 text-teal-500" />
        <h1 className="text-3xl font-bold text-primary-900">{t("schedule.header.title")}</h1>
      </div>
    </div>
  );
}
