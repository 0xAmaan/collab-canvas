/**
 * Chat Message Component
 * Individual message bubble for user and AI messages
 */

"use client";

import { useState } from "react";

interface ChatMessageProps {
  type: "user" | "ai";
  content: string;
  timestamp: number;
  status?: "sending" | "success" | "error";
}

export const ChatMessage = ({
  type,
  content,
  timestamp,
  status,
}: ChatMessageProps) => {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUser = type === "user";
  const isLoading = status === "sending";
  const isError = status === "error";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div
        className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        {/* Message bubble */}
        <div
          className={`px-3 py-2 rounded-lg ${
            isUser ? "bg-primary text-white" : "bg-panel text-[#E5E5E5]"
          } ${isError ? "border border-red-500/50" : ""}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-[13px]">Sending...</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          )}
        </div>

        {/* Timestamp - shown on hover */}
        {showTimestamp && !isLoading && (
          <span className="text-[10px] text-[#888888] px-1">
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
};
