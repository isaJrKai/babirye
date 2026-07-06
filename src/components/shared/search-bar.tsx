"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Placeholder text shown in the input */
  placeholder?: string;
  /** Debounced callback fired 300ms after the user stops typing */
  onChange: (value: string) => void;
  /** External value for controlled usage */
  value?: string;
  /** Show a loading spinner (e.g. while fetching results) */
  loading?: boolean;
  /** Additional class names for the wrapper */
  className?: string;
  /** Keyboard shortcut hint displayed as a tooltip on the input */
  shortcutHint?: string;
  /** Disable the input */
  disabled?: boolean;
}

export function SearchBar({
  placeholder = "Search…",
  onChange,
  value: controlledValue,
  loading = false,
  className,
  shortcutHint = "⌘K",
  disabled = false,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState("");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Support both controlled and uncontrolled
  const currentValue = controlledValue ?? internalValue;

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(next);
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(next);
      }, 300);
    },
    [onChange, controlledValue],
  );

  const handleClear = React.useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue("");
    }
    onChange("");
    inputRef.current?.focus();
  }, [onChange, controlledValue]);

  // Register global keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-9 w-full bg-muted/50 pl-9 pr-20 text-sm",
          "border-border/60 focus-visible:border-ring",
          "placeholder:text-muted-foreground/60",
          "dark:bg-muted/30 dark:border-border/40",
        )}
      />

      {/* Right side: shortcut hint + clear / loading */}
      <div className="absolute right-2 flex items-center gap-1">
        {!currentValue && !loading && shortcutHint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                {shortcutHint}
              </kbd>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Press {shortcutHint} to focus
            </TooltipContent>
          </Tooltip>
        )}

        {loading && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}

        {currentValue && !loading && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}