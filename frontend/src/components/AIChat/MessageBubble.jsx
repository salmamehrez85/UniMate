import { Bot, User, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function MessageBubble({ message, onSpeak }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-600 text-white">
          <User className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-50 text-primary-700 border border-primary-100">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble */}
      {isUser ? (
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm bg-primary-600 text-black">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : (
        <div className="group relative max-w-[75%]">
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm bg-white border border-gray-100 text-gray-800">
            <div className="prose prose-sm max-w-none prose-headings:text-primary-900 prose-strong:text-primary-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
          {/* Speaker replay button — appears on hover */}
          {onSpeak && (
            <button
              onClick={() => onSpeak(message.content)}
              title="Read aloud"
              aria-label="Read message aloud"
              className="absolute -bottom-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-primary-600 hover:border-primary-300 shadow-sm text-xs">
              <Volume2 className="w-3 h-3" />
              Read aloud
            </button>
          )}
        </div>
      )}
    </div>
  );
}
