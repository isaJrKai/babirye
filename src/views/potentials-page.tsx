'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useApi } from '@/hooks/use-api';
import { PotentialDistributionChart } from '@/components/charts/potential-distribution-chart';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar } from '@/components/shared/filter-bar';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Lightbulb,
  Search,
  Sparkles,
  ChevronDown,
  Tag,
  Layers,
  Filter,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Potential {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  requirements: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  impact: 'low' | 'medium' | 'high' | 'critical';
  tags: string;
  scenarioCount: number;
  createdAt: string;
}

interface ExploreResult extends Potential {
  relevanceScore: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  intermediate: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  advanced: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  expert: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const IMPACT_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const BAR_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981',
  '#f43f5e', '#6366f1', '#14b8a6', '#eab308',
];

const chartConfig: ChartConfig = {
  count: { label: 'Potentials' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PotentialsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data, loading, error, refetch } = useApi<{ potentials: Potential[]; total: number }>(
    '/api/potentials', { headers }
  );
  const { data: catData } = useApi<{ categories: CategoryCount[]; total: number }>(
    '/api/potentials?view=categories', { headers }
  );

  const potentials = data?.potentials ?? [];
  const categories = catData?.categories ?? [];

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* Explore mode */
  const [exploreMode, setExploreMode] = useState(false);
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreResults, setExploreResults] = useState<ExploreResult[] | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedExplore = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setExploreResults(null);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setExploreLoading(true);
        try {
          const res = await fetch(`/api/potentials?view=explore&query=${encodeURIComponent(query)}`, {
            headers,
          });
          const json = await res.json();
          setExploreResults(json.results ?? []);
        } catch {
          setExploreResults([]);
        } finally {
          setExploreLoading(false);
        }
      }, 400);
    },
    [headers]
  );

  useEffect(() => {
    if (exploreMode) debouncedExplore(exploreQuery);
  }, [exploreQuery, exploreMode, debouncedExplore]);

  /* Bar chart data */
  const barData = useMemo(
    () =>
      categories.map((c, i) => ({
        name: c.category.replace(/_/g, ' '),
        category: c.category,
        count: c.count,
        fill: BAR_COLORS[i % BAR_COLORS.length],
      })),
    [categories]
  );

  /* Filtered potentials */
  const filtered = useMemo(() => {
    let result = potentials;
    if (categoryFilter) result = result.filter((p) => p.category === categoryFilter);
    if (difficultyFilter) result = result.filter((p) => p.difficulty === difficultyFilter);
    if (impactFilter) result = result.filter((p) => p.impact === impactFilter);
    if (search.trim())
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase().trim())
      );
    return result;
  }, [potentials, categoryFilter, difficultyFilter, impactFilter, search]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter(null);
    setDifficultyFilter(null);
    setImpactFilter(null);
  };

  const hasActiveFilters = categoryFilter || difficultyFilter || impactFilter || search.trim();

  const parseTags = (tags: string) => {
    try {
      return JSON.parse(tags) as string[];
    } catch {
      return tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  };

  const parseRequirements = (req: string) => {
    try {
      return JSON.parse(req) as string[];
    } catch {
      return req.split(',').map((r) => r.trim()).filter(Boolean);
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Lightbulb className="size-12 text-destructive" />
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
          <div className="bg-amber-500/10 flex size-10 items-center justify-center rounded-lg">
            <Lightbulb className="text-amber-500 size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Potential Scenarios</h1>
            <p className="text-muted-foreground text-sm">{potentials.length} scenarios catalogued</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={exploreMode ? 'default' : 'outline'}
          className="gap-1.5"
          onClick={() => {
            setExploreMode(!exploreMode);
            if (exploreMode) { setExploreQuery(''); setExploreResults(null); }
          }}
        >
          <Sparkles className="size-4" /> {exploreMode ? 'Browse Mode' : 'Explore Mode'}
        </Button>
      </div>

      {/* Capability Radar Chart */}
      <PotentialDistributionChart />

      {/* Category distribution chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-44 w-full">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Explore mode input */}
      {exploreMode && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-amber-500 size-5 shrink-0" />
                <div className="relative w-full">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Describe a scenario to explore... (e.g. 'network intrusion detection')"
                    value={exploreQuery}
                    onChange={(e) => setExploreQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {exploreLoading && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Searching...
                </div>
              )}
              {exploreResults && !exploreLoading && (
                <p className="mt-2 text-muted-foreground text-xs">
                  {exploreResults.length} result{exploreResults.length !== 1 ? 's' : ''} found
                  {exploreQuery.trim() ? ` for "${exploreQuery.trim()}"` : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Browse mode filters */}
      {!exploreMode && (
        <>
          <SearchBar placeholder="Search potentials..." onChange={(v) => setSearch(v)} value={search} className="w-full sm:w-80" />

          <FilterBar
            filters={[
              { key: 'category', label: 'Category', options: categories.map((c) => ({ value: c.category, label: c.category.replace(/_/g, ' ') })) },
              { key: 'difficulty', label: 'Difficulty', options: ['beginner', 'intermediate', 'advanced', 'expert'].map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })) },
              { key: 'impact', label: 'Impact', options: ['low', 'medium', 'high', 'critical'].map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) })) },
            ]}
            values={{ category: categoryFilter || '', difficulty: difficultyFilter || '', impact: impactFilter || '' }}
            onChange={(vals) => {
              setCategoryFilter(vals.category && vals.category !== 'all' ? vals.category : null);
              setDifficultyFilter(vals.difficulty && vals.difficulty !== 'all' ? vals.difficulty : null);
              setImpactFilter(vals.impact && vals.impact !== 'all' ? vals.impact : null);
            }}
          />
        </>
      )}

      <Separator />

      {/* Results */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {(exploreMode ? (exploreResults ?? []) : filtered).map((p) => {
              const tags = parseTags(p.tags);
              const requirements = parseRequirements(p.requirements);
              const isExpanded = expandedId === p.id;
              const score = 'relevanceScore' in p ? (p as ExploreResult).relevanceScore : null;

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-tight">{p.name}</CardTitle>
                        {score != null && (
                          <Badge variant="secondary" className="shrink-0 text-[10px] font-mono">
                            {score.toFixed(1)}x
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">
                        {p.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {p.category.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${DIFFICULTY_STYLES[p.difficulty]}`}>
                          {p.difficulty}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${IMPACT_STYLES[p.impact]}`}>
                          {p.impact}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          <Layers className="mr-0.5 size-2.5" /> {p.scenarioCount}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px]"
                            >
                              <Tag className="size-2" /> {tag}
                            </span>
                          ))}
                          {tags.length > 4 && (
                            <span className="text-muted-foreground text-[10px]">+{tags.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator className="my-2" />
                            <p className="text-xs leading-relaxed">{p.description}</p>

                            {requirements.length > 0 && (
                              <div className="mt-2">
                                <p className="mb-1 text-[11px] font-semibold">Requirements:</p>
                                <ul className="ml-4 list-disc text-muted-foreground text-[11px]">
                                  {requirements.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="mt-2 flex items-center gap-2">
                              <ChevronDown className="text-muted-foreground size-3" />
                              <span className="text-muted-foreground text-[11px]">{p.scenarioCount} scenario{p.scenarioCount !== 1 ? 's' : ''} available</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {((exploreMode ? (exploreResults ?? []) : filtered).length === 0) && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Lightbulb className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            {exploreMode ? 'No results found. Try a different query.' : 'No potentials match your filters.'}
          </p>
        </div>
      )}
    </div>
  );
}