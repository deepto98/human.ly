import { cn } from "@/utils/misc";
import { ReactNode } from "react";

interface NeoBrutalistCardProps {
  children: ReactNode;
  className?: string;
  bgColor?: string;
  shadowSize?: "sm" | "md" | "lg";
}

export function NeoBrutalistCard({
  children,
  className,
  bgColor = "bg-white",
  shadowSize = "md",
}: NeoBrutalistCardProps) {
  const shadows = {
    sm: "-bottom-1 -right-1",
    md: "-bottom-2 -right-2",
    lg: "-bottom-3 -right-3",
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn("absolute h-full w-full bg-black", shadows[shadowSize])}></div>
      <div className={cn("relative border-[4px] border-black", bgColor)}>
        {children}
      </div>
    </div>
  );
}

