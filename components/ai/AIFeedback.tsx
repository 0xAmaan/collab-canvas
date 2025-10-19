/**
 * AI Feedback Component
 * Status toast for AI command execution
 */

"use client";

import type { AIStatus } from "@/lib/ai/types";

interface AIFeedbackProps {
  status: AIStatus;
  message?: string;
}

export const AIFeedback = ({ status, message }: AIFeedbackProps) => {
  if (status === "idle") return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
      <div
        className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 ${
          status === "thinking"
            ? "bg-purple-600 text-white"
            : status === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
        }`}
      >
        {status === "thinking" && (
          <div className="flex items-center gap-2">
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
            <span>AI is thinking...</span>
          </div>
        )}
        {status === "success" && (message || "Done!")}
        {status === "error" && (message || "Something went wrong")}
      </div>
    </div>
  );
};
