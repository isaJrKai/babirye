'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldOff, XCircle, RefreshCw, TestTube2, Ban,
  ChevronLeft, ChevronRight, Eye, Clock, AlertTriangle, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { useApi } from '@/hooks/use-api';
import { WallBlocksChart } from '@/components/charts/wall-blocks-chart';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar } from '@/components/shared/filter-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { JsonViewer } from '@/components/shared/json-viewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Guard {
  id: string; name: string; description: string; category: string;
  isActive: boolean; blockCount: number; actualBlockCount: number;
  lastBlockedAt: string | null; severity: string; createdAt: string;
}

interface WallBlock {
  id: string; action: string; service: string | null; params: string;
  clientIp: string | null; reason: string; createdAt: string;
  guard: { id: string; name: string; category: string; severity: string };
}

interface GuardsResponse { guards: Guard[]; total: number }
interface StatsResponse {
  summary: { totalGuards: number; activeGuards: number; inactiveGuards: number; totalBlocks: number; last24h: number; last7d: number; last30d: number };
  recentBlocks: WallBlock[];
}
interface BlocksResponse { blocks: WallBlock[]; total: number }

const severityDot: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-sky-400',
};
const categoryColors: Record<string, string> = {
  injection: 'text-red-400 bg-red-500/15', exfiltration: 'text-amber-400 bg-amber-500/15',
  privilege: 'text-orange-400 bg-orange-500/15', integrity: 'text-violet-400 bg-violet-500/15',
  crypto: 'text-sky-400 bg-sky-500/15', supply_chain: 'text-teal-400 bg-teal-500/15',
  input_validation: 'text-emerald-400 bg-emerald-500/15',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function WallPage() {
  const [page, setPage] = useState(1);
  const [testOpen, setTestOpen] = useState(false);
  const [testAction, setTestAction] = useState('');
  const [testService, setTestService] = useState('');
  const [testParams, setTestParams] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [guardSearch, setGuardSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const limit = 10;

  const { data: guardsData, loading: guardsLoading, error: guardsError, refetch: refetchGuards } = useApi<GuardsResponse>('/api/wall?view=guards');
  const { data: statsData, loading: statsLoading } = useApi<StatsResponse>('/api/wall?view=stats');
  const { data: blocksData, loading: blocksLoading, refetch: refetchBlocks } = useApi<BlocksResponse>(`/api/wall?view=blocks&page=${page}&limit=${limit}`);

  const toggleGuard = useCallback(async (id: string) => {
    setToggling(id);
    const token = localStorage.getItem('babirye_token');
    await fetch(`/api/wall?id=${id}`, {
      method: 'PUT',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    refetchGuards();
    refetchBlocks();
    setToggling(null);
  }, [refetchGuards, refetchBlocks]);

  const runTest = async () => {
    const token = localStorage.getItem('babirye_token');
    let params: any = {};
    try { params = JSON.parse(testParams); } catch { /* keep empty */ }
    const res = await fetch('/api/wall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ action: testAction, service: testService || undefined, params }),
    });
    const json = await res.json();
    setTestResult(json);
  };

  if (guardsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load wall data: {guardsError}</p>
        <Button variant="outline" size="sm" onClick={refetchGuards} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  const stats = statsData?.summary;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="h-6 w-6 text-emerald-400" /> Self-Attack Wall</h1>
          <p className="text-sm text-slate-400 mt-1">Autonomous self-defense guard system with real-time threat blocking</p>
        </div>
        <Dialog open={testOpen} onOpenChange={setTestOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white"><TestTube2 className="h-4 w-4 mr-2" />Test Guard</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
            <DialogHeader><DialogTitle className="text-white text-sm">Test Against All Active Guards</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label className="text-xs text-slate-300">Action *</Label><Input value={testAction} onChange={(e) => setTestAction(e.target.value)} placeholder="e.g. DROP TABLE users" className="bg-slate-800 border-slate-600 text-white text-sm" /></div>
              <div><Label className="text-xs text-slate-300">Service</Label><Input value={testService} onChange={(e) => setTestService(e.target.value)} placeholder="e.g. database-write" className="bg-slate-800 border-slate-600 text-white text-sm" /></div>
              <div><Label className="text-xs text-slate-300">Params (JSON)</Label><Input value={testParams} onChange={(e) => setTestParams(e.target.value)} className="bg-slate-800 border-slate-600 text-white text-xs font-mono" /></div>
              {testResult && (
                <>
                  <div className={`p-3 rounded-lg text-xs font-mono ${testResult.blocked ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'}`}>
                    <p className="font-semibold mb-1">{testResult.blocked ? '🚫 BLOCKED' : '✅ PASSED'} — {testResult.guardsTriggered ?? 0} guard(s) triggered</p>
                    {testResult.results?.map((r: any, i: number) => (
                      <p key={i} className="mt-0.5 text-slate-400">
                        {r.guardName}: <span className={r.blocked ? 'text-red-400' : 'text-slate-500'}>{r.blocked ? 'BLOCKED' : 'pass'}</span>
                        {r.blocked && <span className="text-slate-500 ml-1">— {r.reason?.slice(0, 80)}</span>}
                      </p>
                    ))}
                  </div>
                  <JsonViewer data={testResult} maxHeight="max-h-40" className="mt-2" />
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={runTest} disabled={!testAction.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">Run Test</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Guards', value: stats ? stats.totalGuards : '—', icon: Shield, color: 'text-emerald-400' },
          { label: 'Active', value: stats ? stats.activeGuards : '—', icon: ShieldCheck, color: 'text-sky-400' },
          { label: 'Total Blocks', value: stats ? stats.totalBlocks.toLocaleString() : '—', icon: ShieldOff, color: 'text-red-400' },
          { label: 'Blocks (24h)', value: stats ? stats.last24h.toLocaleString() : '—', icon: AlertTriangle, color: 'text-amber-400' },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Wall Blocks Chart */}
      <motion.div variants={fadeUp}>
        <WallBlocksChart />
      </motion.div>

      {/* Search + Filter Bar */}
      <motion.div variants={fadeUp} className="space-y-3">
        <SearchBar placeholder="Search guards by name..." onChange={(v) => setGuardSearch(v)} className="max-w-sm" />
        <FilterBar
          filters={[
            { key: 'category', label: 'Category', options: [
              { value: 'injection', label: 'Injection' },
              { value: 'exfiltration', label: 'Exfiltration' },
              { value: 'privilege', label: 'Privilege Escalation' },
              { value: 'integrity', label: 'Integrity' },
              { value: 'crypto', label: 'Crypto' },
              { value: 'supply_chain', label: 'Supply Chain' },
              { value: 'input_validation', label: 'Input Validation' },
            ]},
            { key: 'severity', label: 'Severity', options: [
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]},
          ]}
          values={filterValues}
          onChange={setFilterValues}
        />
      </motion.div>

      {/* Guard Grid */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" /> Guard Deployments
        </h2>
        {(guardsLoading || !guardsData) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {guardsData.guards
              .filter((g) => !guardSearch || g.name.toLowerCase().includes(guardSearch.toLowerCase()))
              .filter((g) => (!filterValues.category || filterValues.category === 'all' || g.category === filterValues.category))
              .filter((g) => (!filterValues.severity || filterValues.severity === 'all' || g.severity === filterValues.severity))
              .map((guard) => (
              <motion.div key={guard.id} variants={fadeUp}>
                <Card className={`bg-slate-900/80 border-slate-700/50 transition-colors ${guard.isActive ? 'hover:border-emerald-500/30' : 'opacity-60'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${guard.isActive ? (severityDot[guard.severity] || 'bg-emerald-500') : 'bg-slate-600'}`} />
                        <StatusBadge status={guard.isActive ? 'active' : 'inactive'} entityType="guard" pulse={guard.isActive} />
                        <p className="text-xs font-semibold text-white truncate max-w-[140px]">{guard.name}</p>
                      </div>
                      <Switch
                        checked={guard.isActive}
                        disabled={toggling === guard.id}
                        onCheckedChange={() => toggleGuard(guard.id)}
                        className="scale-75"
                      />
                    </div>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 mb-2 ${categoryColors[guard.category] || 'bg-slate-700 text-slate-300'}`}>
                      {guard.category.replace(/_/g, ' ')}
                    </Badge>
                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      <span className="text-slate-500 flex items-center gap-1"><Ban className="h-3 w-3" /> {guard.blockCount} blocks</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guard.lastBlockedAt ? new Date(guard.lastBlockedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Blocks Table */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-400" /> Recent Blocks
        </h2>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            {blocksLoading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] text-slate-400 uppercase">Time</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Guard</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Action</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden md:table-cell">Service</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden lg:table-cell">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocksData?.blocks.slice(0, limit).map((block) => (
                      <TableRow key={block.id} className="border-slate-800/50 hover:bg-slate-800/30">
                        <TableCell className="text-xs text-slate-400 py-2.5">{new Date(block.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${severityDot[block.guard.severity] || 'bg-slate-500'}`} />
                            <span className="text-xs text-white">{block.guard.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-mono max-w-[160px] truncate py-2.5">{block.action}</TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-[120px] truncate py-2.5 hidden md:table-cell">{block.service || '—'}</TableCell>
                        <TableCell className="text-[10px] text-slate-500 max-w-[200px] truncate py-2.5 hidden lg:table-cell">{block.reason}</TableCell>
                      </TableRow>
                    ))}
                    {(!blocksData || blocksData.blocks.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-slate-500 py-8">No blocks recorded</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500">{blocksData?.total ?? 0} total blocks</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-slate-300 px-2">{page}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={(blocksData?.blocks.length ?? 0) < limit} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm Dialog for guard toggling */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Toggle Guard Status"
        description="Are you sure you want to toggle this guard? This may affect your security posture."
        confirmText="Toggle"
        variant="destructive"
        onConfirm={async () => {
          if (confirmTarget) {
            setToggling(confirmTarget);
            const token = localStorage.getItem('babirye_token');
            await fetch(`/api/wall?id=${confirmTarget}`, {
              method: 'PUT',
              headers: { Authorization: token ? `Bearer ${token}` : '' },
            });
            refetchGuards();
            refetchBlocks();
            setToggling(null);
          }
          setConfirmOpen(false);
        }}
      />
    </motion.div>
  );
}