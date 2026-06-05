import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ChatHeader({ sessionTitle }) {
  const { t } = useTranslation();
  return (
    <div className="chat-header-banner rounded-2xl p-5 flex items-center justify-between text-black">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-black/10 text-black flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black tracking-tight">
            {sessionTitle || t("aiChat.header.title")}
          </h2>
          <p className="text-sm text-black/70 mt-0.5">
            {t("aiChat.header.subtitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
