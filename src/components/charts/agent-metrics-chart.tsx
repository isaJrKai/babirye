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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_DOMAIN_LABELS } from '@/lib/constants';
import type { AgentStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentDomainData {
  domain: string;
  label: string;
  running: number;
  idle: number;
  error: number;
}

interface AgentMetricsChartProps {
  data?: Record<string, { running: number; idle: number; error: number }>;
  className?: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  payload: AgentDomainData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<AgentStatus, string> = {
  running: '#10b981', // emerald-500
  idle: '#f59e0b',   // amber-500
  error: '#ef4444',   // red-500
  disabled: '#6b7280', // gray-500
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  error: 'Error',
  disabled: 'Disabled',
};

// ---------------------------------------------------------------------------
// Sample data generator
// ---------------------------------------------------------------------------

function generateSampleData(): AgentDomainData[] {
  const domains = Object.entries(AGENT_DOMAIN_LABELS).slice(0, 10);
  return domains.map(([key, label]) => ({
    domain: key,
    label,
    running: Math.floor(Math.random() * 8) + 1,
    idle: Math.floor(Math.random() * 4),
    error: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
  }));
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function AgentTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as AgentDomainData;
  const totalTasks = data.running + data.idle + data.error;

  return (
    <div className="rounded-lg border border-border/50 bg-popover px-4 py-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-foreground">{data.label}</p>
      <div className="space-y-1.5">
        {(['running', 'idle', 'error'] as AgentStatus[]).map((status) => {
          if (data[status] === 0) return null;
          return (
            <div key={status} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                <span className="text-muted-foreground">{STATUS_LABELS[status]}</span>
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {data[status]}
              </span>
            </div>
          );
        })}
        <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
          <span className="text-muted-foreground">Total Tasks</span>
          <span className="font-bold tabular-nums text-foreground">{totalTasks}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentMetricsChart({
  data: externalData,
  className,
}: AgentMetricsChartProps) {
  const chartData = useMemo<AgentDomainData[]>(() => {
    if (externalData) {
      return Object.entries(externalData).map(([domain, counts]) => ({
        domain,
        label: AGENT_DOMAIN_LABELS[domain] ?? domain,
        ...counts,
      }));
    }
    return generateSampleData();
  }, [externalData]);

  const tickFormatter = (value: string) => {
    const item = chartData.find((d) => d.domain === value);
    if (!item) return value;
    // Truncate long labels for mobile
    if (item.label.length > 12) {
      return item.label.slice(0, 10) + '…';
    }
    return item.label;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Agent Load Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">
          Tasks per agent domain by status
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="domain"
                tickFormatter={tickFormatter}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                content={<AgentTooltip />}
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              />
              <Bar
                dataKey="running"
                stackId="tasks"
                fill={STATUS_COLORS.running}
                radius={[0, 0, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                name="Running"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`running-${index}`} fill={STATUS_COLORS.running} />
                ))}
              </Bar>
              <Bar
                dataKey="idle"
                stackId="tasks"
                fill={STATUS_COLORS.idle}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={200}
                name="Idle"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`idle-${index}`} fill={STATUS_COLORS.idle} />
                ))}
              </Bar>
              <Bar
                dataKey="error"
                stackId="tasks"
                fill={STATUS_COLORS.error}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={400}
                name="Error"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`error-${index}`} fill={STATUS_COLORS.error} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {(['running', 'idle', 'error'] as AgentStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}