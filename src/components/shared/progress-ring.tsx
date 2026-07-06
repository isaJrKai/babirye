"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type RingColor = "emerald" | "amber" | "red" | "blue";
type RingSize = "sm" | "md" | "lg";

interface ProgressRingProps {
  /** Percentage value 0–100 */
  value: number;
  /** Color theme */
  color?: RingColor;
  /** Size variant */
  size?: RingSize;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Additional class names */
  className?: string;
  /** Hide the percentage text in the center */
  hideLabel?: boolean;
}

const sizeMap: Record<RingSize, number> = {
  sm: 48,
  md: 72,
  lg: 96,
};

const colorMap: Record<RingColor, { stroke: string; text: string; bg: string }> = {
  emerald: {
    stroke: "stroke-emerald-500 dark:stroke-emerald-400",
    text: "text-emerald-500 dark:text-emerald-400",
    bg: "stroke-emerald-500/10 dark:stroke-emerald-400/10",
  },
  amber: {
    stroke: "stroke-amber-500 dark:stroke-amber-400",
    text: "text-amber-500 dark:text-amber-400",
    bg: "stroke-amber-500/10 dark:stroke-amber-400/10",
  },
  red: {
    stroke: "stroke-red-500 dark:stroke-red-400",
    text: "text-red-500 dark:text-red-400",
    bg: "stroke-red-500/10 dark:stroke-red-400/10",
  },
  blue: {
    stroke: "stroke-sky-500 dark:stroke-sky-400",
    text: "text-sky-500 dark:text-sky-400",
    bg: "stroke-sky-500/10 dark:stroke-sky-400/10",
  },
};

export function ProgressRing({
  value,
  color = "emerald",
  size = "md",
  strokeWidth,
  className,
  hideLabel = false,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const dimension = sizeMap[size];
  const sw = strokeWidth ?? (size === "sm" ? 4 : size === "md" ? 5 : 6);
  const radius = (dimension - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const colors = colorMap[color];

  const labelSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={sw}
          className={cn("stroke-border/40", colors.bg)}
        />

        {/* Foreground progress – animated with framer-motion */}
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={sw}
          strokeLinecap="round"
          className={cn(colors.stroke)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center label */}
      {!hideLabel && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold tabular-nums",
            labelSize,
            colors.text,
          )}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}