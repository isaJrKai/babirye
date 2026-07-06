"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

/* ─── Types ──────────────────────────────────────────────────────── */

export type ActivityType = "success" | "warning" | "error" | "info";

export interface TimelineItem {
  id: string;
  timestamp: Date | string;
  title: string;
  description?: string;
  type?: ActivityType;
  badge?: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  /** Max height before scrolling */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
}

/* ─── Color mappings ─────────────────────────────────────────────── */

const dotColors: Record<ActivityType, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-sky-400",
};

const ringColors: Record<ActivityType, string> = {
  success: "ring-emerald-400/20",
  warning: "ring-amber-400/20",
  error: "ring-red-400/20",
  info: "ring-sky-400/20",
};

const badgeColors: Record<ActivityType, string> = {
  success:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning:
    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error:
    "bg-red-500/15 text-red-400 border-red-500/30",
  info:
    "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const lineColor = "bg-border/40";

/* ─── Component ──────────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export function ActivityTimeline({
  items,
  maxHeight = "max-h-[480px]",
  className,
}: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-8 text-sm text-muted-foreground", className)}>
        No activity recorded.
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <ScrollArea className={maxHeight}>
        <motion.div
          className="relative pl-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Vertical line */}
          <div
            className={cn(
              "absolute left-[7px] top-1.5 bottom-1.5 w-px",
              lineColor,
            )}
          />

          {items.map((item, idx) => {
            const type = item.type ?? "info";
            const isLast = idx === items.length - 1;
            const ts =
              item.timestamp instanceof Date
                ? item.timestamp
                : new Date(item.timestamp);

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className={cn("relative pb-5", isLast && "pb-0")}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-6 top-1.5 flex size-[15px] items-center justify-center",
                    "rounded-full ring-4",
                    ringColors[type],
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      dotColors[type],
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground leading-tight">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium leading-4",
                          badgeColors[type],
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {item.description}
                    </p>
                  )}

                  <time
                    dateTime={ts.toISOString()}
                    className="mt-1 text-[11px] text-muted-foreground/70"
                  >
                    {formatDistanceToNowStrict(ts, { addSuffix: true })}
                  </time>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </ScrollArea>
    </div>
  );
}