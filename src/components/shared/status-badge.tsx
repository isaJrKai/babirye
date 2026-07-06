"use client";

import { cn } from "@/lib/utils";

type StatusEntityType =
  | "agent"
  | "tool"
  | "sensor"
  | "alert"
  | "task"
  | "vip"
  | "guard"
  | "gateway"
  | "generic";

interface StatusBadgeProps {
  status: string;
  entityType?: StatusEntityType;
  className?: string;
  pulse?: boolean;
}

// Per-entity-type status-to-color mapping
const statusMap: Record<
  StatusEntityType,
  Record<string, { color: string; dotColor: string; label?: string }>
> = {
  agent: {
    idle: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    running: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400", label: "Live" },
    error: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
    disabled: { color: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30", dotColor: "bg-zinc-500" },
  },
  tool: {
    dormant: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    active: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400", label: "Live" },
    error: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
  },
  sensor: {
    online: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400", label: "Live" },
    offline: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    error: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
    maintenance: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dotColor: "bg-amber-400" },
  },
  alert: {
    new: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
    investigating: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dotColor: "bg-amber-400" },
    resolved: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400" },
    false_positive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    escalated: { color: "bg-purple-500/15 text-purple-400 border-purple-500/30", dotColor: "bg-purple-400" },
  },
  task: {
    pending: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    running: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400", label: "Live" },
    completed: { color: "bg-sky-500/15 text-sky-400 border-sky-500/30", dotColor: "bg-sky-400" },
    failed: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
    cancelled: { color: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30", dotColor: "bg-zinc-500" },
  },
  vip: {
    active: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400" },
    inactive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    emergency: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
  },
  guard: {
    active: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400" },
    inactive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
  },
  gateway: {
    active: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400", label: "Live" },
    inactive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
  },
  generic: {
    active: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400" },
    inactive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", dotColor: "bg-gray-400" },
    error: { color: "bg-red-500/15 text-red-400 border-red-500/30", dotColor: "bg-red-400" },
    warning: { color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dotColor: "bg-amber-400" },
    success: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dotColor: "bg-emerald-400" },
    info: { color: "bg-sky-500/15 text-sky-400 border-sky-500/30", dotColor: "bg-sky-400" },
  },
};

export function StatusBadge({
  status,
  entityType = "generic",
  className,
  pulse = false,
}: StatusBadgeProps) {
  const entityStatuses = statusMap[entityType] ?? statusMap.generic;
  const config = entityStatuses[status.toLowerCase()] ?? {
    color: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  };

  const isLive = config.label === "Live" || status.toLowerCase() === "active" || status.toLowerCase() === "online" || status.toLowerCase() === "running";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
        config.color,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isLive && pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dotColor
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            config.dotColor
          )}
        />
      </span>
      {config.label ?? status}
    </span>
  );
}