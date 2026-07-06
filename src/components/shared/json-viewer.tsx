"use client";

import * as React from "react";
import { Copy, Check, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/* ─── JSON Viewer ────────────────────────────────────────────────── */

interface JsonViewerProps {
  /** The JSON data to display */
  data: unknown;
  /** Max height before scrolling */
  maxHeight?: string;
  /** Additional class names on the root container */
  className?: string;
  /** Initial expanded depth (default 2, set Infinity for fully expanded) */
  initialDepth?: number;
}

export function JsonViewer({
  data,
  maxHeight = "max-h-96",
  className,
  initialDepth = 2,
}: JsonViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const jsonString = React.useMemo(
    () => JSON.stringify(data, null, 2),
    [data],
  );

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [jsonString]);

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/50 bg-muted/30 dark:bg-muted/20",
        className,
      )}
    >
      {/* Copy button */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          JSON
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3 text-emerald-400" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <ScrollArea className={maxHeight}>
        <pre className="p-3 font-mono text-[13px] leading-relaxed">
          <JsonNode value={data} depth={0} initialDepth={initialDepth} />
        </pre>
      </ScrollArea>
    </div>
  );
}

/* ─── Recursive JSON node ────────────────────────────────────────── */

function JsonNode({
  value,
  depth,
  initialDepth,
  isLast = true,
}: {
  value: unknown;
  depth: number;
  initialDepth: number;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(depth < initialDepth);

  // Primitives
  if (value === null) {
    return <span className="text-zinc-500">null</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className="text-amber-400 dark:text-amber-300">
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number") {
    return (
      <span className="text-sky-400 dark:text-sky-300">{String(value)}</span>
    );
  }
  if (typeof value === "string") {
    return (
      <span className="text-emerald-400 dark:text-emerald-300">
        &quot;{value}&quot;
      </span>
    );
  }

  // Arrays and objects
  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  const openBrace = isArray ? "[" : "{";
  const closeBrace = isArray ? "]" : "}";
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <span className="text-muted-foreground">
        {openBrace}{closeBrace}
      </span>
    );
  }

  return (
    <span className="inline">
      {/* Expand/collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-0.5 align-middle text-muted-foreground hover:text-foreground transition-colors"
        aria-label={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>

      <span className="text-muted-foreground">{openBrace}</span>

      {!expanded && (
        <span className="text-muted-foreground/60 text-xs">
          {" "}
          {/* {entries.length} items */}
          ...
        </span>
      )}

      {expanded && (
        <span className="inline">
          <div className="pl-4 border-l border-border/30 ml-0.5">
            {entries.map(([key, val], i) => (
              <div key={key} className="py-px">
                {!isArray && (
                  <span className="text-foreground/70">
                    &quot;{key}&quot;:{" "}
                  </span>
                )}
                <JsonNode
                  value={val}
                  depth={depth + 1}
                  initialDepth={initialDepth}
                  isLast={i === entries.length - 1}
                />
                {i < entries.length - 1 && (
                  <span className="text-muted-foreground">,</span>
                )}
              </div>
            ))}
          </div>
        </span>
      )}

      <span className="text-muted-foreground">{closeBrace}</span>
      {!isLast && <span className="text-muted-foreground">,</span>}
    </span>
  );
}