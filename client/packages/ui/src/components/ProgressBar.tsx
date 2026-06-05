import { cn } from "../lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  variant = "default",
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const trackHeight = { sm: "h-1.5", md: "h-2.5", lg: "h-4" }[size];
  const fillColor = {
    default: "bg-brand-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger:  "bg-danger-500",
  }[variant];

  return (
    <div className={cn("w-full", className)}>
      {(label ?? showValue) && (
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted", trackHeight)}>
        <div
          className={cn("rounded-full transition-all duration-500", trackHeight, fillColor)}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}