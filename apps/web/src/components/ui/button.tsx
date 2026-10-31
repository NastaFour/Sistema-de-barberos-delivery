import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-900/20",
  secondary: "bg-dark-700 hover:bg-dark-600 text-dark-100 border border-dark-600",
  outline: "bg-transparent hover:bg-dark-800 text-dark-100 border-2 border-dark-600",
  ghost: "bg-transparent hover:bg-dark-800 text-dark-300 hover:text-white",
  destructive: "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
