"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CountBadgeVariant =
  | "default"
  | "destructive"
  | "warning"
  | "success"
  | "secondary"
  | "outline";

interface CountBadgeProps {
  /** The numeric count to display */
  count: number;
  /** If count exceeds max, shows "99+" (set 0 for unlimited) */
  max?: number;
  /** Visual variant */
  variant?: CountBadgeVariant;
  /** Enable a pulse animation on the badge dot */
  pulse?: boolean;
  /** Additional class names */
  className?: string;
}

const variantStyles: Record<CountBadgeVariant, string> = {
  default: "bg-primary text-primary-foreground border-transparent",
  destructive:
    "bg-red-500/15 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-300",
  warning:
    "bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
  success:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "bg-transparent text-foreground border-border",
};

const pulseDotColor: Record<CountBadgeVariant, string> = {
  default: "bg-primary-foreground",
  destructive: "bg-red-400",
  warning: "bg-amber-400",
  success: "bg-emerald-400",
  secondary: "bg-secondary-foreground",
  outline: "bg-foreground",
};

export function CountBadge({
  count,
  max = 99,
  variant = "default",
  pulse = false,
  className,
}: CountBadgeProps) {
  const display =
    max > 0 && count > max ? `${max}+` : String(count);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        variantStyles[variant],
        className,
      )}
    >
      {pulse && count > 0 && (
        <span className="relative flex size-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              pulseDotColor[variant],
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              pulseDotColor[variant],
            )}
          />
        </span>
      )}
      {display}
    </Badge>
  );
}