import { Bot, Trash2 } from "lucide-react";

export function ChatHeader({ onClearChat, messageCount, sessionTitle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary-900 tracking-tight">
            {sessionTitle || "AI Study Assistant"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Powered by Gemini · Ask me anything about your studies
          </p>
        </div>
      </div>
    </div>
  );
}
