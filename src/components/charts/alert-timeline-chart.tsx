'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AlertSeverity } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertTimelineDataPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AlertTimelineChartProps {
  data?: AlertTimelineDataPoint[];
  className?: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

// ---------------------------------------------------------------------------
// Severity color mapping
// ---------------------------------------------------------------------------

const SEVERITY_FILL: Record<AlertSeverity, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#22c55e',      // green-500
  info: '#6b7280',     // gray-500
};

const SEVERITY_STROKE: Record<AlertSeverity, string> = {
  critical: '#dc2626', // red-600
  high: '#ea580c',     // orange-600
  medium: '#ca8a04',   // yellow-600
  low: '#16a34a',      // green-600
  info: '#4b5563',     // gray-600
};

// ---------------------------------------------------------------------------
// Sample data generator – 30 days of realistic alert counts
// ---------------------------------------------------------------------------

function generateSampleData(): AlertTimelineDataPoint[] {
  const data: AlertTimelineDataPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Simulate a realistic pattern with weekly spikes
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 0.5 : 1;
    const spikeFactor = dayOfWeek === 2 ? 1.8 : 1; // Tuesday spikes

    const baseFactor = weekendFactor * spikeFactor;

    data.push({
      date: dateStr,
      critical: Math.max(0, Math.round((Math.random() * 4 + 1) * baseFactor)),
      high: Math.max(0, Math.round((Math.random() * 8 + 3) * baseFactor)),
      medium: Math.max(0, Math.round((Math.random() * 15 + 5) * baseFactor)),
      low: Math.max(0, Math.round((Math.random() * 20 + 8) * baseFactor)),
    });
  }

  return data;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function AlertTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-4 py-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize text-muted-foreground">
                {entry.name}
              </span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
        <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
          <span className="text-muted-foreground">Total Alerts</span>
          <span className="font-bold tabular-nums text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Legend
// ---------------------------------------------------------------------------

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string; dataKey: string }[];
}) {
  if (!payload) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      {payload.map((entry) => (
        <span key={entry.dataKey} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AlertTimelineChart({
  data: externalData,
  className,
}: AlertTimelineChartProps) {
  const chartData = useMemo<AlertTimelineDataPoint[]>(() => {
    return externalData ?? generateSampleData();
  }, [externalData]);

  const severityKeys: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Alert Timeline</CardTitle>
        <p className="text-xs text-muted-foreground">
          Alert volume by severity — last 30 days
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                {severityKeys.map((sev) => (
                  <linearGradient
                    key={sev}
                    id={`gradient-${sev}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={SEVERITY_FILL[sev]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={SEVERITY_FILL[sev]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                content={<AlertTooltip />}
              />
              <Legend content={<CustomLegend />} />

              {severityKeys.map((sev, idx) => (
                <Area
                  key={sev}
                  type="monotone"
                  dataKey={sev}
                  stroke={SEVERITY_STROKE[sev]}
                  fill={`url(#gradient-${sev})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: SEVERITY_STROKE[sev],
                    fill: 'hsl(var(--background))',
                  }}
                  stackId={idx === 0 ? undefined : 'alerts'}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  animationBegin={idx * 150}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}