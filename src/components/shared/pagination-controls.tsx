"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  /** 1-based current page number */
  page: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Fired when the user changes the page */
  onPageChange: (page: number) => void;
  /** Fired when the user changes the page size */
  onPageSizeChange: (size: number) => void;
  /** Additional class names */
  className?: string;
  /** Label shown before the page size selector */
  pageSizeLabel?: string;
}

export function PaginationControls({
  page,
  totalItems,
  pageSize,
  pageSizes = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
  pageSizeLabel = "Rows",
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Info text + page size */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {startItem}&ndash;{endItem}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{totalItems}</span>
        </span>

        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-xs text-muted-foreground">{pageSizeLabel}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger
              className="h-7 w-[70px] text-xs dark:bg-muted/30 dark:border-border/40"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:border-border/40">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs dark:border-border/40"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Page number buttons (show max 5, centered on current) */}
        <PageNumbers
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />

        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs dark:border-border/40"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Internal page number buttons ──────────────────────────────── */

function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  // Show up to 5 page buttons around the current page
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("ellipsis-start");
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis-end");
    pages.push(totalPages);
  }

  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {pages.map((p) =>
        typeof p === "string" ? (
          <span
            key={p}
            className="flex size-7 items-center justify-center text-xs text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "ghost"}
            size="sm"
            className="size-7 p-0 text-xs"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ),
      )}
    </div>
  );
}