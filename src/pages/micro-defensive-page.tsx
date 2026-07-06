'use client';

import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Microchip,
  ToggleLeft,
  ToggleRight,
  Shield,
} from 'lucide-react';
import { SearchBar } from '@/components/shared/search-bar';
import { StatusBadge } from '@/components/shared/status-badge';
import { FilterBar } from '@/components/shared/filter-bar';
import { CountBadge } from '@/components/shared/count-badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface MicroDefensiveTool {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'dormant' | 'active' | 'error';
  isActive: boolean;
  blockCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}

const MICRO_CATEGORIES = [
  'input_validation',
  'output_encoding',
  'sanitization',
  'integrity',
  'rate_limiting',
  'cors',
  'header_security',
  'cookie_security',
] as const;

const PIE_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981',
  '#f43f5e', '#6366f1', '#14b8a6', '#eab308',
];

const chartConfig: ChartConfig = {
  count: { label: 'Tools' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MicroDefensivePage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const { data, loading, error, refetch, post, del } = useApi<MicroDefensiveTool[]>(
    '/api/tools?type=micro_defensive',
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const tools = data ?? [];

  /* Pie chart data */
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of MICRO_CATEGORIES) counts[cat] = 0;
    for (const t of tools) {
      if (t.category in counts) counts[t.category]++;
    }
    return MICRO_CATEGORIES
      .filter((c) => counts[c] > 0)
      .map((c) => ({
        name: c.replace(/_/g, ' '),
        category: c,
        count: counts[c],
        fill: PIE_COLORS[MICRO_CATEGORIES.indexOf(c) % PIE_COLORS.length],
      }));
  }, [tools]);

  /* Category counts for tabs */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    for (const c of MICRO_CATEGORIES) counts[c] = 0;
    for (const t of tools) {
      if (t.category in counts) counts[t.category]++;
    }
    return counts;
  }, [tools]);

  /* Filtered tools */
  const filteredTools = useMemo(() => {
    let result = tools;
    if (activeTab !== 'all') result = result.filter((t) => t.category === activeTab);
    if (search.trim())
      result = result.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase().trim())
      );
    return result;
  }, [tools, activeTab, search]);

  const handleToggle = async (tool: MicroDefensiveTool) => {
    setToggling((prev) => new Set(prev).add(tool.id));
    try {
      if (tool.status === 'active') {
        await del(`/api/tools?type=micro_defensive&id=${tool.id}`);
      } else {
        await post('/api/tools', { type: 'micro_defensive', id: tool.id });
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

  const handleBulkToggle = async (activate: boolean) => {
    const targets = tools.filter((t) => selected.has(t.id));
    if (targets.length === 0) return;
    setToggling(new Set(targets.map((t) => t.id)));
    try {
      await Promise.all(
        targets.map(async (t) => {
          if (activate && t.status !== 'active') {
            await post('/api/tools', { type: 'micro_defensive', id: t.id });
          } else if (!activate && t.status === 'active') {
            await del(`/api/tools?type=micro_defensive&id=${t.id}`);
          }
        })
      );
      refetch();
      setSelected(new Set());
    } catch {
      /* handled by hook */
    } finally {
      setToggling(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredTools.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredTools.map((t) => t.id)));
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Microchip className="size-12 text-destructive" />
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
          <div className="bg-cyan-500/10 flex size-10 items-center justify-center rounded-lg">
            <Microchip className="text-cyan-500 size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Micro Defensive Tools</h1>
            <p className="text-muted-foreground text-sm">
              {tools.length} micro-defenses &middot; {tools.filter((t) => t.status === 'active').length} active
            </p>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <SearchBar
            placeholder="Search micro-defensive tools..."
            onChange={(v) => setSearch(v)}
            value={search}
          />
        </div>
      </div>

      {/* Top section: chart + bulk actions */}
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Table area */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Tool Registry</CardTitle>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <>
                    <Button size="sm" className="gap-1 text-xs" onClick={() => handleBulkToggle(true)}>
                      <ToggleRight className="size-3.5" /> Activate ({selected.size})
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => handleBulkToggle(false)}>
                      <ToggleLeft className="size-3.5" /> Deactivate ({selected.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Category FilterBar */}
            <FilterBar
              filters={[
                {
                  key: 'category',
                  label: 'Category',
                  options: MICRO_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: `${cat.replace(/_/g, ' ')} (${categoryCounts[cat]})`,
                  })),
                },
              ]}
              values={{ category: activeTab !== 'all' ? activeTab : '' }}
              onChange={(vals) => setActiveTab(vals.category && vals.category !== 'all' ? vals.category : 'all')}
              className="mb-2"
            />

            {/* Category tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-4 pt-2">
                <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
                  <TabsTrigger value="all" className="rounded-b-none text-xs">All <CountBadge count={categoryCounts.all} variant="secondary" /></TabsTrigger>
                  {MICRO_CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="rounded-b-none capitalize text-xs">
                      {cat.replace(/_/g, ' ')} <CountBadge count={categoryCounts[cat]} variant="secondary" />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <ScrollArea className="max-h-[480px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selected.size === filteredTools.length && filteredTools.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Blocks</TableHead>
                        <TableHead className="hidden md:table-cell">Last Triggered</TableHead>
                        <TableHead className="w-24 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.map((tool) => (
                        <TableRow key={tool.id} className={selected.has(tool.id) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(tool.id)}
                              onCheckedChange={() => toggleSelect(tool.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{tool.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {tool.category.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={tool.status} entityType="tool" className="text-[10px]" />
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {tool.blockCount.toLocaleString()}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-[11px]">
                            {formatDate(tool.lastTriggeredAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={tool.status === 'active' ? 'ghost' : 'ghost'}
                              className="h-7 w-7 p-0"
                              disabled={toggling.has(tool.id)}
                              onClick={() => handleToggle(tool)}
                            >
                              {toggling.has(tool.id) ? (
                                <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : tool.status === 'active' ? (
                                <ToggleRight className="text-emerald-500 size-4" />
                              ) : (
                                <ToggleLeft className="text-muted-foreground size-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {filteredTools.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Shield className="text-muted-foreground size-8" />
                    <p className="text-muted-foreground text-sm">No tools match your filters.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                  No data
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {pieData.map((d) => (
                  <div key={d.category} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground truncate capitalize">{d.name}</span>
                    <span className="ml-auto font-mono font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}