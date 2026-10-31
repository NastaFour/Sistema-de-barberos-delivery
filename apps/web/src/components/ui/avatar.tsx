import type { ReactNode } from "react";

interface AvatarProps {
  children?: ReactNode;
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles: Record<string, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function Avatar({ src, alt, fallback, className = "", size = "md", children }: AvatarProps) {
  const sizeClass = sizeStyles[size];

  if (children) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-dark-800 flex items-center justify-center text-white overflow-hidden ${className}`}
      >
        {children}
      </div>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ""}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold ${className}`}
    >
      {fallback || "?"}
    </div>
  );
}
