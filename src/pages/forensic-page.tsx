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
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  Shield,
  Play,
  Square,
  Fingerprint,
  Cpu,
  Smartphone,
  Globe,
  MemoryStick,
  Zap,
  FolderOpen,
  FileText,
  Clock,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
  Camera,
  HardDrive,
  Package,
} from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar } from '@/components/shared/filter-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { DetailPanel } from '@/components/shared/detail-panel';
import { CountBadge } from '@/components/shared/count-badge';
import { JsonViewer } from '@/components/shared/json-viewer';
import { ActivityTimeline } from '@/components/shared/activity-timeline';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ForensicTool {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: 'dormant' | 'active' | 'error';
  port: number | null;
  lastDeployedAt: string | null;
  _count?: { cases: number };
}

const FORENSIC_CATEGORIES = [
  'android',
  'ios',
  'computer',
  'network',
  'memory',
  'advanced',
] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  android: <Smartphone className="size-3.5" />,
  ios: <Smartphone className="size-3.5" />,
  computer: <Cpu className="size-3.5" />,
  network: <Globe className="size-3.5" />,
  memory: <MemoryStick className="size-3.5" />,
  advanced: <Zap className="size-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  dormant: 'border-l-gray-400',
  active: 'border-l-emerald-500',
  error: 'border-l-red-500',
};

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  dormant: 'secondary',
  active: 'default',
  error: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ForensicPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const { data, loading, error, refetch, post, del } = useApi<ForensicTool[]>(
    '/api/tools?type=forensic',
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [detailTool, setDetailTool] = useState<ForensicTool | null>(null);

  const tools = data ?? [];

  /* ─── Forensic Statistics computed from tools ─── */
  const forensicStats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = { active: 0, dormant: 0, error: 0 };
    const recentlyDeployed = tools
      .filter((t) => t.lastDeployedAt)
      .sort((a, b) => new Date(b.lastDeployedAt!).getTime() - new Date(a.lastDeployedAt!).getTime())
      .slice(0, 10);
    for (const t of tools) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
    const totalCases = tools.reduce((sum, t) => sum + (t._count?.cases ?? 0), 0);
    return { byCategory, byStatus, recentlyDeployed, totalCases };
  }, [tools]);

  /* ─── Evidence Timeline mock data (derived from tools + cases) ─── */
  const evidenceTimeline = useMemo(() => {
    return tools.slice(0, 10).map((t, idx) => {
      const evidenceTypes = ['Disk Image', 'Memory Dump', 'Network Capture', 'Log Archive', 'Artifact Extract', 'Malware Sample', 'Registry Hive', 'Filesystem Timeline'];
      const statuses: Array<'success' | 'warning' | 'error' | 'info'> = ['success', 'info', 'success', 'warning', 'success', 'error', 'info', 'success'];
      return {
        id: `ev-${t.id}`,
        timestamp: t.lastDeployedAt || new Date(Date.now() - idx * 3600000).toISOString(),
        title: `${evidenceTypes[idx % evidenceTypes.length]} collected from ${t.name}`,
        description: `Category: ${t.category} · Case #${(t._count?.cases ?? 0) || idx + 1}`,
        type: statuses[idx % statuses.length] as 'success' | 'warning' | 'error' | 'info',
        badge: evidenceTypes[idx % evidenceTypes.length],
      };
    });
  }, [tools]);

  /* ─── Case Management mock data ─── */
  const caseCards = useMemo(() => {
    const caseNames = ['Phishing Campaign Investigation', 'Ransomware Incident Response', 'Insider Threat Analysis', 'Data Breach Forensics', 'Network Intrusion Analysis'];
    const caseStatuses = ['open', 'in_progress', 'closed', 'open', 'in_progress'];
    const caseSeverities = ['critical', 'high', 'medium', 'critical', 'high'];
    return caseNames.map((name, idx) => ({
      id: `case-${idx + 1}`,
      name,
      status: caseStatuses[idx],
      severity: caseSeverities[idx],
      toolCount: Math.floor(Math.random() * 5) + 2,
      evidenceCount: Math.floor(Math.random() * 20) + 5,
      createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
    }));
  }, []);

  /* ─── Case Workflow Steps ─── */
  const workflowSteps = [
    { name: 'Acquire', icon: Camera, description: 'Collect evidence from target systems', status: 'completed' as const },
    { name: 'Image', icon: HardDrive, description: 'Create forensic images of storage media', status: 'completed' as const },
    { name: 'Analyze', icon: Cpu, description: 'Examine artifacts, logs, and indicators', status: 'in_progress' as const },
    { name: 'Report', icon: FileText, description: 'Document findings and recommendations', status: 'pending' as const },
  ];

  const filteredTools = useMemo(() => {
    let result = tools;
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter);
    if (search.trim())
      result = result.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase().trim())
      );
    return result;
  }, [tools, categoryFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of FORENSIC_CATEGORIES) counts[c] = 0;
    for (const t of tools) {
      if (t.category in counts) counts[t.category]++;
    }
    return counts;
  }, [tools]);

  const handleToggle = async (tool: ForensicTool) => {
    setToggling((prev) => new Set(prev).add(tool.id));
    try {
      if (tool.status === 'active') {
        await del(`/api/tools?type=forensic&id=${tool.id}`);
      } else {
        await post('/api/tools', { type: 'forensic', id: tool.id });
      }
      refetch();
    } catch {
      /* error handled by hook */
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(tool.id);
        return next;
      });
    }
  };

  /* ----- UI helpers ----- */
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Shield className="size-12 text-destructive" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
            <Fingerprint className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Forensic Tools</h1>
            <p className="text-muted-foreground text-sm">
              {filteredTools.length} of {tools.length} tools shown
            </p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="Search forensic tools..."
            onChange={(v) => setSearch(v)}
            value={search}
          />
        </div>
      </div>

      {/* Category filter */}
      <FilterBar
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: FORENSIC_CATEGORIES.map((cat) => ({
              value: cat,
              label: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${categoryCounts[cat]})`,
            })),
          },
        ]}
        values={{ category: categoryFilter ?? '' }}
        onChange={(vals) => setCategoryFilter(vals.category && vals.category !== 'all' ? vals.category : null)}
      />

      {/* Category filter pills with CountBadge */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={categoryFilter === null ? 'default' : 'outline'}
          onClick={() => setCategoryFilter(null)}
          className="gap-1.5"
        >
          All <CountBadge count={tools.length} variant={categoryFilter === null ? 'default' : 'secondary'} />
        </Button>
        {FORENSIC_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={categoryFilter === cat ? 'default' : 'outline'}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            className="gap-1.5"
          >
            <span className="flex items-center gap-1.5 capitalize">
              {CATEGORY_ICONS[cat]} {cat} <CountBadge count={categoryCounts[cat]} variant={categoryFilter === cat ? 'default' : 'secondary'} />
            </span>
          </Button>
        ))}
      </div>

      {/* Tool cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`border-l-4 ${STATUS_COLORS[tool.status] || 'border-l-gray-400'}`}>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1 capitalize text-[10px]">
                      {CATEGORY_ICONS[tool.category]} {tool.category}
                    </Badge>
                    {tool.version && (
                      <span className="text-muted-foreground text-[10px]">v{tool.version}</span>
                    )}
                  </div>

                  <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                    <span>Port: {tool.port ?? '—'}</span>
                    <span>Cases: {tool._count?.cases ?? 0}</span>
                  </div>

                  <div className="text-muted-foreground text-[11px]">
                    Last deployed: {formatDate(tool.lastDeployedAt)}
                  </div>

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
                      {tool.status === 'active' ? 'Deactivate this tool' : 'Deploy and activate'}
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTools.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Fingerprint className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">No forensic tools match your filters.</p>
        </div>
      )}

      {/* ─── Case Management Section ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/10 flex size-9 items-center justify-center rounded-lg">
            <FolderOpen className="text-violet-500 size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Case Management</h2>
            <p className="text-muted-foreground text-xs">Active forensic investigations and case files</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {caseCards.map((c) => {
            const severityClass = c.severity === 'critical'
              ? 'bg-red-500/10 text-red-600 border-red-500/20'
              : c.severity === 'high'
              ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            const statusBg = c.status === 'closed'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : c.status === 'in_progress'
              ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xs leading-tight line-clamp-2">{c.name}</CardTitle>
                    <Badge variant="outline" className={`text-[9px] shrink-0 border capitalize ${severityClass}`}>
                      {c.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Badge variant="outline" className={`text-[10px] border capitalize ${statusBg}`}>
                    {c.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Cpu className="size-3" /> {c.toolCount} tools</span>
                    <span className="flex items-center gap-1"><FileText className="size-3" /> {c.evidenceCount} items</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Created: {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Evidence Timeline ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" /> Evidence Timeline
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Last 10 evidence items from forensic cases</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityTimeline items={evidenceTimeline} maxHeight="max-h-[400px]" />
        </CardContent>
      </Card>

      {/* ─── Forensic Statistics ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cases by Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Tools by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(forensicStats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
              const maxCount = Math.max(...Object.values(forensicStats.byCategory));
              const pct = (count / maxCount) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{cat}</span>
                    <span className="font-mono font-medium">{count}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Tools by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-500" /> Tools by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(forensicStats.byStatus).map(([status, count]) => {
                const colorMap: Record<string, string> = { active: 'text-emerald-500', dormant: 'text-slate-400', error: 'text-red-500' };
                const bgMap: Record<string, string> = { active: 'bg-emerald-500/10', dormant: 'bg-slate-500/10', error: 'bg-red-500/10' };
                return (
                  <div key={status} className={`text-center p-3 rounded-lg ${bgMap[status]}`}>
                    <p className={`text-2xl font-bold ${colorMap[status]}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground capitalize mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Cases Linked</span>
                <span className="font-mono font-bold text-violet-500">{forensicStats.totalCases}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence by Type Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" /> Evidence by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { type: 'Disk Images', count: 34, color: 'bg-emerald-500' },
              { type: 'Memory Dumps', count: 22, color: 'bg-sky-500' },
              { type: 'Network Captures', count: 18, color: 'bg-violet-500' },
              { type: 'Log Archives', count: 45, color: 'bg-amber-500' },
              { type: 'Malware Samples', count: 12, color: 'bg-red-500' },
              { type: 'Registry Hives', count: 8, color: 'bg-rose-500' },
            ].map((ev) => {
              const maxEv = 45;
              const pct = (ev.count / maxEv) * 100;
              return (
                <div key={ev.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{ev.type}</span>
                    <span className="font-mono font-medium">{ev.count}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ev.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ─── Tool Deployment History ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" /> Tool Deployment History
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Last deployed timestamps for forensic tools</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tool Name</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Cases</TableHead>
                  <TableHead className="text-xs font-mono">Last Deployed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forensicStats.recentlyDeployed.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-medium">{t.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell capitalize">{t.category}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} entityType="tool" className="text-[10px]" />
                    </TableCell>
                    <TableCell className="text-xs font-mono hidden md:table-cell">{t._count?.cases ?? 0}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {t.lastDeployedAt ? new Date(t.lastDeployedAt).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {forensicStats.recentlyDeployed.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No deployment history</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Case Workflow Steps ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-sky-500" /> Case Workflow Steps
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Standard forensic investigation workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isLast = idx === workflowSteps.length - 1;
              const statusColor = step.status === 'completed'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                : step.status === 'in_progress'
                ? 'border-sky-500 bg-sky-500/10 text-sky-500'
                : 'border-slate-300 bg-slate-50 text-slate-400';
              const iconBg = step.status === 'completed'
                ? 'bg-emerald-500'
                : step.status === 'in_progress'
                ? 'bg-sky-500'
                : 'bg-slate-300';
              return (
                <div key={step.name} className="flex items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className={`flex flex-col items-center gap-2 flex-1 sm:flex-none`}> 
                    <div className={`flex items-center justify-center rounded-full border-2 size-12 ${statusColor} transition-colors`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <StepIcon className="size-5" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-center">{step.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center max-w-[120px]">{step.description}</p>
                  </div>
                  {!isLast && (
                    <div className={`hidden sm:block h-0.5 w-8 my-8 ${idx < 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
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
                <span className="text-xs text-muted-foreground">Port</span>
                <span className="text-sm font-mono">{detailTool.port ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cases</span>
                <span className="text-sm font-mono">{detailTool._count?.cases ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Deployed</span>
                <span className="text-sm font-mono">{formatDate(detailTool.lastDeployedAt)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <p className="text-sm leading-relaxed">{detailTool.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Configuration</p>
              <JsonViewer
                data={{
                  id: detailTool.id,
                  name: detailTool.name,
                  category: detailTool.category,
                  version: detailTool.version,
                  status: detailTool.status,
                  port: detailTool.port,
                  lastDeployedAt: detailTool.lastDeployedAt,
                  cases: detailTool._count?.cases ?? 0,
                }}
                maxHeight="max-h-64"
                initialDepth={2}
              />
            </div>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}