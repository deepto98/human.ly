import * as React from "react";

import { cn } from "@/utils/misc";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border-[3px] border-black bg-white px-3 py-2 text-base font-medium",
          "placeholder:text-gray-500",
          "focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
