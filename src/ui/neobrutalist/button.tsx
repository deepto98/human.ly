import { cn } from "@/utils/misc";
import { ReactNode } from "react";

interface NeoBrutalistButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  bgColor?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
}

export function NeoBrutalistButton({
  children,
  onClick,
  disabled = false,
  className,
  bgColor,
  variant = "primary",
  size = "md",
  type = "button",
}: NeoBrutalistButtonProps) {
  const variants = {
    primary: "bg-orange-400 hover:bg-orange-500",
    secondary: "bg-cyan-300 hover:bg-cyan-400",
    danger: "bg-red-400 hover:bg-red-500",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("relative group", className)}
    >
      <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
      <div
        className={cn(
          "relative flex items-center justify-center gap-2 border-[3px] border-black font-bold uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
          sizes[size],
          bgColor || variants[variant],
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {children}
      </div>
    </button>
  );
}

