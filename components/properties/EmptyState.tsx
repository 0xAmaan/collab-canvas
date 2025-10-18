"use client";

/**
 * Empty State Component
 * Shown when no shapes are selected
 */

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white/30"
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="17" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M3 17L10 17L10 21L3 21L3 17Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-white/70 mb-2">
        Select a shape to edit properties
      </h3>
      <p className="text-xs text-white/40 max-w-[200px]">
        Click on any shape or use keyboard shortcuts to get started
      </p>
      <div className="mt-6 space-y-2 text-xs text-white/30">
        <div>
          <span className="text-white/50">R</span> - Rectangle
        </div>
        <div>
          <span className="text-white/50">C</span> - Circle
        </div>
        <div>
          <span className="text-white/50">E</span> - Ellipse
        </div>
        <div>
          <span className="text-white/50">L</span> - Line
        </div>
        <div>
          <span className="text-white/50">T</span> - Text
        </div>
      </div>
    </div>
  );
};
