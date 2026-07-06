"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { TableIcon } from "lucide-react";

// ── Column definition ────────────────────────────────────────────────────────
export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ElementType;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  selectable?: boolean;
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  pageSize?: number;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  selectable = false,
  rowKey,
  onRowClick,
  rowActions,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Sorting ─────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === "asc") setSortDir("desc");
        else if (sortDir === "desc") {
          setSortKey(null);
          setSortDir(null);
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey, sortDir]
  );

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedData = sortedData.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  // ── Selection ───────────────────────────────────────────────────────────
  const allKeys = pagedData.map((r) => String(r[rowKey]));
  const allSelected =
    pagedData.length > 0 && allKeys.every((k) => selected.has(k));
  // someSelected is computed but not currently used directly in render controls

  const toggleAll = () => {
    const keys = pagedData.map((r) => String(r[rowKey]));
    const allSel = pagedData.length > 0 && keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSel) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card", className)}>
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className="w-10">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow
                key={i}
                className="border-border/30 hover:bg-transparent"
              >
                {selectable && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/50 bg-card",
          className
        )}
      >
        <EmptyState
          icon={TableIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    if (sortDir === "asc") return <ArrowUp className="h-3 w-3 text-primary" />;
    return <ArrowDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className={cn("rounded-xl border border-border/50 bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  // indeterminate isn't supported well by the primitive, so we approximate
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && <SortIcon colKey={col.key} />}
                </div>
              </TableHead>
            ))}
            {rowActions && (
              <TableHead className="w-10" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.map((row) => {
            const key = String(row[rowKey]);
            const isSelected = selected.has(key);
            return (
              <TableRow
                key={key}
                className={cn(
                  "border-border/30",
                  isSelected && "bg-primary/5",
                  onRowClick && "cursor-pointer"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(key)}
                      aria-label={`Select row ${key}`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode) ?? "—"}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {rowActions.map((action, idx) => (
                          <div key={idx}>
                            {action.separator && idx > 0 && (
                              <DropdownMenuSeparator className="bg-border/50" />
                            )}
                            <DropdownMenuItem
                              className={cn(
                                "cursor-pointer text-xs",
                                action.variant === "destructive" &&
                                  "text-red-400 focus:text-red-400"
                              )}
                              onClick={() => action.onClick(row)}
                            >
                              {action.icon && (
                                <action.icon className="mr-2 h-3.5 w-3.5" />
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-2">
          <span className="text-[11px] text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} of ${data.length} selected`
              : `${data.length} record${data.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage === 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-[11px] font-mono text-muted-foreground tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}