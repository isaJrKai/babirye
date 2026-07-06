"use client";

import * as React from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  /** Available filter definitions */
  filters: FilterOption[];
  /** Currently active filter values keyed by filter key */
  values?: Record<string, string>;
  /** Fired whenever any filter changes, receiving the full values map */
  onChange: (filters: Record<string, string>) => void;
  /** Additional class names */
  className?: string;
  /** Label shown on the clear-all button */
  clearLabel?: string;
  /** Collapsed state on mobile (under md) */
  defaultCollapsed?: boolean;
}

export function FilterBar({
  filters,
  values: controlledValues,
  onChange,
  className,
  clearLabel = "Clear all",
  defaultCollapsed = true,
}: FilterBarProps) {
  const [internalValues, setInternalValues] = React.useState<
    Record<string, string>
  >({});
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const activeValues = controlledValues ?? internalValues;

  const activeCount = Object.values(activeValues).filter(
    (v) => v && v !== "all",
  ).length;

  const handleChange = React.useCallback(
    (key: string, value: string) => {
      const next = { ...activeValues, [key]: value };
      if (controlledValues === undefined) {
        setInternalValues(next);
      }
      onChange(next);
    },
    [activeValues, controlledValues, onChange],
  );

  const handleClearAll = React.useCallback(() => {
    const cleared: Record<string, string> = {};
    filters.forEach((f) => {
      cleared[f.key] = "";
    });
    if (controlledValues === undefined) {
      setInternalValues(cleared);
    }
    onChange(cleared);
  }, [filters, controlledValues, onChange]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]"
            >
              {activeCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              {clearLabel}
            </Button>
          )}

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground md:hidden"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? "Show" : "Hide"} filters
            {collapsed ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronUp className="size-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter dropdowns */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 transition-all duration-200",
          collapsed ? "hidden max-h-0 md:flex md:max-h-none" : "flex",
        )}
      >
        {filters.map((filter) => (
          <div key={filter.key} className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {filter.label}
            </label>
            <Select
              value={activeValues[filter.key] || "all"}
              onValueChange={(v) => handleChange(filter.key, v)}
            >
              <SelectTrigger
                className="h-8 w-[160px] text-xs dark:bg-muted/30 dark:border-border/40"
                size="sm"
              >
                <SelectValue placeholder={`All ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="dark:border-border/40">
                <SelectItem value="all">
                  All {filter.label.toLowerCase()}
                </SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}