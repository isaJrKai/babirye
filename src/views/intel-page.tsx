"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radio, Wifi, AlertTriangle, Rss, Loader2, Eye, EyeOff, RefreshCw, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/shared/search-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailPanel } from "@/components/shared/detail-panel";
import { FilterBar } from "@/components/shared/filter-bar";
import { JsonViewer } from "@/components/shared/json-viewer";

interface FeedItem {
  id: string; feedId: string; title: string; description: string;
  severity: string; confidence: number; tags: string;
  isProcessed: boolean; createdAt: string;
}

interface Feed {
  id: string; name: string; source: string; feedType: string; url: string | null;
  frequency: string; isActive: boolean; lastFetchedAt: string | null;
  lastError: string | null; itemCount: number; createdAt: string;
  _count?: { items: number };
}

const SOURCE_COLORS: Record<string, string> = {
  omniroute: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  iron_sight: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  open_threat: "bg-red-500/10 text-red-400 border-red-500/20",
  mini_shodan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const FEED_TYPE_COLORS: Record<string, string> = {
  ioc: "bg-red-500/10 text-red-400 border-red-500/20",
  vulnerability: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  malware: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  threat_actor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  dark_web: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  geo_political: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  info: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function IntelPage() {
  const { toast } = useToast();
  const { data: feeds, loading: feedsLoading, refetch: refetchFeeds } = useApi<Feed[]>("/api/intel?view=feeds");

  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const { data: feedItems, loading: itemsLoading, refetch: refetchItems } = useApi<FeedItem[]>(
    selectedFeed ? `/api/intel?view=items&feedId=${selectedFeed}` : null,
  );

  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailFeed, setDetailFeed] = useState<Feed | null>(null);

  const filteredFeeds = useMemo(() => {
    if (!feeds) return [];
    let result = feeds;
    if (filterSource !== "all") result = result.filter((f) => f.source === filterSource);
    if (filterType !== "all") result = result.filter((f) => f.feedType === filterType);
    return result;
  }, [feeds, filterSource, filterType]);

  const filteredItems = useMemo(() => {
    if (!feedItems) return [];
    if (filterSeverity !== "all") return feedItems.filter((i) => i.severity === filterSeverity);
    return feedItems;
  }, [feedItems, filterSeverity]);

  const handleToggleFeed = async (feed: Feed) => {
    await fetch("/api/intel", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ id: feed.id, isActive: !feed.isActive }),
    });
    refetchFeeds();
    toast({ title: feed.isActive ? "Feed deactivated" : "Feed activated" });
  };

  const handleFetch = async (feedId: string) => {
    await fetch("/api/intel", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ id: feedId, action: "fetch" }),
    });
    refetchFeeds();
    toast({ title: "Feed sync triggered" });
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "Never";
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const feedHealth = (feed: Feed) => {
    if (!feed.lastFetchedAt) return { status: "never", label: "Never fetched", color: "text-muted-foreground" };
    const diff = Date.now() - new Date(feed.lastFetchedAt).getTime();
    const freqMs: Record<string, number> = { real_time: 300000, hourly: 3600000, daily: 86400000, weekly: 604800000 };
    const threshold = (freqMs[feed.frequency] || 3600000) * 2;
    if (feed.lastError) return { status: "error", label: feed.lastError, color: "text-red-400" };
    if (diff > threshold) return { status: "stale", label: "Stale data", color: "text-amber-400" };
    return { status: "healthy", label: "Healthy", color: "text-emerald-400" };
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Intelligence Feeds</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Monitor and manage threat intelligence data streams</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar
            placeholder="Search feeds..."
            onChange={(v) => setSearchQuery(v)}
            className="w-48"
          />
          <FilterBar
            filters={[
              {
                key: 'source',
                label: 'Source',
                options: [
                  { value: 'omniroute', label: 'Omniroute' },
                  { value: 'iron_sight', label: 'Iron Sight' },
                  { value: 'open_threat', label: 'Open Threat' },
                  { value: 'mini_shodan', label: 'Mini Shodan' },
                  { value: 'custom', label: 'Custom' },
                ],
              },
              {
                key: 'feedType',
                label: 'Feed Type',
                options: [
                  { value: 'ioc', label: 'IOC' },
                  { value: 'vulnerability', label: 'Vulnerability' },
                  { value: 'malware', label: 'Malware' },
                  { value: 'threat_actor', label: 'Threat Actor' },
                  { value: 'dark_web', label: 'Dark Web' },
                  { value: 'geo_political', label: 'Geopolitical' },
                ],
              },
            ]}
            values={{ source: filterSource, feedType: filterType }}
            onChange={(vals) => {
              setFilterSource(vals.source);
              setFilterType(vals.feedType);
            }}
            defaultCollapsed={false}
          />
        </div>
      </motion.div>

      {/* Feed Cards */}
      {!selectedFeed && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {feedsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)
          ) : filteredFeeds.map((feed) => {
            const health = feedHealth(feed);
            return (
              <Card key={feed.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setSelectedFeed(feed.id); setFilterSeverity("all"); setDetailFeed(feed); }}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{feed.name}</CardTitle>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-mono ${SOURCE_COLORS[feed.source] || ""}`}>{feed.source.replace("_", " ")}</Badge>
                        <Badge variant="outline" className={`text-[10px] font-mono ${FEED_TYPE_COLORS[feed.feedType] || ""}`}>{feed.feedType.replace("_", " ")}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={feed.isActive ? 'active' : 'inactive'} entityType="sensor" className="text-[10px]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/20">
                      <p className="text-lg font-bold font-mono text-foreground">{feed._count?.items ?? feed.itemCount}</p>
                      <p className="text-[10px] text-muted-foreground">Items</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20">
                      <p className="text-xs font-mono text-foreground">{feed.frequency}</p>
                      <p className="text-[10px] text-muted-foreground">Frequency</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20">
                      <p className={`text-[10px] font-mono ${health.color}`}>{fmtDate(feed.lastFetchedAt)}</p>
                      <p className="text-[10px] text-muted-foreground">Last Fetch</p>
                    </div>
                  </div>
                  {health.status === "error" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/5 p-2 rounded">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{health.label}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); handleToggleFeed(feed); }}>
                      {feed.isActive ? <><EyeOff className="h-3 w-3 mr-1" />Deactivate</> : <><Eye className="h-3 w-3 mr-1" />Activate</>}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); handleFetch(feed.id); }}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!feedsLoading && filteredFeeds.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No feeds match the current filters.</div>
          )}
        </motion.div>
      )}

      {/* Feed Items Table */}
      {selectedFeed && (
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedFeed(null)}>
              ← Back to feeds
            </Button>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                {itemsLoading ? (
                  <div className="p-4 space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                ) : !filteredItems.length ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">No items in this feed.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-xs">Severity</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Confidence</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Tags</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs font-mono hidden xl:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((i) => {
                        let tags: string[] = [];
                        try { tags = JSON.parse(i.tags); } catch { /* ignore */ }
                        return (
                          <TableRow key={i.id} className="border-border/30">
                            <TableCell className="text-xs font-medium py-2.5 max-w-[200px] truncate">{i.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-2.5 max-w-[250px] truncate">{i.description}</TableCell>
                            <TableCell className="py-2.5">
                              <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[i.severity] || ""}`}>{i.severity}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-2.5">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Progress value={i.confidence * 100} className="h-1.5 flex-1" />
                                <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{Math.round(i.confidence * 100)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell py-2.5">
                              <div className="flex gap-1 flex-wrap max-w-[200px]">
                                {tags.slice(0, 3).map((t) => (
                                  <Badge key={t} variant="outline" className="text-[9px] bg-muted/30">{t}</Badge>
                                ))}
                                {tags.length > 3 && <Badge variant="outline" className="text-[9px] bg-muted/30">+{tags.length - 3}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              {i.isProcessed ? (
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Processed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground font-mono hidden xl:table-cell py-2.5">
                              {new Date(i.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Feed Detail Panel */}
      <DetailPanel
        open={!!detailFeed && !selectedFeed}
        onOpenChange={(open) => { if (!open) setDetailFeed(null); }}
        title={detailFeed?.name ?? ''}
        description={detailFeed ? `${detailFeed.source.replace('_', ' ')} · ${detailFeed.feedType.replace('_', ' ')}` : undefined}
        actions={detailFeed ? [
          {
            label: detailFeed.isActive ? 'Deactivate' : 'Activate',
            variant: 'outline',
            onClick: () => { if (detailFeed) handleToggleFeed(detailFeed); },
          },
          { label: 'Close', variant: 'ghost', onClick: () => setDetailFeed(null) },
        ] : []}
      >
        {detailFeed && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={detailFeed.isActive ? 'active' : 'inactive'} entityType="sensor" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Frequency</span>
                <span className="text-sm font-mono">{detailFeed.frequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Items</span>
                <span className="text-sm font-mono">{detailFeed._count?.items ?? detailFeed.itemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Fetched</span>
                <span className="text-sm font-mono">{fmtDate(detailFeed.lastFetchedAt)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Configuration</p>
              <JsonViewer
                data={{
                  id: detailFeed.id,
                  name: detailFeed.name,
                  source: detailFeed.source,
                  feedType: detailFeed.feedType,
                  url: detailFeed.url,
                  frequency: detailFeed.frequency,
                  isActive: detailFeed.isActive,
                  itemCount: detailFeed._count?.items ?? detailFeed.itemCount,
                  lastFetchedAt: detailFeed.lastFetchedAt,
                  lastError: detailFeed.lastError,
                }}
                maxHeight="max-h-64"
                initialDepth={2}
              />
            </div>
          </div>
        )}
      </DetailPanel>
    </motion.div>
  );
}