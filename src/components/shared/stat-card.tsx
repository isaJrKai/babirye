"use client";

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ColorVariant = "emerald" | "red" | "amber" | "sky" | "gray";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  variant?: ColorVariant;
  sparklineData?: number[];
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<ColorVariant, { iconBg: string; iconText: string; border: string; sparkColor: string }> = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    border: "border-emerald-500/20",
    sparkColor: "stroke-emerald-400",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconText: "text-red-400",
    border: "border-red-500/20",
    sparkColor: "stroke-red-400",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    border: "border-amber-500/20",
    sparkColor: "stroke-amber-400",
  },
  sky: {
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-400",
    border: "border-sky-500/20",
    sparkColor: "stroke-sky-400",
  },
  gray: {
    iconBg: "bg-muted/50",
    iconText: "text-muted-foreground",
    border: "border-border/50",
    sparkColor: "stroke-muted-foreground",
  },
};

function MiniSparkline({
  data,
  colorClass,
}: {
  data: number[];
  colorClass: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const w = 64;
  const h = 24;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-16 h-6 shrink-0"
      fill="none"
    >
      <polyline
        points={points}
        className={colorClass}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({
  icon: Icon,
  title,
  value,
  change,
  changeLabel,
  variant = "gray",
  sparklineData,
  loading = false,
  className,
}: StatCardProps) {
  const style = variantStyles[variant];

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card p-4", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-28 mt-2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors hover:border-border",
        style.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-400" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-[11px] font-medium tabular-nums",
                  change > 0
                    ? "text-emerald-400"
                    : change < 0
                    ? "text-red-400"
                    : "text-muted-foreground"
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-[11px] text-muted-foreground/60">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              style.iconBg,
              style.border
            )}
          >
            <Icon className={cn("h-4 w-4", style.iconText)} />
          </div>
          {sparklineData && sparklineData.length >= 2 && (
            <MiniSparkline data={sparklineData} colorClass={style.sparkColor} />
          )}
        </div>
      </div>
    </div>
  );
}