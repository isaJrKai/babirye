'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SensorCoverageEntry {
  name: string;
  type: string;
  online: number;
  offline: number;
  total: number;
  color: string;
  offlineColor: string;
  value?: number;
  fill?: string;
}

interface SensorCoverageChartProps {
  data?: {
    type: string;
    label: string;
    online: number;
    offline: number;
  }[];
  className?: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: SensorCoverageEntry & { fill: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

// ---------------------------------------------------------------------------
// Sensor type colors
// ---------------------------------------------------------------------------

const SENSOR_TYPE_COLORS: Record<string, { online: string; offline: string }> = {
  radar:   { online: '#3b82f6', offline: '#1e40af' }, // blue
  sonar:   { online: '#06b6d4', offline: '#0e7490' }, // cyan
  lidar:   { online: '#a855f7', offline: '#7e22ce' }, // purple
  acoustic:{ online: '#f59e0b', offline: '#b45309' }, // amber
  ew:      { online: '#ef4444', offline: '#b91c1c' }, // red
  motion:  { online: '#10b981', offline: '#047857' }, // emerald
  thermal: { online: '#f97316', offline: '#c2410c' }, // orange
  default: { online: '#6b7280', offline: '#374151' }, // gray
};

// ---------------------------------------------------------------------------
// Sample data generator
// ---------------------------------------------------------------------------

function generateSampleData(): SensorCoverageEntry[] {
  const sensorTypes = [
    { type: 'radar', name: 'Radar' },
    { type: 'sonar', name: 'Sonar' },
    { type: 'lidar', name: 'LiDAR' },
    { type: 'acoustic', name: 'Acoustic' },
    { type: 'ew', name: 'Electronic Warfare' },
    { type: 'motion', name: 'Motion' },
    { type: 'thermal', name: 'Thermal' },
  ];

  return sensorTypes.map(({ type, name }) => {
    const online = Math.floor(Math.random() * 30) + 5;
    const offline = Math.floor(Math.random() * 6);
    const colors = SENSOR_TYPE_COLORS[type] ?? SENSOR_TYPE_COLORS.default;
    return {
      name,
      type,
      online,
      offline,
      total: online + offline,
      color: colors.online,
      offlineColor: colors.offline,
    };
  });
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function SensorTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  const onlinePercent = ((entry.online / entry.total) * 100).toFixed(1);

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-4 py-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-foreground">{entry.name}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">Online</span>
          </span>
          <span className="font-medium tabular-nums text-emerald-400">
            {entry.online}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.offlineColor }}
            />
            <span className="text-muted-foreground">Offline</span>
          </span>
          <span className="font-medium tabular-nums text-red-400">
            {entry.offline}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-bold tabular-nums text-foreground">
            {onlinePercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center label (donut hole)
// ---------------------------------------------------------------------------

function CenterLabel({ data }: { data: SensorCoverageEntry[] }) {
  const totalOnline = data.reduce((sum, d) => sum + d.online, 0);
  const totalAll = data.reduce((sum, d) => sum + d.total, 0);
  const percent = totalAll > 0 ? ((totalOnline / totalAll) * 100).toFixed(1) : '0';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-2xl font-bold tabular-nums text-foreground">
        {totalOnline}
      </span>
      <span className="text-xs text-muted-foreground">
        / {totalAll} online ({percent}%)
      </span>
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
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-4">
      {payload.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5 truncate">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
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

export function SensorCoverageChart({
  data: externalData,
  className,
}: SensorCoverageChartProps) {
  const chartData = useMemo<SensorCoverageEntry[]>(() => {
    if (externalData) {
      return externalData.map((item) => {
        const colors = SENSOR_TYPE_COLORS[item.type] ?? SENSOR_TYPE_COLORS.default;
        return {
          name: item.label,
          type: item.type,
          online: item.online,
          offline: item.offline,
          total: item.online + item.offline,
          color: colors.online,
          offlineColor: colors.offline,
        };
      });
    }
    return generateSampleData();
  }, [externalData]);

  // Build pie data: online segments with per-type colors
  const pieData = useMemo(() => {
    const entries: (SensorCoverageEntry & { fill: string })[] = [];
    for (const item of chartData) {
      if (item.online > 0) {
        entries.push({ ...item, value: item.online, fill: item.color });
      }
      if (item.offline > 0) {
        entries.push({
          ...item,
          value: item.offline,
          fill: item.offlineColor,
          name: `${item.name} (offline)`,
        });
      }
    }
    return entries;
  }, [chartData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Sensor Coverage</CardTitle>
        <p className="text-xs text-muted-foreground">
          Online vs offline sensors by type
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<SensorTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
          <CenterLabel data={chartData} />
        </div>
      </CardContent>
    </Card>
  );
}