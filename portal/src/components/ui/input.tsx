import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[12px] border border-[#252E4A] bg-[#131A33] px-3 py-2 text-sm text-[#F1F3F9] shadow-sm shadow-black/20 transition-all placeholder:text-[#4B5170] focus-visible:border-[#6366F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30 disabled:cursor-not-allowed disabled:opacity-50",
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
