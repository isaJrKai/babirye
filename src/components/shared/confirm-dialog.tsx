"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  /** Controls open / closed state */
  open: boolean;
  /** Callback when the dialog requests to close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description / body text */
  description?: string;
  /** Text on the confirm button */
  confirmText?: string;
  /** Text on the cancel button */
  cancelText?: string;
  /** Visual variant for the confirm button */
  variant?: "destructive" | "default";
  /** Fired when the user confirms */
  onConfirm: () => void | Promise<void>;
  /** Show a loading spinner on the confirm button */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      await onConfirm();
    },
    [onConfirm],
  );

  const isDestructive = variant === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="dark:border-border/40">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {isDestructive && (
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="size-5 text-red-400" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="text-sm">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "gap-1.5",
              isDestructive &&
                "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/30 dark:bg-red-700 dark:hover:bg-red-800",
            )}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}