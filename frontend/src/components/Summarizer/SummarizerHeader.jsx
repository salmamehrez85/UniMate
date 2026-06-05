import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SummarizerHeader() {
  const { t } = useTranslation();
  return (
    <div className="summarizer-header-banner rounded-2xl p-6 text-black">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-black/10 text-black flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black tracking-tight">
            {t("summarizer.header.title")}
          </h2>
          <p className="text-sm text-black/70 mt-1">
            {t("summarizer.header.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
