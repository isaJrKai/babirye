'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreatLevelGaugeProps {
  value?: number;
  label?: string;
  size?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a 0–100 score to a color and label. */
function getThreatInfo(score: number): { color: string; label: string; bgColor: string } {
  if (score >= 80) {
    return { color: '#ef4444', label: 'CRITICAL', bgColor: 'rgba(239,68,68,0.15)' };
  }
  if (score >= 60) {
    return { color: '#f97316', label: 'HIGH', bgColor: 'rgba(249,115,22,0.15)' };
  }
  if (score >= 35) {
    return { color: '#eab308', label: 'MEDIUM', bgColor: 'rgba(234,179,8,0.15)' };
  }
  return { color: '#22c55e', label: 'LOW', bgColor: 'rgba(34,197,94,0.15)' };
}

/**
 * Calculate the SVG arc path for a semicircle.
 * Center at (cx, cy), radius r, from startAngle to endAngle (in degrees, 0 = 3 o'clock).
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// ---------------------------------------------------------------------------
// Gradient stops for the arc background
// ---------------------------------------------------------------------------

function GradientDefs() {
  return (
    <defs>
      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="40%" stopColor="#eab308" />
        <stop offset="70%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      {/* Glow filter for the needle */}
      <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Needle component
// ---------------------------------------------------------------------------

function Needle({
  value,
  cx,
  cy,
  radius,
  color,
}: {
  value: number;
  cx: number;
  cy: number;
  radius: number;
  color: string;
}) {
  // Map 0-100 to 180°-0° (semicircle, left-to-right)
  const angle = 180 - (value / 100) * 180;
  const tipLen = radius - 10;
  const tailLen = 12;

  const tipRad = ((angle - 90) * Math.PI) / 180;
  const tailRad = ((angle - 90 + 180) * Math.PI) / 180;

  const tipX = cx + tipLen * Math.cos(tipRad);
  const tipY = cy + tipLen * Math.sin(tipRad);
  const tailX = cx + tailLen * Math.cos(tailRad);
  const tailY = cy + tailLen * Math.sin(tailRad);

  // Perpendicular for width
  const perpRad = tipRad + Math.PI / 2;
  const halfWidth = 4;
  const p1x = cx + halfWidth * Math.cos(perpRad);
  const p1y = cy + halfWidth * Math.sin(perpRad);
  const p2x = cx - halfWidth * Math.cos(perpRad);
  const p2y = cy - halfWidth * Math.sin(perpRad);

  return (
    <polygon
      points={`${tipX},${tipY} ${p1x},${p1y} ${tailX},${tailY} ${p2x},${p2y}`}
      fill={color}
      stroke="hsl(var(--background))"
      strokeWidth={1}
      filter="url(#needleGlow)"
      style={{
        transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ThreatLevelGauge({
  value: externalValue = 42,
  label = 'Overall Threat Level',
  size = 220,
  className,
}: ThreatLevelGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const rafRef = useRef<number>(0);

  // Animate the needle from 0 to the target value using requestAnimationFrame
  // (setState is only called inside the rAF callback, never synchronously in the effect body)
  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const target = externalValue;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [externalValue]);

  const info = getThreatInfo(animatedValue);

  // SVG dimensions
  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = (size / 2) - 20;
  const strokeWidth = 14;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-0">
        <svg
          width={size}
          height={size / 2 + 30}
          viewBox={`0 0 ${size} ${size / 2 + 30}`}
          className="overflow-visible"
          role="img"
          aria-label={`Threat level: ${info.label} at ${animatedValue} out of 100`}
        >
          <GradientDefs />

          {/* Background arc (full semicircle) */}
          <path
            d={describeArc(cx, cy, radius, 180, 0)}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />

          {/* Active arc (value portion) */}
          <path
            d={describeArc(cx, cy, radius, 180, 180 - (animatedValue / 100) * 180)}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = 180 - (tick / 100) * 180;
            const inner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 4, angle);
            const outer = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 10, angle);
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                opacity={0.5}
              />
            );
          })}

          {/* Tick labels */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = 180 - (tick / 100) * 180;
            const pos = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 18, angle);
            return (
              <text
                key={tick}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={9}
                fontWeight={500}
              >
                {tick}
              </text>
            );
          })}

          {/* Needle */}
          <Needle
            value={animatedValue}
            cx={cx}
            cy={cy}
            radius={radius - strokeWidth / 2}
            color={info.color}
          />

          {/* Center dot */}
          <circle cx={cx} cy={cy} r={6} fill={info.color} />
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill="hsl(var(--background))"
          />
        </svg>

        {/* Score display */}
        <div className="mt-1 flex flex-col items-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: info.color }}
          >
            {animatedValue}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>

        {/* Threat level badge */}
        <div
          className="mt-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: info.color,
            backgroundColor: info.bgColor,
            border: `1px solid ${info.color}33`,
          }}
        >
          {info.label}
        </div>
      </CardContent>
    </Card>
  );
}