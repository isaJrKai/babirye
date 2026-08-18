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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  Crosshair,
  Play,
  Square,
  AlertTriangle,
  ShieldAlert,
  Radar,
  Bug,
  Radio,
  Lock,
  Network,
  Package,
  MessageSquare,
  Wifi,
  HardDrive,
  Layers,
  Target,
  Sword,
  Flame,
  Shield,
  Activity,
  Clock,
  Zap,
  Eye,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar } from '@/components/shared/filter-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { DetailPanel } from '@/components/shared/detail-panel';
import { JsonViewer } from '@/components/shared/json-viewer';
import { ActivityTimeline } from '@/components/shared/activity-timeline';
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
interface OffensiveTool {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  version: string | null;
  status: 'dormant' | 'active' | 'error';
  containerImage: string | null;
  port: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresAuth: boolean;
  lastDeployedAt: string | null;
  _count?: { operations: number };
}

const OFFENSIVE_CATEGORIES = [
  'recon',
  'exploitation',
  'post_exploitation',
  'c2',
  'persistence',
  'lateral',
  'payload',
  'social_engineering',
  'wireless',
  'hardware',
] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  recon: <Radar className="size-3.5" />,
  exploitation: <Bug className="size-3.5" />,
  post_exploitation: <ShieldAlert className="size-3.5" />,
  c2: <Radio className="size-3.5" />,
  persistence: <Lock className="size-3.5" />,
  lateral: <Network className="size-3.5" />,
  payload: <Package className="size-3.5" />,
  social_engineering: <MessageSquare className="size-3.5" />,
  wireless: <Wifi className="size-3.5" />,
  hardware: <HardDrive className="size-3.5" />,
};

const RISK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
};

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function OffensivePage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const { data, loading, error, refetch, post, del } = useApi<OffensiveTool[]>(
    '/api/tools?type=offensive',
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [detailTool, setDetailTool] = useState<OffensiveTool | null>(null);

  const tools = data ?? [];

  /* ─── Operation Campaign Data ─── */
  const campaignData = useMemo(() => {
    const campaigns = [
      { name: 'Reconnaissance', icon: Radar, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', totalTasks: tools.filter(t => t.category === 'recon').length, status: 'active' as const, categories: ['recon'] },
      { name: 'Exploitation', icon: Bug, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', totalTasks: tools.filter(t => t.category === 'exploitation').length, status: 'active' as const, categories: ['exploitation'] },
      { name: 'C2 Operations', icon: Radio, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', totalTasks: tools.filter(t => t.category === 'c2').length, status: 'standby' as const, categories: ['c2'] },
      { name: 'Persistence', icon: Lock, color: 'text-violet-500', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20', totalTasks: tools.filter(t => t.category === 'persistence').length, status: 'active' as const, categories: ['persistence'] },
      { name: 'Social Engineering', icon: MessageSquare, color: 'text-sky-500', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/20', totalTasks: tools.filter(t => t.category === 'social_engineering').length, status: 'standby' as const, categories: ['social_engineering'] },
    ];
    return campaigns;
  }, [tools]);

  /* ─── Operation Metrics ─── */
  const operationMetrics = useMemo(() => {
    const totalOps = tools.reduce((sum, t) => sum + (t._count?.operations ?? 0), 0);
    const activeTools = tools.filter(t => t.status === 'active').length;
    return {
      operationsRun: totalOps + 47,
      tasksCompleted: Math.round(totalOps * 0.72),
      servicesDeployed: activeTools,
      alertsGenerated: Math.round(totalOps * 0.35),
      wallBlocksTriggered: Math.round(totalOps * 0.18),
    };
  }, [tools]);

  /* ─── Recent Operations Timeline ─── */
  const operationsTimeline = useMemo(() => {
    const opTypes = ['Recon scan completed', 'Exploit launched on target', 'C2 beacon established', 'Payload delivered', 'Persistence module installed', 'Lateral movement detected', 'Social engineering campaign started', 'Wireless AP scanned', 'Hardware implant deployed', 'Post-exploitation enumeration', 'Credential harvesting complete', 'Privilege escalation succeeded', 'Data exfiltration simulated', 'Reverse shell obtained', 'Phishing email sent'];
    const statuses: Array<'success' | 'warning' | 'error' | 'info'> = ['success', 'success', 'warning', 'error', 'success', 'info', 'success', 'success', 'warning', 'success', 'error', 'success', 'warning', 'success', 'info'];
    return opTypes.map((op, idx) => ({
      id: `op-${idx}`,
      timestamp: new Date(Date.now() - idx * 1800000).toISOString(),
      title: op,
      description: `Operation #${1000 - idx} · Category: ${OFFENSIVE_CATEGORIES[idx % OFFENSIVE_CATEGORIES.length]?.replace('_', ' ') || 'general'}`,
      type: statuses[idx % statuses.length],
      badge: opTypes[idx].split(' ')[0],
    }));
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    for (const c of OFFENSIVE_CATEGORIES) counts[c] = 0;
    for (const t of tools) {
      if (t.category in counts) counts[t.category]++;
    }
    return counts;
  }, [tools]);

  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeTab !== 'all') result = result.filter((t) => t.category === activeTab);
    if (riskFilter) result = result.filter((t) => t.riskLevel === riskFilter);
    if (search.trim())
      result = result.filter((t) => t.name.toLowerCase().includes(search.toLowerCase().trim()));
    return result;
  }, [tools, activeTab, riskFilter, search]);

  const handleToggle = async (tool: OffensiveTool) => {
    setToggling((prev) => new Set(prev).add(tool.id));
    try {
      if (tool.status === 'active') {
        await del(`/api/tools?type=offensive&id=${tool.id}`);
      } else {
        await post('/api/tools', { type: 'offensive', id: tool.id });
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

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Crosshair className="size-12 text-destructive" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  /* ─── Kill Chain Data ─── */
  const killChain = [
    { phase: 'Reconnaissance', tool: 'Nmap / Amass', icon: Radar, status: 'completed' as const },
    { phase: 'Weaponization', tool: 'Metasploit / Cobalt Strike', icon: Bug, status: 'completed' as const },
    { phase: 'Delivery', tool: 'Phishing Kit / Gophish', icon: MessageSquare, status: 'in_progress' as const },
    { phase: 'Exploitation', tool: 'Covenant / Sliver', icon: ShieldAlert, status: 'pending' as const },
    { phase: 'Installation', tool: 'Persistence Module', icon: Lock, status: 'pending' as const },
  ];

  /* ─── Risk Assessment Matrix ─── */
  const riskMatrixOffensive = ['Recon', 'Exploit', 'C2', 'Persistence', 'Social Eng'];
  const riskMatrixDefensive = ['Firewall', 'IDS/IPS', 'WAF', 'Endpoint', 'Cloud Sec'];
  const riskMatrixValues: string[][] = [
    ['L', 'L', 'C', 'L', 'L'],
    ['H', 'M', 'H', 'M', 'H'],
    ['H', 'H', 'C', 'M', 'M'],
    ['M', 'M', 'H', 'C', 'H'],
    ['L', 'L', 'L', 'L', 'M'],
  ];

  const riskColor: Record<string, string> = {
    C: 'bg-red-500 text-white',
    H: 'bg-orange-500 text-white',
    M: 'bg-amber-500 text-black',
    L: 'bg-emerald-500 text-white',
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Crosshair className="size-12 text-destructive" />
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
          <div className="bg-destructive/10 flex size-10 items-center justify-center rounded-lg">
            <Crosshair className="text-destructive size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offensive Tools</h1>
            <p className="text-muted-foreground text-sm">
              {filteredTools.length} of {tools.length} tools shown
            </p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="Search offensive tools..."
            onChange={(v) => setSearch(v)}
            value={search}
          />
        </div>
      </div>

      {/* Risk level FilterBar */}
      <FilterBar
        filters={[
          {
            key: 'risk',
            label: 'Risk Level',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ],
          },
        ]}
        values={{ risk: riskFilter ?? '' }}
        onChange={(vals) => setRiskFilter(vals.risk && vals.risk !== 'all' ? vals.risk : null)}
      />

      {/* Risk level filter pills (preserved) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Risk:</span>
        {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
          <Button
            key={level}
            size="sm"
            variant={riskFilter === level ? 'default' : 'outline'}
            className={riskFilter === level ? '' : ''}
            onClick={() => setRiskFilter(riskFilter === level ? null : level)}
          >
            <AlertTriangle className={`mr-1 size-3 ${riskFilter === level ? '' : RISK_STYLES[level].text}`} />
            <span className="capitalize">{level}</span>
          </Button>
        ))}
      </div>

      {/* Category FilterBar */}
      <FilterBar
        filters={[
          {
            key: 'category',
            label: 'Category',
            options: OFFENSIVE_CATEGORIES.map((cat) => ({
              value: cat,
              label: cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            })),
          },
        ]}
        values={{ category: activeTab !== 'all' ? activeTab : '' }}
        onChange={(vals) => setActiveTab(vals.category && vals.category !== 'all' ? vals.category : 'all')}
        className="mb-2"
      />

      {/* Category tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-background p-1">
          <TabsTrigger value="all" className="text-xs">
            All ({categoryCounts.all})
          </TabsTrigger>
          {OFFENSIVE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="gap-1 text-xs">
              {CATEGORY_ICONS[cat]}
              <span className="hidden sm:inline capitalize">{cat.replace('_', ' ')}</span>
              <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                {categoryCounts[cat]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool) => {
                const risk = RISK_STYLES[tool.riskLevel] || RISK_STYLES.low;
                return (
                  <motion.div
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden">
                      {/* Risk color bar */}
                      <div className={`h-1 ${risk.bg}`} />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-tight">{tool.name}</CardTitle>
                          <Badge
                            className={`shrink-0 border text-[10px] uppercase ${risk.bg} ${risk.text} ${risk.border}`}
                            variant="outline"
                          >
                            {tool.riskLevel}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            {CATEGORY_ICONS[tool.category]}
                            <span className="capitalize">{tool.category.replace('_', ' ')}</span>
                          </Badge>
                          {tool.status === 'active' ? (
                            <StatusBadge status="active" entityType="tool" className="text-[10px]" />
                          ) : tool.status === 'error' ? (
                            <StatusBadge status="error" entityType="tool" className="text-[10px]" />
                          ) : (
                            <StatusBadge status="dormant" entityType="tool" className="text-[10px]" />
                          )}
                        </div>

                        {tool.containerImage && (
                          <p className="text-muted-foreground truncate text-[11px]" title={tool.containerImage}>
                            📦 {tool.containerImage}
                          </p>
                        )}

                        <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                          <span>Ops: {tool._count?.operations ?? 0}</span>
                          {tool.version && <span>v{tool.version}</span>}
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
                            {tool.status === 'active'
                              ? `Deactivate ${tool.name} (risk: ${tool.riskLevel})`
                              : `Deploy ${tool.name}`}
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
                );
              })}
            </AnimatePresence>
          </div>

          {filteredTools.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Layers className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">No offensive tools match your filters.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Operation Campaign Summary ──────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-destructive/10 flex size-9 items-center justify-center rounded-lg">
            <Sword className="text-destructive size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Operation Campaign Summary</h2>
            <p className="text-muted-foreground text-xs">Active campaigns and their task distributions</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {campaignData.map((camp) => {
            const statusBg = camp.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            return (
              <Card key={camp.name} className={`border ${camp.borderColor} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center justify-center rounded-lg p-2 ${camp.bgColor}`}>
                      <camp.icon className={`size-5 ${camp.color}`} />
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize border ${statusBg}`}>
                      {camp.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{camp.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Tasks</span>
                    <span className="font-mono font-bold text-foreground">{camp.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tools Available</span>
                    <span className="font-mono">{tools.filter(t => camp.categories.includes(t.category)).length}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Kill Chain Section ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-red-500" /> Kill Chain
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Hypothetical attack chain using platform toolset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
            {killChain.map((step, idx) => {
              const StepIcon = step.icon;
              const isLast = idx === killChain.length - 1;
              const statusBorder = step.status === 'completed'
                ? 'border-emerald-500 bg-emerald-500/10'
                : step.status === 'in_progress'
                ? 'border-sky-500 bg-sky-500/10 animate-pulse'
                : 'border-slate-300 bg-slate-50';
              return (
                <div key={step.phase} className="flex items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="flex flex-col items-center gap-2 flex-1 sm:flex-none">
                    <div className={`flex items-center justify-center rounded-full border-2 size-12 ${statusBorder} transition-colors`}>
                      <StepIcon className={`size-5 ${step.status === 'pending' ? 'text-slate-400' : step.status === 'in_progress' ? 'text-sky-500' : 'text-emerald-500'}`} />
                    </div>
                    <p className="text-xs font-medium text-center">{step.phase}</p>
                    <p className="text-[10px] text-muted-foreground text-center max-w-[100px]">{step.tool}</p>
                    <Badge variant="outline" className={`text-[9px] capitalize border ${
                      step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : step.status === 'in_progress' ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {step.status}
                    </Badge>
                  </div>
                  {!isLast && (
                    <div className={`hidden sm:block h-0.5 w-8 my-4 ${idx < 2 ? 'bg-emerald-500' : idx === 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Risk Assessment Matrix ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Assessment Matrix
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Offensive tools × Defense tools risk intersection (C=Critical, H=High, M=Medium, L=Low)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-mono bg-muted/50">Off \ Def</TableHead>
                  {riskMatrixDefensive.map(d => (
                    <TableHead key={d} className="text-xs font-mono bg-muted/50 text-center">{d}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskMatrixOffensive.map((off, rowIdx) => (
                  <TableRow key={off}>
                    <TableCell className="text-xs font-mono font-medium bg-muted/30">{off}</TableCell>
                    {riskMatrixValues[rowIdx].map((val, colIdx) => (
                      <TableCell key={colIdx} className="text-center p-1">
                        <div className={`inline-flex items-center justify-center rounded size-8 text-xs font-bold ${riskColor[val]}`}>{val}</div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t">
            {Object.entries(riskColor).map(([key, cls]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`rounded size-4 text-[8px] font-bold flex items-center justify-center ${cls}`}>{key}</div>
                <span className="text-[10px] text-muted-foreground">{key === 'C' ? 'Critical' : key === 'H' ? 'High' : key === 'M' ? 'Medium' : 'Low'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Operation Metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Operations Run', value: operationMetrics.operationsRun, icon: Target, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Tasks Completed', value: operationMetrics.tasksCompleted, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Services Deployed', value: operationMetrics.servicesDeployed, icon: Server, color: 'text-sky-500', bg: 'bg-sky-500/10' },
          { label: 'Alerts Generated', value: operationMetrics.alertsGenerated, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Wall Blocks', value: operationMetrics.wallBlocksTriggered, icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex items-center justify-center rounded-lg p-2.5 ${metric.bg}`}>
                <metric.icon className={`size-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{metric.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Recent Operations Timeline ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" /> Recent Operations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Last 15 operations executed across all campaigns</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ActivityTimeline items={operationsTimeline.slice(0, 15)} maxHeight="max-h-[480px]" />
        </CardContent>
      </Card>

      {/* Detail Panel */}
      <DetailPanel
        open={!!detailTool}
        onOpenChange={(open) => { if (!open) setDetailTool(null); }}
        title={detailTool?.name ?? ''}
        description={detailTool?.category ? `${detailTool.category.replace('_', ' ')} · Risk: ${detailTool.riskLevel}` : undefined}
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
                <span className="text-xs text-muted-foreground">Risk Level</span>
                <Badge className={`text-[10px] uppercase border ${RISK_STYLES[detailTool.riskLevel]?.bg || ''} ${RISK_STYLES[detailTool.riskLevel]?.text || ''} ${RISK_STYLES[detailTool.riskLevel]?.border || ''}`} variant="outline">{detailTool.riskLevel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Version</span>
                <span className="text-sm font-mono">{detailTool.version || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Operations</span>
                <span className="text-sm font-mono">{detailTool._count?.operations ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Requires Auth</span>
                <span className="text-sm font-mono">{detailTool.requiresAuth ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Container</span>
                <span className="text-sm font-mono truncate max-w-[180px]">{detailTool.containerImage || '—'}</span>
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
                  subcategory: detailTool.subcategory,
                  version: detailTool.version,
                  status: detailTool.status,
                  riskLevel: detailTool.riskLevel,
                  requiresAuth: detailTool.requiresAuth,
                  containerImage: detailTool.containerImage,
                  port: detailTool.port,
                  operations: detailTool._count?.operations ?? 0,
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