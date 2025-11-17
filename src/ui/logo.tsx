import { cn } from "@/utils/misc";
import siteConfig from "~/site.config";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
  [key: string]: unknown | undefined;
}

export function Logo({ width, height, className, showText = true, ...args }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...args}>
      <div className="relative">
        {/* Neobrutalist offset shadow */}
        <div className="absolute -bottom-1 -right-1 h-10 w-10 bg-black"></div>
        {/* Icon container */}
        <div className="relative h-10 w-10 border-[3px] border-black bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
          {/* Human icon representing the interview agent */}
          <svg
            width={width ?? 24}
            height={height ?? 24}
            className="text-black"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head */}
            <circle cx="12" cy="6" r="3" fill="currentColor" />
            {/* Body - representing an AI agent */}
            <path
              d="M12 11C8.5 11 6 13 6 15.5V18C6 19 6.5 20 8 20H16C17.5 20 18 19 18 18V15.5C18 13 15.5 11 12 11Z"
              fill="currentColor"
            />
            {/* AI indicator dots */}
            <circle cx="10" cy="16" r="0.8" fill="white" />
            <circle cx="12" cy="16" r="0.8" fill="white" />
            <circle cx="14" cy="16" r="0.8" fill="white" />
          </svg>
        </div>
      </div>
      {showText && (
        <span className="text-2xl font-black tracking-tight text-black">
          {siteConfig.siteTitle}
        </span>
      )}
    </div>
  );
}
