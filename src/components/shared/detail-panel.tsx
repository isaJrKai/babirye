"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DetailPanelAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

interface DetailPanelProps {
  /** Controls open / closed state */
  open: boolean;
  /** Callback when the sheet requests to close */
  onOpenChange: (open: boolean) => void;
  /** Panel title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Main content rendered inside a scrollable area */
  children: React.ReactNode;
  /** Actions rendered in the footer */
  actions?: DetailPanelAction[];
  /** Maximum width of the panel (Tailwind class) */
  maxWidth?: string;
  /** Additional class names on SheetContent */
  className?: string;
}

export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions = [],
  maxWidth = "max-w-xl lg:max-w-2xl",
  className,
}: DetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex flex-col gap-0 p-0 sm:max-w-sm",
          maxWidth,
          "dark:border-border/40 dark:bg-background",
          className,
        )}
      >
        {/* Fixed header */}
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-4">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-xs text-muted-foreground">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">{children}</div>
        </ScrollArea>

        {/* Fixed footer */}
        {actions.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="shrink-0 flex-row items-center gap-2 px-6 py-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled || action.loading}
                  onClick={action.onClick}
                  className={cn(
                    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    "disabled:pointer-events-none disabled:opacity-50",
                    actionVariantClasses(action.variant ?? "default"),
                  )}
                >
                  {action.loading && (
                    <svg
                      className="size-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {action.label}
                </button>
              ))}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─── Variant styles ────────────────────────────────────────────── */

function actionVariantClasses(
  variant: "default" | "destructive" | "outline" | "secondary" | "ghost",
) {
  switch (variant) {
    case "destructive":
      return "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800";
    case "outline":
      return "border border-border/60 bg-transparent hover:bg-accent hover:text-accent-foreground dark:border-border/40";
    case "secondary":
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    case "ghost":
      return "hover:bg-accent hover:text-accent-foreground";
    default:
      return "bg-primary text-primary-foreground hover:bg-primary/90";
  }
}