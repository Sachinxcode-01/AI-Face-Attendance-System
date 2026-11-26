import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Kept in auth-ui.tsx instead of card.tsx / button.tsx because Windows NTFS is
 * case-insensitive and existing dashboard routes import @/components/ui/Card and Button.
 */

const AuthCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[22px] border border-[#252E4A] bg-[#141D38]/85 text-[#F1F3F9] shadow-[0_-5px_30px_rgba(7,10,20,0.65)] backdrop-blur-xl",
      className,
    )}
    {...props}
  />
));
AuthCard.displayName = "AuthCard";

const AuthCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
AuthCardHeader.displayName = "AuthCardHeader";

const AuthCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "font-[family-name:var(--font-poppins)] text-2xl font-bold leading-none tracking-[-0.2px] text-[#F1F3F9]",
      className,
    )}
    {...props}
  />
));
AuthCardTitle.displayName = "AuthCardTitle";

const AuthCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#7C82A0]", className)}
    {...props}
  />
));
AuthCardDescription.displayName = "AuthCardDescription";

const AuthCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
AuthCardContent.displayName = "AuthCardContent";

const AuthCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
AuthCardFooter.displayName = "AuthCardFooter";

const shadcnButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A14] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-[0_8px_18px_rgba(79,70,229,0.28)] hover:brightness-110",
        outline:
          "border-[1.5px] border-[#252E4A] bg-[#131A33] text-[#F1F3F9] hover:border-[#6366F1] hover:bg-[#1A2340]",
        ghost: "text-[#C8CCDF] hover:bg-[#1A2340] hover:text-[#F1F3F9]",
        link: "text-[#818CF8] underline-offset-4 hover:text-[#A5B4FC] hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[10px] px-3",
        lg: "h-[50px] px-6 text-[15px] font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ShadcnButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof shadcnButtonVariants> {
  asChild?: boolean;
}

const ShadcnButton = React.forwardRef<HTMLButtonElement, ShadcnButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(shadcnButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
ShadcnButton.displayName = "ShadcnButton";

export {
  AuthCard as Card,
  AuthCardHeader as CardHeader,
  AuthCardFooter as CardFooter,
  AuthCardTitle as CardTitle,
  AuthCardDescription as CardDescription,
  AuthCardContent as CardContent,
  ShadcnButton as Button,
  shadcnButtonVariants as buttonVariants,
};
