import { cn } from "@/utils/misc";
import { ReactNode } from "react";

interface NeoBrutalistBadgeProps {
  children: ReactNode;
  className?: string;
  bgColor?: string;
}

export function NeoBrutalistBadge({
  children,
  className,
  bgColor = "bg-orange-200",
}: NeoBrutalistBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block border-[2px] border-black px-2 py-1 text-xs font-bold uppercase",
        bgColor,
        className
      )}
    >
      {children}
    </span>
  );
}

