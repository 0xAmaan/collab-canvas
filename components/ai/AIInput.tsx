/**
 * AI Command Input Component
 * Chat-like interface for natural language commands
 */

"use client";

import { useState, type FormEvent } from "react";

interface AIInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

export const AIInput = ({ onSubmit, isLoading }: AIInputProps) => {
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[600px] z-30"
    >
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-3 shadow-xl">
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-purple-500"
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
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to create or modify shapes..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};
