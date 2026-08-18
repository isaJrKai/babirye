'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Bot, ShieldAlert, Bell, Radio, Cpu, MemoryStick, Network,
  Activity, AlertTriangle, CheckCircle2, XCircle, Clock,
  TrendingUp, Lock, Eye, Bug, Zap, Shield, Layers, Fingerprint,
  Globe, Wifi, Satellite, FileWarning, ArrowUpRight, ArrowDownRight,
  Scan, Play, Download, ShieldCheck, ShieldOff, Sword, Target,
  Server, HardDrive, ThermometerSun, Heart, Crown, Truck, Plane, Watch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { AgentMetricsChart } from '@/components/charts/agent-metrics-chart';
import { AlertTimelineChart } from '@/components/charts/alert-timeline-chart';
import { ThreatLevelGauge } from '@/components/charts/threat-level-gauge';
import { SensorCoverageChart } from '@/components/charts/sensor-coverage-chart';
import { ActivityTimeline } from '@/components/shared/activity-timeline';
import { StatCard } from '@/components/shared/stat-card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DashboardData {
  agents: { total: number; active: number };
  tasks: { pending: number; running: number; completed: number; failed: number; total: number };
  alerts: { critical: number; high: number; medium: number; low: number; info: number; total: number };
  sensors: { total: number; online: number; offline: number; onlinePercent: number };
  wallGuard: { total: number; active: number; totalBlocks: number };
  recentActivity: Array<{
    id: string; action: string; resource: string; details: string;
    userId: string; createdAt: string;
    user: { name: string; email: string };
  }>;
  recentAlerts: Array<{
    id: string; severity: string; type: string; title: string;
    status: string; createdAt: string; source: string;
  }>;
  systemMetrics: {
    cpu: { usagePercent: number; cores: number; model: string; loadAvg: number[] };
    memory: { totalGb: number; usedGb: number; freeGb: number; usagePercent: number };
    network: { interfaces: number; hostname: string; platform: string };
    uptime: number;
    queryTimeMs: number;
  };
  agentLoadPerDomain: Array<{
    domain: string; name: string; status: string; taskCount: number;
  }>;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  info: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const actionBadgeColors: Record<string, string> = {
  login: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
  agent_create: 'bg-sky-500/20 text-sky-400',
  agent_update: 'bg-sky-500/20 text-sky-400',
  task_create: 'bg-violet-500/20 text-violet-400',
  task_update: 'bg-violet-500/20 text-violet-400',
  task_cancel: 'bg-orange-500/20 text-orange-400',
  wall_block: 'bg-red-500/20 text-red-400',
  wall_test_all: 'bg-amber-500/20 text-amber-400',
  toggle_wall_guard: 'bg-amber-500/20 text-amber-400',
  council_decision: 'bg-emerald-500/20 text-emerald-400',
  escalate_alert: 'bg-red-500/20 text-red-400',
  update_alert: 'bg-amber-500/20 text-amber-400',
  agent_disable: 'bg-orange-500/20 text-orange-400',
};

const defenseLayers = [
  { name: 'Network Defense', icon: Globe, color: 'text-emerald-400', active: 24, dormant: 8 },
  { name: 'Endpoint Security', icon: Lock, color: 'text-sky-400', active: 18, dormant: 6 },
  { name: 'Application Shield', icon: Shield, color: 'text-violet-400', active: 15, dormant: 5 },
  { name: 'Identity & Access', icon: Fingerprint, color: 'text-amber-400', active: 12, dormant: 3 },
  { name: 'Data Protection', icon: Eye, color: 'text-rose-400', active: 10, dormant: 4 },
  { name: 'Micro-Defenses', icon: Bug, color: 'text-teal-400', active: 22, dormant: 6 },
];

const quickActions = [
  { label: 'Scan Network', icon: Scan, variant: 'default' as const, description: 'Discover all active hosts and services' },
  { label: 'Run Full Scan', icon: Play, variant: 'default' as const, description: 'Execute comprehensive system scan' },
  { label: 'Check Updates', icon: Download, variant: 'outline' as const, description: 'Verify tool and agent updates' },
  { label: 'Export Report', icon: FileWarning, variant: 'outline' as const, description: 'Generate PDF security report' },
  { label: 'Activate All Defenses', icon: ShieldCheck, variant: 'default' as const, description: 'Enable all dormant defense tools' },
  { label: 'Test Self-Attack Wall', icon: Sword, variant: 'destructive' as const, description: 'Validate wall guard detection' },
];

const defenseStatusGrid = [
  { name: 'Firewall', icon: Shield, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', activeTools: 24, status: 'active' as const, uptime: '99.8%' },
  { name: 'IDS/IPS', icon: Eye, color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20', activeTools: 18, status: 'active' as const, uptime: '99.5%' },
  { name: 'Application WAF', icon: Shield, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20', activeTools: 15, status: 'active' as const, uptime: '98.2%' },
  { name: 'Endpoint Protection', icon: Lock, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', activeTools: 12, status: 'degraded' as const, uptime: '97.1%' },
  { name: 'Data Protection', icon: Eye, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', activeTools: 10, status: 'active' as const, uptime: '100%' },
  { name: 'Cloud Security', icon: Globe, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', activeTools: 8, status: 'active' as const, uptime: '99.9%' },
  { name: 'Micro Defense', icon: Bug, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20', activeTools: 22, status: 'active' as const, uptime: '99.3%' },
];

const systemHealthChecks = [
  { name: 'API Server', icon: Server, status: 'healthy' as const, responseTime: '12ms', description: 'Next.js API routes responding normally' },
  { name: 'Database', icon: HardDrive, status: 'healthy' as const, responseTime: '3ms', description: 'SQLite read/write operations nominal' },
  { name: 'CPU Load', icon: ThermometerSun, status: 'warning' as const, responseTime: '78%', description: 'Elevated load — monitor closely' },
  { name: 'Memory', icon: Cpu, status: 'healthy' as const, responseTime: '62%', description: 'RAM usage within acceptable bounds' },
  { name: 'Heartbeat', icon: Heart, status: 'healthy' as const, responseTime: '1s', description: 'System heartbeat signal stable' },
];

const vipStatusProfiles = [
  { name: 'Principal Alpha', designation: 'CEO', threatLevel: 'critical' as const, droneCount: 4, vehicleCount: 2, wearableCount: 3, protectionLevel: 5 },
  { name: 'Principal Bravo', designation: 'CFO', threatLevel: 'high' as const, droneCount: 2, vehicleCount: 1, wearableCount: 2, protectionLevel: 4 },
  { name: 'Principal Charlie', designation: 'CTO', threatLevel: 'medium' as const, droneCount: 2, vehicleCount: 1, wearableCount: 1, protectionLevel: 3 },
];

const stagger = {
  hidden: {}, show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi<DashboardData>('/api/dashboard');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load dashboard: {error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
          Retry
        </Button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  const { agents, tasks, alerts, sensors, wallGuard, recentActivity, recentAlerts, systemMetrics, agentLoadPerDomain } = data;
  const openAlerts = alerts.total;

  /* Build timeline items from audit log data */
  const timelineItems = recentActivity.map((log) => {
    let type: 'success' | 'warning' | 'error' | 'info' = 'info';
    if (log.action.includes('error') || log.action.includes('fail')) type = 'error';
    else if (log.action.includes('create') || log.action.includes('login') || log.action.includes('decision')) type = 'success';
    else if (log.action.includes('escalate') || log.action.includes('cancel') || log.action.includes('disable')) type = 'warning';
    let detailStr = '';
    try { detailStr = JSON.stringify(JSON.parse(log.details)).slice(0, 120); } catch { detailStr = log.details?.slice(0, 120) || ''; }
    return {
      id: log.id,
      timestamp: log.createdAt,
      title: `${log.user?.name || 'System'} — ${log.action.replace(/_/g, ' ')}`,
      description: detailStr || log.resource,
      type,
      badge: log.action.replace(/_/g, ' '),
    };
  });

  /* Compute threat level from alert severity distribution */
  const threatScore = alerts.total > 0
    ? Math.min(100, Math.round((alerts.critical * 25 + alerts.high * 15 + alerts.medium * 5 + alerts.low * 1) / Math.max(1, alerts.total) * 10))
    : 0;
  const blockedThreats = wallGuard.totalBlocks;

  const chartData = agentLoadPerDomain.map((a) => ({
    name: a.name.length > 12 ? a.name.slice(0, 12) + '…' : a.name,
    domain: a.domain,
    tasks: a.taskCount,
    status: a.status,
  }));

  const barColors = ['hsl(160,70%,45%)', 'hsl(45,90%,50%)', 'hsl(200,70%,50%)', 'hsl(280,60%,55%)', 'hsl(340,60%,55%)', 'hsl(180,60%,45%)'];

  const taskTypeData = [
    { name: 'Completed', value: tasks.completed, fill: 'hsl(160,70%,45%)' },
    { name: 'Pending', value: tasks.pending + tasks.running, fill: 'hsl(200,70%,50%)' },
    { name: 'Failed', value: tasks.failed, fill: 'hsl(340,60%,55%)' },
  ];

  const maxTaskValue = Math.max(...taskTypeData.map(d => d.value), 1);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">Command Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">BABIRYE v10.0.0 — Real-time operational overview</p>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Agents', value: agents.active, sub: `of ${agents.total} total`, icon: Bot, color: 'text-emerald-400', trend: '+2', up: true },
          { label: 'Threats Blocked', value: blockedThreats, sub: 'by Self-Attack Wall', icon: ShieldAlert, color: 'text-red-400', trend: '+18', up: true },
          { label: 'Open Alerts', value: openAlerts, sub: `${alerts.critical} critical`, icon: Bell, color: 'text-amber-400', trend: '-3', up: false },
          { label: 'Sensors Online', value: sensors.online, sub: `${sensors.onlinePercent}% uptime`, icon: Radio, color: 'text-sky-400', trend: '+1', up: true },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className={`text-xs flex items-center gap-0.5 ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Shared Stat Cards ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Bot} title="Agents Total" value={agents.total} variant="emerald" change={2} changeLabel="this week" />
        <StatCard icon={Activity} title="Agents Active" value={agents.active} variant="sky" change={2} changeLabel="this week" />
        <StatCard icon={ShieldAlert} title="Wall Blocks" value={blockedThreats.toLocaleString()} variant="red" change={18} changeLabel="24h" />
        <StatCard icon={Radio} title="Sensors Online" value={`${sensors.online}/${sensors.total}`} variant="emerald" change={1} changeLabel="today" />
        <StatCard icon={CheckCircle2} title="Tasks Done" value={tasks.completed} variant="sky" change={5} changeLabel="this week" />
        <StatCard icon={Bell} title="Alerts Open" value={openAlerts} variant={alerts.critical > 0 ? 'red' : 'amber'} change={-3} changeLabel="24h" />
      </motion.div>

      {/* ── Shared Activity Timeline ────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" /> Activity Timeline
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Recent system audit log entries</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTimeline items={timelineItems} maxHeight="max-h-[280px]" />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Middle Row: Activity Feed + System Metrics ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="bg-slate-900/80 border-slate-700/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" /> Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div className="px-4 pb-4 space-y-2">
                  {recentActivity.length === 0 && (
                    <p className="text-xs text-slate-500 py-8 text-center">No recent activity</p>
                  )}
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-white font-medium">{log.user?.name || 'System'}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${actionBadgeColors[log.action] || 'bg-slate-700/50 text-slate-300'}`}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] text-slate-500">{log.resource}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{log.details ? JSON.parse(log.details).toString().slice(0, 100) : ''}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Metrics */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-900/80 border-slate-700/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" /> System Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-sky-400" /> CPU</span>
                  <span className="text-xs font-mono text-white">{systemMetrics.cpu.usagePercent}%</span>
                </div>
                <Progress value={systemMetrics.cpu.usagePercent} className="h-2 bg-slate-800 [&>div]:bg-sky-400" />
                <p className="text-[10px] text-slate-600 mt-1">{systemMetrics.cpu.cores} cores • Load: {systemMetrics.cpu.loadAvg[0]}</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><MemoryStick className="h-3.5 w-3.5 text-emerald-400" /> Memory</span>
                  <span className="text-xs font-mono text-white">{systemMetrics.memory.usagePercent}%</span>
                </div>
                <Progress value={systemMetrics.memory.usagePercent} className="h-2 bg-slate-800 [&>div]:bg-emerald-400" />
                <p className="text-[10px] text-slate-600 mt-1">{systemMetrics.memory.usedGb} / {systemMetrics.memory.totalGb} GB</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Network className="h-3.5 w-3.5 text-violet-400" /> Network</span>
                  <span className="text-xs font-mono text-white">{systemMetrics.network.interfaces} ifaces</span>
                </div>
                <Progress value={Math.min(100, systemMetrics.network.interfaces * 12)} className="h-2 bg-slate-800 [&>div]:bg-violet-400" />
                <p className="text-[10px] text-slate-600 mt-1">{systemMetrics.network.platform}</p>
              </div>
              <Separator className="bg-slate-800" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Uptime</span>
                <span className="text-slate-300 font-mono">{Math.floor(systemMetrics.uptime / 3600)}h {Math.floor((systemMetrics.uptime % 3600) / 60)}m</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Query time</span>
                <span className="text-emerald-400 font-mono">{systemMetrics.queryTimeMs}ms</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Charts Row: Agent Metrics + Threat Gauge + Sensor Coverage ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp}>
          <AgentMetricsChart />
        </motion.div>
        <motion.div variants={fadeUp}>
          <ThreatLevelGauge value={threatScore} label="System Health Threat Level" size={220} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <SensorCoverageChart />
        </motion.div>
      </div>

      {/* ── Alert Timeline Chart ─────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <AlertTimelineChart />
      </motion.div>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" /> Quick Actions
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Rapid operational commands</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="h-auto flex-col gap-2 py-4 px-3 bg-slate-800/50 border border-slate-700/40 hover:border-emerald-500/30 hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all"
                  onClick={() => refetch()}
                >
                  <action.icon className="h-5 w-5 text-emerald-400" />
                  <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Defense Status Grid ────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Defense Status Grid
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Active defense layers and their current operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {defenseStatusGrid.map((ds) => (
                <div key={ds.name} className={`rounded-lg border p-3 text-center ${ds.bgColor} ${ds.borderColor} transition-colors hover:scale-[1.02]`}>
                  <ds.icon className={`h-5 w-5 mx-auto mb-2 ${ds.color}`} />
                  <p className="text-[11px] font-medium text-white mb-1">{ds.name}</p>
                  <p className="text-lg font-bold text-white">{ds.activeTools}</p>
                  <p className="text-[10px] text-slate-400">active tools</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${ds.status === 'active' ? 'bg-emerald-400' : ds.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
                    <span className={`text-[10px] font-medium ${ds.status === 'active' ? 'text-emerald-400' : ds.status === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>{ds.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Uptime: {ds.uptime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent System Events Timeline (20 items) ────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" /> Recent System Events
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Last 20 system events from audit logs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTimeline items={timelineItems.slice(0, 20)} maxHeight="max-h-[480px]" />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── VIP Status Overview ────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" /> VIP Status Overview
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Active protectees and their resource allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {vipStatusProfiles.map((vip) => {
                const threatBadgeClass = vip.threatLevel === 'critical'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : vip.threatLevel === 'high'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                return (
                  <div key={vip.name} className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <div>
                          <p className="text-xs font-medium text-white">{vip.name}</p>
                          <p className="text-[10px] text-slate-500">{vip.designation}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize border ${threatBadgeClass}`}>
                        {vip.threatLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <Plane className="h-3.5 w-3.5 mx-auto text-sky-400 mb-1" />
                        <p className="text-sm font-bold text-white">{vip.droneCount}</p>
                        <p className="text-[9px] text-slate-500">Drones</p>
                      </div>
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <Truck className="h-3.5 w-3.5 mx-auto text-emerald-400 mb-1" />
                        <p className="text-sm font-bold text-white">{vip.vehicleCount}</p>
                        <p className="text-[9px] text-slate-500">Vehicles</p>
                      </div>
                      <div className="text-center p-2 rounded bg-slate-900/50">
                        <Watch className="h-3.5 w-3.5 mx-auto text-violet-400 mb-1" />
                        <p className="text-sm font-bold text-white">{vip.wearableCount}</p>
                        <p className="text-[9px] text-slate-500">Wearables</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Protection Level</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-1.5 w-4 rounded-full ${i < vip.protectionLevel ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom Row: Alerts + Agent Load + Defense Layers ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Alerts */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-900/80 border-slate-700/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recentAlerts.length === 0 && <p className="text-xs text-slate-500 text-center py-6">No alerts</p>}
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium truncate">{alert.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${severityColors[alert.severity] || ''}`}>
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] text-slate-500">{alert.source}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Agent Load Chart */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-900/80 border-slate-700/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" /> Agent Load
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">Tasks per agent domain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e293b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#34d399' }}
                    />
                    <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={barColors[idx % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Defense Layers */}
        <motion.div variants={fadeUp}>
          <Card className="bg-slate-900/80 border-slate-700/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" /> Defense Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {defenseLayers.map((layer) => (
                <div key={layer.name} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                  <layer.icon className={`h-4 w-4 ${layer.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">{layer.name}</p>
                    <p className="text-[10px] text-slate-500">{layer.active} active • {layer.dormant} dormant</p>
                  </div>
                  <div className="w-16">
                    <Progress value={(layer.active / (layer.active + layer.dormant)) * 100} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-400" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Total Tasks by Type (Horizontal Bar Chart) ────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" /> Total Tasks by Type
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Completed, pending, and failed task distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskTypeData.map((row) => (
                <div key={row.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: row.fill }} />
                      <span className="text-xs text-slate-300 font-medium">{row.name}</span>
                    </div>
                    <span className="text-xs font-mono text-white font-bold">{row.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / maxTaskValue) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' as const }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: row.fill }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500">Total: {tasks.total.toLocaleString()} tasks</span>
                <span className="text-[10px] text-emerald-400">Success Rate: {tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── System Health Panel ──────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> System Health
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time health check for critical subsystems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemHealthChecks.map((check) => (
              <div key={check.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <div className={`flex items-center justify-center rounded-lg p-2 ${check.status === 'healthy' ? 'bg-emerald-500/10' : check.status === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                  <check.icon className={`h-4 w-4 ${check.status === 'healthy' ? 'text-emerald-400' : check.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">{check.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{check.responseTime}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 border ${
                          check.status === 'healthy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : check.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{check.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}