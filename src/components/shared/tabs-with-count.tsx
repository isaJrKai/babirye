"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** Unique value for this tab */
  value: string;
  /** Display label (count is appended automatically) */
  label: string;
  /** Count to show in the badge */
  count: number;
  /** Content rendered when this tab is active */
  content: React.ReactNode;
}

interface TabsWithCountProps {
  /** Tab definitions */
  tabs: TabItem[];
  /** Currently active tab value (controlled) */
  value?: string;
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Fired when the user switches tabs */
  onChange?: (value: string) => void;
  /** Additional class names on the root */
  className?: string;
  /** Additional class names on the list */
  listClassName?: string;
}

export function TabsWithCount({
  tabs,
  value,
  defaultValue,
  onChange,
  className,
  listClassName,
}: TabsWithCountProps) {
  const internalValue = React.useState(defaultValue ?? tabs[0]?.value ?? "")[0];

  // Support controlled / uncontrolled
  const currentValue = value ?? internalValue;

  return (
    <Tabs
      value={currentValue}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onChange}
      className={cn("w-full", className)}
    >
      <TabsList
        className={cn(
          "h-9 bg-muted/50 p-1 dark:bg-muted/30",
          listClassName,
        )}
      >
        {tabs.map((tab) => {
          const isActive = currentValue === tab.value;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "h-7 gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm dark:bg-input/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
                  isActive
                    ? "bg-primary/15 text-primary dark:bg-primary/20"
                    : "bg-muted-foreground/10 text-muted-foreground",
                )}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-3">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}