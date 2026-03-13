import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        {
          "bg-[#5568EE] text-white hover:bg-[#4458DD]": variant === "primary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50": variant === "outline",
          "text-gray-700 hover:bg-gray-100": variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className,
      )}
      {...props}
    />
  );
}
