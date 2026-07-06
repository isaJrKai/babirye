'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WALL_GUARD_CATEGORY_LABELS } from '@/lib/constants';
import type { GuardCategory, GuardSeverity } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WallBlockEntry {
  category: GuardCategory;
  label: string;
  blocks: number;
  severity: GuardSeverity;
  color: string;
}

interface WallBlocksChartProps {
  data?: Record<GuardCategory, { blocks: number; severity: GuardSeverity }>;
  className?: string;
}

interface TooltipPayloadEntry {
  value: number;
  payload: WallBlockEntry;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

// ---------------------------------------------------------------------------
// Severity colors for guard categories
// ---------------------------------------------------------------------------

const SEVERITY_BAR_COLORS: Record<GuardSeverity, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#22c55e',      // green-500
};

// ---------------------------------------------------------------------------
// Sample data generator
// ---------------------------------------------------------------------------

function generateSampleData(): WallBlockEntry[] {
  const categories: { cat: GuardCategory; sev: GuardSeverity }[] = [
    { cat: 'injection', sev: 'critical' },
    { cat: 'exfiltration', sev: 'critical' },
    { cat: 'privilege', sev: 'high' },
    { cat: 'integrity', sev: 'high' },
    { cat: 'resource', sev: 'medium' },
    { cat: 'memory', sev: 'high' },
    { cat: 'credential', sev: 'critical' },
    { cat: 'input_validation', sev: 'medium' },
    { cat: 'crypto', sev: 'low' },
    { cat: 'supply_chain', sev: 'high' },
  ];

  return categories.map(({ cat, sev }) => ({
    category: cat,
    label: WALL_GUARD_CATEGORY_LABELS[cat] ?? cat,
    blocks: Math.floor(Math.random() * 200) + 10,
    severity: sev,
    color: SEVERITY_BAR_COLORS[sev],
  }));
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function WallTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-4 py-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="mb-1 font-semibold text-foreground">{entry.label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Total Blocks</span>
          <span className="font-bold tabular-nums text-foreground">
            {entry.blocks.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Severity</span>
          <span
            className="font-medium capitalize"
            style={{ color: entry.color }}
          >
            {entry.severity}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WallBlocksChart({
  data: externalData,
  className,
}: WallBlocksChartProps) {
  const chartData = useMemo<WallBlockEntry[]>(() => {
    if (externalData) {
      return Object.entries(externalData).map(([category, info]) => ({
        category: category as GuardCategory,
        label: WALL_GUARD_CATEGORY_LABELS[category] ?? category,
        blocks: info.blocks,
        severity: info.severity,
        color: SEVERITY_BAR_COLORS[info.severity],
      }));
    }
    return generateSampleData();
  }, [externalData]);

  const maxBlocks = Math.max(...chartData.map((d) => d.blocks), 1);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Wall Guard Blocks</CardTitle>
        <p className="text-xs text-muted-foreground">
          Blocks per guard category
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                domain={[0, 'auto']}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<WallTooltip />} />
              <Bar
                dataKey="blocks"
                radius={[0, 4, 4, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                name="Blocks"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    fillOpacity={0.6 + (entry.blocks / maxBlocks) * 0.4}
                  />
                ))}
                <LabelList
                  dataKey="blocks"
                  position="right"
                  style={{
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Severity Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {(['critical', 'high', 'medium', 'low'] as GuardSeverity[]).map(
            (sev) => (
              <span key={sev} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_BAR_COLORS[sev] }}
                />
                <span className="capitalize">{sev}</span>
              </span>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}