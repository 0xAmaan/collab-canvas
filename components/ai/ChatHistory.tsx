/**
 * Chat History Component
 * Scrollable list of chat messages with auto-scroll
 */

"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

export interface ChatMessageType {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: number;
  status?: "sending" | "success" | "error";
}

interface ChatHistoryProps {
  messages: ChatMessageType[];
}

export const ChatHistory = ({ messages }: ChatHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="mb-3">
            <svg
              className="w-12 h-12 mx-auto text-[#666666] opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <p className="text-sm text-[#999999] leading-relaxed max-w-[220px] mx-auto">
            Ask AI to create or modify shapes...
          </p>
          <p className="text-xs text-[#666666] mt-2">
            Try: &quot;Create a red circle&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#444444 transparent",
      }}
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          type={message.type}
          content={message.content}
          timestamp={message.timestamp}
          status={message.status}
        />
      ))}
      {/* Invisible element to scroll to */}
      <div ref={bottomRef} />
    </div>
  );
};
