"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional message displayed below the spinner */
  message?: string;
  /** Use full-screen fixed positioning instead of contained */
  fullscreen?: boolean;
  /** Apply a backdrop blur effect */
  blur?: boolean;
  /** Additional class names */
  className?: string;
}

export function LoadingOverlay({
  visible,
  message,
  fullscreen = false,
  blur = true,
  className,
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn(
            "z-50 flex flex-col items-center justify-center gap-3",
            fullscreen
              ? "fixed inset-0"
              : "absolute inset-0 rounded-lg",
            blur && "bg-black/40 backdrop-blur-sm",
            !blur && "bg-black/60",
            className,
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="size-7 animate-spin text-primary" />
            {message && (
              <p className="text-sm font-medium text-foreground/90">
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}