/**
 * Badge component for online status indicators
 */

interface BadgeProps {
  variant?: "online" | "offline";
  className?: string;
}

export const Badge = ({ variant = "online", className = "" }: BadgeProps) => {
  const bgColor = variant === "online" ? "bg-green-500" : "bg-gray-400";

  return (
    <span
      className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white ${bgColor} ${className}`}
      aria-label={variant === "online" ? "Online" : "Offline"}
    />
  );
};
