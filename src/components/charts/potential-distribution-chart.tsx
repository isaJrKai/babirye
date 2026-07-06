'use client';

import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PotentialRadarPoint {
  axis: string;
  label: string;
  total: number;
  highImpact: number;
  fullMark: number;
}

interface PotentialDistributionChartProps {
  data?: PotentialRadarPoint[];
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
// Axis definitions
// ---------------------------------------------------------------------------

const RADAR_AXES = [
  { axis: 'offensive', label: 'Offensive' },
  { axis: 'defensive', label: 'Defensive' },
  { axis: 'forensic', label: 'Forensic' },
  { axis: 'intelligence', label: 'Intelligence' },
  { axis: 'vip', label: 'VIP Protection' },
  { axis: 'cyber_kinetic', label: 'Cyber-Kinetic' },
  { axis: 'electronic_warfare', label: 'Electronic Warfare' },
] as const;

// ---------------------------------------------------------------------------
// Sample data generator
// ---------------------------------------------------------------------------

function generateSampleData(): PotentialRadarPoint[] {
  return RADAR_AXES.map(({ axis, label }) => {
    const total = Math.floor(Math.random() * 40) + 60;
    const highImpact = Math.floor(total * (0.2 + Math.random() * 0.5));
    return {
      axis,
      label,
      total,
      highImpact,
      fullMark: 100,
    };
  });
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function PotentialTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

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
              <span className="text-muted-foreground">{entry.name}</span>
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
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
  payload?: { value: string; color: string }[];
}) {
  if (!payload) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      {payload.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PotentialDistributionChart({
  data: externalData,
  className,
}: PotentialDistributionChartProps) {
  const chartData = useMemo<PotentialRadarPoint[]>(() => {
    if (externalData) return externalData;
    return generateSampleData();
  }, [externalData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Potential Capabilities
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribution across operational categories
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="72%"
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="label"
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip content={<PotentialTooltip />} />
              <Radar
                name="Total Potentials"
                dataKey="total"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.15}
                strokeWidth={2}
                animationDuration={1000}
                animationEasing="ease-out"
                dot={{
                  r: 3,
                  fill: '#a855f7',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 5,
                  fill: '#a855f7',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
              />
              <Radar
                name="High Impact"
                dataKey="highImpact"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.1}
                strokeWidth={2}
                animationDuration={1000}
                animationEasing="ease-out"
                animationBegin={300}
                dot={{
                  r: 3,
                  fill: '#f97316',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 1,
                }}
                activeDot={{
                  r: 5,
                  fill: '#f97316',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }}
              />
              <Legend content={<CustomLegend />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}