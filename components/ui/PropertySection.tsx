"use client";

/**
 * Property Section Component
 * Reusable section wrapper for property panels with consistent styling
 */

export const PropertySection = ({
  title,
  children,
  divider = false,
}: {
  title: string;
  children: React.ReactNode;
  divider?: boolean;
}) => (
  <div>
    {divider && <div className="border-t border-white/8 -mx-4 mb-4" />}
    <div className="space-y-4">
      <h3 className="text-sm text-white/80 font-medium">{title}</h3>
      {children}
    </div>
  </div>
);
