import { cn } from "@/lib/utils";
import { getDifficultyColor } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "difficulty";
  difficulty?: string;
}

export function Badge({ children, className, variant = "default", difficulty }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variant === "difficulty" && difficulty ? getDifficultyColor(difficulty) : "bg-gray-100 text-gray-700 border-gray-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
