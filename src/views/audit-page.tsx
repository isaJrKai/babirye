'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, XCircle, Download, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/use-api';
import { ActivityTimeline } from '@/components/shared/activity-timeline';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar } from '@/components/shared/filter-bar';
import { JsonViewer } from '@/components/shared/json-viewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuditLogEntry {
  id: string; userId: string | null; action: string; resource: string;
  details: string; ipAddress: string | null; userAgent: string | null;
  statusCode: number | null; durationMs: number | null; createdAt: string;
  user: { id: string; email: string; name: string | null; role: string } | null;
}

interface AuditResponse {
  data: AuditLogEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const actionColors: Record<string, string> = {
  login: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
  agent_create: 'bg-sky-500/20 text-sky-400',
  agent_update: 'bg-sky-500/20 text-sky-400',
  agent_disable: 'bg-orange-500/20 text-orange-400',
  task_create: 'bg-violet-500/20 text-violet-400',
  task_update: 'bg-violet-500/20 text-violet-400',
  task_cancel: 'bg-orange-500/20 text-orange-400',
  wall_block: 'bg-red-500/20 text-red-400',
  wall_test_all: 'bg-amber-500/20 text-amber-400',
  toggle_wall_guard: 'bg-amber-500/20 text-amber-400',
  council_decision: 'bg-emerald-500/20 text-emerald-400',
  escalate_alert: 'bg-red-500/20 text-red-400',
  update_alert: 'bg-amber-500/20 text-amber-400',
};

function getActionColor(action: string): string {
  if (actionColors[action]) return actionColors[action];
  if (action.includes('create')) return 'bg-sky-500/20 text-sky-400';
  if (action.includes('delete') || action.includes('disable') || action.includes('cancel')) return 'bg-orange-500/20 text-orange-400';
  if (action.includes('update') || action.includes('toggle')) return 'bg-amber-500/20 text-amber-400';
  if (action.includes('error') || action.includes('fail')) return 'bg-red-500/20 text-red-400';
  if (action.includes('login') || action.includes('auth')) return 'bg-emerald-500/20 text-emerald-400';
  return 'bg-slate-600/30 text-slate-400';
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 50;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (actionFilter !== 'all') params.set('action', actionFilter);
    if (resourceFilter !== 'all') params.set('resource', resourceFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    return `/api/audit?${params.toString()}`;
  }, [page, actionFilter, resourceFilter, fromDate, toDate]);

  const { data, loading, error, refetch } = useApi<AuditResponse>(buildUrl());

  const exportCsv = () => {
    if (!data?.data) return;
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'IP', 'Status', 'Duration (ms)', 'Details'];
    const rows = data.data.map((log) => [
      log.createdAt, log.user?.name || log.user?.email || 'System', log.action,
      log.resource, log.ipAddress || '', log.statusCode ?? '', log.durationMs ?? '',
      (log.details || '').replace(/"/g, '""').slice(0, 500),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `babirye-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load audit logs: {error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="h-6 w-6 text-emerald-400" /> Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.pagination.total ?? '—'} immutable system records</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data?.data?.length} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={fadeUp} className="space-y-3">
        <SearchBar placeholder="Search audit logs..." onChange={(v) => setAuditSearch(v)} className="max-w-sm" />
        <div className="flex items-center gap-3 flex-wrap">
          <FilterBar
            filters={[
              { key: 'action', label: 'Action', options: Object.keys(actionColors).map((a) => ({ value: a, label: a.replace(/_/g, ' ') })) },
              { key: 'resource', label: 'Resource', options: ['agent', 'task', 'wall_guard', 'security_alert', 'council_decision', 'user', 'system'].map((r) => ({ value: r, label: r.replace(/_/g, ' ') })) },
            ]}
            values={{ action: actionFilter, resource: resourceFilter }}
            onChange={(vals) => {
              setActionFilter(vals.action || 'all');
              setResourceFilter(vals.resource || 'all');
              setPage(1);
            }}
            className="flex-1"
          />
          <Input
            type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-[140px] bg-slate-800 border-slate-600 text-xs text-white"
          />
          <Input
            type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-[140px] bg-slate-800 border-slate-600 text-xs text-white"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] text-slate-400 uppercase">Timestamp</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden sm:table-cell">User</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Action</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden md:table-cell">Resource</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden lg:table-cell">IP</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden xl:table-cell">Status</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden xl:table-cell">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data
                      .filter((log) => !auditSearch || log.action.includes(auditSearch) || log.resource.includes(auditSearch) || log.user?.name?.includes(auditSearch))
                      .map((log) => {
                      const isExpanded = expandedId === log.id;
                      let detailJson: unknown = null;
                      try { detailJson = JSON.parse(log.details); } catch { /* keep null */ }
                      return (
                        <>
                        <TableRow key={log.id} className="border-slate-800/50 hover:bg-slate-800/30 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                        <TableCell className="text-[10px] text-slate-400 py-2.5 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 py-2.5 hidden sm:table-cell max-w-[120px] truncate">
                          {log.user?.name || log.user?.email || 'System'}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 py-2.5 hidden md:table-cell">{log.resource.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-[10px] text-slate-500 font-mono py-2.5 hidden lg:table-cell">{log.ipAddress || '—'}</TableCell>
                        <TableCell className="text-[10px] py-2.5 hidden xl:table-cell">
                          <span className={log.statusCode && log.statusCode < 300 ? 'text-emerald-400' : 'text-red-400'}>{log.statusCode ?? '—'}</span>
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500 font-mono py-2.5 hidden xl:table-cell">
                          {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                        </TableCell>
                      </TableRow>
                      {/* Expanded Detail Row with JsonViewer */}
                      {isExpanded && (
                        <TableRow className="border-slate-800/50 hover:bg-transparent">
                          <TableCell colSpan={7} className="bg-slate-800/30 px-6 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-[10px] text-slate-400 uppercase mb-1">User</h4>
                                <p className="text-xs text-slate-300">{log.user?.name || log.user?.email || 'System'}</p>
                                <h4 className="text-[10px] text-slate-400 uppercase mt-3 mb-1">User Agent</h4>
                                <p className="text-[10px] text-slate-500 break-all">{log.userAgent || '—'}</p>
                              </div>
                              <div>
                                <h4 className="text-[10px] text-slate-400 uppercase mb-1">Full Details</h4>
                                {detailJson ? (
                                  <JsonViewer data={detailJson} maxHeight="max-h-48" />
                                ) : (
                                  <p className="text-xs text-slate-500">No structured details available</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      </>
                      );
                    })}
                    {(!data || data.data.length === 0) && (
                      <TableRow><TableCell colSpan={7} className="text-center text-xs text-slate-500 py-8">No audit logs found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500">{data?.pagination.total ?? 0} records — page {page} of {data?.pagination.pages ?? 1}</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-slate-300 px-2">{page}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page >= (data?.pagination.pages ?? 1)} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Recent Activity Timeline */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTimeline
              items={(data?.data ?? []).slice(0, 15).map((log) => {
                let type: 'success' | 'warning' | 'error' | 'info' = 'info';
                if (log.action.includes('error') || log.action.includes('fail') || log.action.includes('escalate')) type = 'error';
                else if (log.action.includes('create') || log.action.includes('login') || log.action.includes('decision')) type = 'success';
                else if (log.action.includes('cancel') || log.action.includes('disable') || log.action.includes('toggle')) type = 'warning';
                return {
                  id: log.id,
                  timestamp: log.createdAt,
                  title: `${log.user?.name || 'System'} — ${log.action.replace(/_/g, ' ')}`,
                  description: log.resource,
                  type,
                  badge: log.action.replace(/_/g, ' '),
                };
              })}
              maxHeight="max-h-[320px]"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}