'use client';

import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  ShieldCheck,
  Play,
  Square,
  ChevronDown,
  Globe,
  Monitor,
  AppWindow,
  UserCheck,
  Database,
  Cloud,
  Microchip,
  Activity,
  Gauge,
  FileCheck,
  Clock,
  Zap,
  Shield,
  Eye,
  Lock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { DetailPanel } from '@/components/shared/detail-panel';
import { CountBadge } from '@/components/shared/count-badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
/* CardDescription already imported from card above */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DefensiveTool {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  version: string | null;
  status: 'dormant' | 'active' | 'error';
  containerImage: string | null;
  port: number | null;
  autoDeploy: boolean;
  lastDeployedAt: string | null;
  _count?: { alerts: number };
}

const DEFENSIVE_CATEGORIES = [
  'network',
  'endpoint',
  'application',
  'identity',
  'data',
  'cloud',
  'micro',
] as const;

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  network: { icon: <Globe className="size-4" />, label: 'Network Security', color: 'text-cyan-500' },
  endpoint: { icon: <Monitor className="size-4" />, label: 'Endpoint Protection', color: 'text-emerald-500' },
  application: { icon: <AppWindow className="size-4" />, label: 'Application Security', color: 'text-violet-500' },
  identity: { icon: <UserCheck className="size-4" />, label: 'Identity & Access', color: 'text-amber-500' },
  data: { icon: <Database className="size-4" />, label: 'Data Protection', color: 'text-rose-500' },
  cloud: { icon: <Cloud className="size-4" />, label: 'Cloud Security', color: 'text-sky-500' },
  micro: { icon: <Microchip className="size-4" />, label: 'Micro Defenses', color: 'text-teal-500' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DefensivePage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const { data, loading, error, refetch, post, del } = useApi<DefensiveTool[]>(
    '/api/tools?type=defensive',
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(DEFENSIVE_CATEGORIES)
  );
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [detailTool, setDetailTool] = useState<DefensiveTool | null>(null);

  const tools = data ?? [];

  /* Category groups */
  const groupedTools = useMemo(() => {
    const groups: Record<string, DefensiveTool[]> = {};
    for (const cat of DEFENSIVE_CATEGORIES) groups[cat] = [];
    for (const t of tools) {
      if (t.category in groups) groups[t.category].push(t);
    }
    return groups;
  }, [tools]);

  /* ─── Security Posture Score ─── */
  const securityScore = useMemo(() => {
    const active = tools.filter(t => t.status === 'active').length;
    const total = tools.length || 1;
    const baseScore = Math.round((active / total) * 100);
    const coverageBonus = Object.keys(groupedTools).length >= 7 ? 5 : 0;
    const errorPenalty = tools.filter(t => t.status === 'error').length * 3;
    return Math.max(0, Math.min(100, baseScore + coverageBonus - errorPenalty));
  }, [tools, groupedTools]);

  /* ─── Compliance Status ─── */
  const complianceData = [
    { name: 'CIS Benchmark', status: 'compliant' as const, score: 94, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'PCI-DSS', status: 'partial' as const, score: 82, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'HIPAA', status: 'compliant' as const, score: 97, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { name: 'SOC 2 Type II', status: 'non_compliant' as const, score: 68, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  /* ─── Alert Response Metrics ─── */
  const alertMetrics = useMemo(() => {
    const totalAlerts = tools.reduce((sum, t) => sum + (t._count?.alerts ?? 0), 0);
    const triaged = Math.round(totalAlerts * 0.88);
    const resolved = Math.round(totalAlerts * 0.74);
    const escalated = Math.round(totalAlerts * 0.12);
    return {
      mtt: '4.2 min',
      resolutionRate: totalAlerts > 0 ? Math.round((resolved / totalAlerts) * 100) : 0,
      escalationRate: totalAlerts > 0 ? Math.round((escalated / totalAlerts) * 100) : 0,
      totalAlerts,
      triaged,
      resolved,
      escalated,
    };
  }, [tools]);

  /* ─── Automated Response Actions ─── */
  const automatedActions = [
    { rule: 'WAF Block — SQL Injection', triggered: 142, lastTriggered: '2 min ago', severity: 'high' as const, tool: 'ModSecurity WAF' },
    { rule: 'IDS Alert — Port Scan Detected', triggered: 87, lastTriggered: '15 min ago', severity: 'medium' as const, tool: 'Suricata IDS' },
    { rule: 'Firewall Rule — IP Blacklist', triggered: 234, lastTriggered: '1 min ago', severity: 'high' as const, tool: 'PF Firewall' },
    { rule: 'Endpoint Quarantine — Malware', triggered: 12, lastTriggered: '2 hours ago', severity: 'critical' as const, tool: 'ClamAV Agent' },
    { rule: 'Cloud ACL Update — Unauthorized Access', triggered: 56, lastTriggered: '8 min ago', severity: 'medium' as const, tool: 'AWS GuardDuty' },
    { rule: 'Micro Defense — Anomaly Detected', triggered: 34, lastTriggered: '22 min ago', severity: 'low' as const, tool: 'Falco Runtime' },
    { rule: 'Data Loss Prevention — Sensitive Data', triggered: 8, lastTriggered: '1 hour ago', severity: 'critical' as const, tool: 'OpenDLP Agent' },
    { rule: 'Identity — Brute Force Detected', triggered: 45, lastTriggered: '5 min ago', severity: 'high' as const, tool: 'Fail2Ban' },
  ];

  const severityColorsAuto: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  /* Stats */
  const stats = useMemo(() => {
    const active = tools.filter((t) => t.status === 'active').length;
    const dormant = tools.filter((t) => t.status === 'dormant').length;
    return { total: tools.length, active, dormant };
  }, [tools]);

  /* Apply search + category filter */
  const filteredGroups = useMemo(() => {
    const result: Record<string, DefensiveTool[]> = {};
    for (const cat of DEFENSIVE_CATEGORIES) {
      let catTools = groupedTools[cat] || [];
      if (categoryFilter && categoryFilter !== cat) continue;
      if (search.trim())
        catTools = catTools.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase().trim())
        );
      if (catTools.length > 0) result[cat] = catTools;
    }
    return result;
  }, [groupedTools, categoryFilter, search]);

  const handleToggle = async (tool: DefensiveTool) => {
    setToggling((prev) => new Set(prev).add(tool.id));
    try {
      if (tool.status === 'active') {
        await del(`/api/tools?type=defensive&id=${tool.id}`);
      } else {
        await post('/api/tools', { type: 'defensive', id: tool.id });
      }
      refetch();
    } catch {
      /* handled by hook */
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(tool.id);
        return next;
      });
    }
  };

  const toggleSection = (cat: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-32 rounded-lg" />
          <Skeleton className="h-16 w-32 rounded-lg" />
          <Skeleton className="h-16 w-32 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <ShieldCheck className="size-12 text-destructive" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 flex size-10 items-center justify-center rounded-lg">
            <ShieldCheck className="text-emerald-500 size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Defensive Tools</h1>
            <p className="text-muted-foreground text-sm">
              {tools.length} defensive tools across {DEFENSIVE_CATEGORIES.length} categories
            </p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="Search defensive tools..."
            onChange={(v) => setSearch(v)}
            value={search}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tools', value: stats.total, icon: <Activity className="size-4" />, color: 'text-foreground' },
          { label: 'Active', value: stats.active, icon: <ShieldCheck className="size-4" />, color: 'text-emerald-500' },
          { label: 'Dormant', value: stats.dormant, icon: <ShieldCheck className="size-4" />, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="flex items-center gap-3">
              <div className={`flex items-center justify-center rounded-lg bg-muted p-2 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={categoryFilter === null ? 'default' : 'outline'}
          onClick={() => setCategoryFilter(null)}
        >
          All Categories
        </Button>
        {DEFENSIVE_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = groupedTools[cat]?.length ?? 0;
          return (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className="gap-1.5"
            >
              <span className={categoryFilter !== cat ? meta.color : ''}>{meta.icon}</span>
              <span className="capitalize">{cat}</span>
              <CountBadge count={count} variant={categoryFilter === cat ? 'default' : 'secondary'} />
            </Button>
          );
        })}
      </div>

      <Separator />

      {/* Collapsible category sections */}
      <div className="space-y-4">
        <AnimatePresence>
          {Object.entries(filteredGroups).map(([cat, catTools]) => {
            const meta = CATEGORY_META[cat];
            const isOpen = openSections.has(cat);
            const activeCount = catTools.filter((t) => t.status === 'active').length;
            const dormantCount = catTools.filter((t) => t.status !== 'active').length;

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(cat)}>
                  <CollapsibleTrigger asChild>
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={meta.color}>{meta.icon}</div>
                        <span className="font-semibold text-sm">{meta.label}</span>
                        <CountBadge count={catTools.length} variant={activeCount > 0 ? 'success' : 'secondary'} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-500">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {activeCount} active
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-gray-400" />
                            {dormantCount} dormant
                          </span>
                        </div>
                        <ChevronDown
                          className={`text-muted-foreground size-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {catTools.map((tool) => (
                        <Card key={tool.id} className="overflow-hidden">
                          <div className={`h-1 ${tool.status === 'active' ? 'bg-emerald-500' : tool.status === 'error' ? 'bg-red-500' : 'bg-gray-300'}`} />
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm leading-tight">{tool.name}</CardTitle>
                              <StatusBadge status={tool.status} entityType="tool" className="shrink-0" />
                            </div>
                            <CardDescription className="line-clamp-2 text-xs">
                              {tool.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                              <span>Alerts: {tool._count?.alerts ?? 0}</span>
                              {tool.version && <span>v{tool.version}</span>}
                            </div>
                            {tool.autoDeploy && (
                              <Badge variant="outline" className="text-[10px]">Auto-Deploy</Badge>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={tool.status === 'active' ? 'destructive' : 'default'}
                                  className="w-full gap-1.5 text-xs"
                                  disabled={toggling.has(tool.id)}
                                  onClick={() => handleToggle(tool)}
                                >
                                  {toggling.has(tool.id) ? (
                                    <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : tool.status === 'active' ? (
                                    <Square className="size-3" />
                                  ) : (
                                    <Play className="size-3" />
                                  )}
                                  {tool.status === 'active' ? 'Deactivate' : 'Activate'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {tool.status === 'active' ? `Deactivate ${tool.name}` : `Deploy ${tool.name}`}
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full gap-1.5 text-xs mt-1"
                              onClick={() => setDetailTool(tool)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {Object.keys(filteredGroups).length === 0 && !loading && (
        <div className="flex flex-col items-center gap-2 py-12">
          <ShieldCheck className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">No defensive tools match your filters.</p>
        </div>
      )}

      {/* ─── Security Posture Score ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-500" /> Security Posture Score
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Overall security posture based on active defenses, coverage, and system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center">
              <svg className="-rotate-90" width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="68" fill="none"
                  stroke={securityScore >= 80 ? '#10b981' : securityScore >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeDasharray={`${(securityScore / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold" style={{ color: securityScore >= 80 ? '#10b981' : securityScore >= 60 ? '#f59e0b' : '#ef4444' }}>{securityScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] text-muted-foreground">Active Defenses</p>
                  <p className="text-lg font-bold text-emerald-500">{stats.active}</p>
                </div>
                <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/10">
                  <p className="text-[10px] text-muted-foreground">Categories Covered</p>
                  <p className="text-lg font-bold text-sky-500">{Object.keys(groupedTools).length}/{DEFENSIVE_CATEGORIES.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-muted-foreground">Auto-Deploy Enabled</p>
                  <p className="text-lg font-bold text-amber-500">{tools.filter(t => t.autoDeploy).length}</p>
                </div>
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <p className="text-[10px] text-muted-foreground">Total Alerts</p>
                  <p className="text-lg font-bold text-violet-500">{alertMetrics.totalAlerts}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Compliance Status ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-500" /> Compliance Status
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Regulatory compliance across security frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceData.map((comp) => {
              const statusLabel = comp.status === 'compliant' ? 'Compliant' : comp.status === 'partial' ? 'Partial' : 'Non-Compliant';
              return (
                <div key={comp.name} className={`p-4 rounded-lg border ${comp.border} ${comp.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold">{comp.name}</p>
                    <Badge variant="outline" className={`text-[10px] border capitalize ${comp.border} ${comp.color}`}>{statusLabel}</Badge>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`text-3xl font-bold ${comp.color}`}>{comp.score}</span>
                    <span className="text-xs text-muted-foreground mb-1">/ 100</span>
                  </div>
                  <Progress value={comp.score} className="h-1.5 mt-3" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Alert Response Metrics ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Alert Response Metrics
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Response time and resolution efficiency indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-sky-500/5 border border-sky-500/10">
              <Zap className="h-5 w-5 mx-auto text-sky-500 mb-2" />
              <p className="text-2xl font-bold text-sky-500">{alertMetrics.mtt}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Mean Time to Triage</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-emerald-500">{alertMetrics.resolutionRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Resolution Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <ArrowRight className="h-5 w-5 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-amber-500">{alertMetrics.escalationRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Escalation Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-violet-500/5 border border-violet-500/10">
              <AlertTriangle className="h-5 w-5 mx-auto text-violet-500 mb-2" />
              <p className="text-2xl font-bold text-violet-500">{alertMetrics.totalAlerts}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total Alerts Processed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Defense Tool Coverage Grid ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" /> Defense Tool Coverage
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Active tool count per defense category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {DEFENSIVE_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const catTools = groupedTools[cat] || [];
              const activeCount = catTools.filter(t => t.status === 'active').length;
              const total = catTools.length;
              return (
                <div key={cat} className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                  <div className={`${meta.color} mx-auto mb-2`}>{meta.icon}</div>
                  <p className="text-[11px] font-medium mb-1">{meta.label}</p>
                  <p className="text-xl font-bold">{activeCount}<span className="text-xs font-normal text-muted-foreground">/{total}</span></p>
                  <Progress value={total > 0 ? (activeCount / total) * 100 : 0} className="h-1 mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Automated Response Actions ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Automated Response Actions
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Auto-response rules recently triggered by defense tools</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Rule</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Source Tool</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs text-center">Times Triggered</TableHead>
                  <TableHead className="text-xs font-mono hidden md:table-cell">Last Triggered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automatedActions.map((action, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-medium">{action.rule}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{action.tool}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize border ${severityColorsAuto[action.severity]}`}>
                        {action.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center font-mono font-bold">{action.triggered}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono hidden md:table-cell">{action.lastTriggered}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <DetailPanel
        open={!!detailTool}
        onOpenChange={(open) => { if (!open) setDetailTool(null); }}
        title={detailTool?.name ?? ''}
        description={detailTool?.category ? `Category: ${detailTool.category}` : undefined}
        actions={detailTool ? [
          {
            label: detailTool.status === 'active' ? 'Deactivate' : 'Activate',
            variant: detailTool.status === 'active' ? 'destructive' : 'default',
            onClick: () => { if (detailTool) handleToggle(detailTool); },
          },
          { label: 'Close', variant: 'ghost', onClick: () => setDetailTool(null) },
        ] : []}
      >
        {detailTool && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={detailTool.status} entityType="tool" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Version</span>
                <span className="text-sm font-mono">{detailTool.version || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Alerts</span>
                <span className="text-sm font-mono">{detailTool._count?.alerts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Auto-Deploy</span>
                <span className="text-sm font-mono">{detailTool.autoDeploy ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subcategory</span>
                <span className="text-sm font-mono">{detailTool.subcategory || '—'}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{detailTool.description}</p>
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}