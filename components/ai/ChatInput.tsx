/**
 * Chat Input Component
 * Input field for AI chat sidebar (refactored from AIInput)
 */

"use client";

import { useState, forwardRef, type FormEvent } from "react";

interface ChatInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ onSubmit, isLoading }, ref) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      onSubmit(input);
      setInput("");
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 p-3 bg-sidebar"
      >
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to create shapes..."
            className="flex-1 bg-panel text-white placeholder-[#666666] outline-none text-[13px] px-3 py-2 rounded-lg border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Send message"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4"
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
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    );
  },
);

ChatInput.displayName = "ChatInput";
