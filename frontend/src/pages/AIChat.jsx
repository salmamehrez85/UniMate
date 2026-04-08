import { useState } from "react";
import { ChatHeader } from "../components/AIChat/ChatHeader";
import { MessageList } from "../components/AIChat/MessageList";
import { ChatInput } from "../components/AIChat/ChatInput";
import { WelcomeScreen } from "../components/AIChat/WelcomeScreen";
import { sendChatMessage } from "../services/chatService";

export function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage(updatedMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    setInput(prompt);
    handleSend(prompt);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div
      className="mt-20 flex flex-col"
      style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <ChatHeader
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
