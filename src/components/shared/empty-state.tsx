"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className ?? ""}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 border border-border/50 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground/60 max-w-xs mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="text-xs h-8 px-3 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}