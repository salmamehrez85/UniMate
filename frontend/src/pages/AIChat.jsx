import { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "../components/AIChat/ChatHeader";
import { MessageList } from "../components/AIChat/MessageList";
import { ChatInput } from "../components/AIChat/ChatInput";
import { WelcomeScreen } from "../components/AIChat/WelcomeScreen";
import { ChatSidebar } from "../components/AIChat/ChatSidebar";
import {
  sendChatMessage,
  getChatSessions,
  loadChatSession,
  deleteChatSession,
  renameChatSession,
} from "../services/chatService";

export function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Load session list on mount
  const fetchSessions = useCallback(async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch {
      // non-critical, sidebar just stays empty
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setError(null);
    try {
      const session = await loadChatSession(sessionId);
      setMessages(session.messages);
      setActiveSessionId(session._id);
      setActiveSessionTitle(session.title);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setActiveSessionTitle(null);
    setError(null);
    setInput("");
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await renameChatSession(sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, title: newTitle } : s)),
      );
      if (activeSessionId === sessionId) {
        setActiveSessionTitle(newTitle);
      }
    } catch (err) {
      setError(err.message);
    }
  };

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
      const { reply, sessionId, title } = await sendChatMessage(
        updatedMessages,
        activeSessionId,
      );

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setActiveSessionId(sessionId);
      setActiveSessionTitle(title);

      // Refresh sidebar — upsert session in list
      setSessions((prev) => {
        const exists = prev.find((s) => s._id === sessionId);
        if (exists) {
          return prev.map((s) =>
            s._id === sessionId
              ? { ...s, title, updatedAt: new Date().toISOString() }
              : s,
          );
        }
        return [
          { _id: sessionId, title, updatedAt: new Date().toISOString() },
          ...prev,
        ];
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <div
      className="mt-20 flex flex-col"
      style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <ChatHeader
        onClearChat={handleNewChat}
        messageCount={messages.length}
        sessionTitle={activeSessionTitle}
      />

      {/* Body: sidebar + chat */}
      <div className="flex-1 flex gap-4 mt-4 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          isLoading={sessionsLoading}
        />

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}

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
    </div>
  );
}
