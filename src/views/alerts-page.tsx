'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, XCircle, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ArrowUpCircle, ShieldAlert, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';
import { ActivityTimeline } from '@/components/shared/activity-timeline';
import { FilterBar } from '@/components/shared/filter-bar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AlertSummary {
  bySeverity: Record<string, number>; byType: Record<string, number>;
  byStatus: Record<string, number>; total: number;
}

interface SecurityAlert {
  id: string; toolId: string | null; source: string; severity: string; type: string;
  title: string; description: string; ioc: string | null; status: string;
  assignedTo: string | null; resolution: string | null; createdAt: string; updatedAt: string;
  tool: { id: string; name: string; category: string } | null;
}

interface AlertsListResponse {
  data: SecurityAlert[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const severityConfig: Record<string, { color: string; icon: typeof Info; dot: string }> = {
  critical: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle, dot: 'bg-red-500' },
  high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle, dot: 'bg-orange-500' },
  medium: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: ShieldAlert, dot: 'bg-amber-500' },
  low: { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: Info, dot: 'bg-sky-400' },
  info: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Info, dot: 'bg-slate-400' },
};

const statusColors: Record<string, string> = {
  new: 'bg-emerald-500/15 text-emerald-400', investigating: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-sky-500/15 text-sky-400', false_positive: 'bg-slate-500/15 text-slate-400',
  escalated: 'bg-red-500/15 text-red-400',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AlertsPage() {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState<string | null>(null);
  const limit = 20;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (severityFilter !== 'all') params.set('severity', severityFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return `/api/alerts?${params.toString()}`;
  }, [page, severityFilter, typeFilter, statusFilter]);

  const { data: summary, loading: summaryLoading } = useApi<AlertSummary>('/api/alerts?view=summary');
  const { data: alertsData, loading: alertsLoading, error, refetch } = useApi<AlertsListResponse>(buildUrl());

  const changeStatus = async (alertId: string, newStatus: string) => {
    const token = localStorage.getItem('babirye_token');
    await fetch('/api/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ id: alertId, status: newStatus }),
    });
    refetch();
  };

  const escalateAlert = async (alertId: string) => {
    const token = localStorage.getItem('babirye_token');
    await fetch('/api/alerts?action=escalate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ id: alertId }),
    });
    refetch();
    setEscalateOpen(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load alerts: {error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Critical', key: 'critical', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
    { label: 'High', key: 'high', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' },
    { label: 'Medium', key: 'medium', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
    { label: 'Low', key: 'low', color: 'text-sky-400 border-sky-500/30 bg-sky-500/5' },
    { label: 'Info', key: 'info', color: 'text-slate-400 border-slate-500/30 bg-slate-500/5' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="h-6 w-6 text-amber-400" /> Security Alerts</h1>
        <p className="text-sm text-slate-400 mt-1">{summary?.total ?? '—'} total alerts across all subsystems</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)
        ) : (
          summaryCards.map((sc) => (
            <Card key={sc.key} className={`border ${sc.color}`}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{summary?.bySeverity?.[sc.key] ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5">{sc.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="space-y-3">
        <FilterBar
          filters={[
            { key: 'severity', label: 'Severity', options: ['critical', 'high', 'medium', 'low', 'info'].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) },
            { key: 'type', label: 'Type', options: ['intrusion', 'malware', 'anomaly', 'policy_violation', 'data_breach', 'dos', 'phishing'].map((t) => ({ value: t, label: t.replace(/_/g, ' ') })) },
            { key: 'status', label: 'Status', options: ['new', 'investigating', 'resolved', 'false_positive', 'escalated'].map((s) => ({ value: s, label: s.replace(/_/g, ' ') })) },
          ]}
          values={{ severity: severityFilter, type: typeFilter, status: statusFilter }}
          onChange={(vals) => {
            setSeverityFilter(vals.severity || 'all');
            setTypeFilter(vals.type || 'all');
            setStatusFilter(vals.status || 'all');
            setPage(1);
          }}
        />
      </motion.div>

      {/* Alerts Table */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            {alertsLoading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead className="text-[10px] text-slate-400 uppercase">Severity</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Title</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden lg:table-cell">Assigned</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden xl:table-cell">Created</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsData?.data.map((alert) => {
                      const sev = severityConfig[alert.severity] || severityConfig.info;
                      const isExpanded = expandedId === alert.id;
                      let iocData: any = null;
                      try { iocData = alert.ioc ? JSON.parse(alert.ioc) : null; } catch { /* keep null */ }
                      return (
                        <TableRow key={alert.id} className="border-slate-800/50 hover:bg-slate-800/30">
                          <TableCell className="py-2.5">
                            <div className={`h-2.5 w-2.5 rounded-full ${sev.dot}`} />
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${sev.color}`}>{alert.severity}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-white font-medium py-2.5">{alert.title}</TableCell>
                          <TableCell className="hidden sm:table-cell py-2.5">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20">
                              {alert.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-2.5">
                            <Select value={alert.status} onValueChange={(v) => changeStatus(alert.id, v)}>
                              <SelectTrigger className={`h-6 w-[100px] text-[9px] ${statusColors[alert.status] || 'bg-slate-700 text-slate-300'} border-0`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {['new', 'investigating', 'resolved', 'false_positive', 'escalated'].map((s) => (
                                  <SelectItem key={s} value={s} className="text-slate-200 text-xs">{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 py-2.5 hidden lg:table-cell">{alert.assignedTo || '—'}</TableCell>
                          <TableCell className="text-[10px] text-slate-500 py-2.5 hidden xl:table-cell">
                            {new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </Button>
                              {alert.severity !== 'critical' && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-orange-400" onClick={() => { setEscalateTarget(alert.id); setEscalateOpen(true); }} title="Escalate">
                                  <ArrowUpCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          {/* Expanded Detail Row */}
                          {isExpanded && (
                            <TableRow className="border-slate-800/50 hover:bg-transparent">
                              <TableCell colSpan={8} className="bg-slate-800/30 px-6 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-[10px] text-slate-400 uppercase mb-1">Description</h4>
                                    <p className="text-xs text-slate-300">{alert.description}</p>
                                    <h4 className="text-[10px] text-slate-400 uppercase mt-3 mb-1">Source</h4>
                                    <p className="text-xs text-slate-300">{alert.source}</p>
                                    {alert.resolution && (
                                      <>
                                        <h4 className="text-[10px] text-slate-400 uppercase mt-3 mb-1">Resolution</h4>
                                        <p className="text-xs text-emerald-400">{alert.resolution}</p>
                                      </>
                                    )}
                                  </div>
                                  {iocData && (
                                    <div>
                                      <h4 className="text-[10px] text-slate-400 uppercase mb-1 flex items-center gap-1"><Eye className="h-3 w-3" /> Indicators of Compromise</h4>
                                      <ScrollArea className="max-h-32">
                                        <pre className="text-[10px] text-amber-300/80 bg-slate-900/60 rounded-lg p-2 font-mono whitespace-pre-wrap break-all">{JSON.stringify(iocData, null, 2)}</pre>
                                      </ScrollArea>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableRow>
                      );
                    })}
                    {(!alertsData || alertsData.data.length === 0) && (
                      <TableRow><TableCell colSpan={8} className="text-center text-xs text-slate-500 py-8">No alerts found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500">{alertsData?.pagination.total ?? 0} alerts — page {page} of {alertsData?.pagination.pages ?? 1}</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-slate-300 px-2">{page}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page >= (alertsData?.pagination.pages ?? 1)} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Recent Alert Activity Timeline */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" /> Recent Alert Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ActivityTimeline
              items={(alertsData?.data ?? []).slice(0, 10).map((a) => {
                let type: 'success' | 'warning' | 'error' | 'info' = 'info';
                if (a.severity === 'critical' || a.severity === 'high') type = 'error';
                else if (a.severity === 'medium') type = 'warning';
                else if (a.status === 'resolved') type = 'success';
                return {
                  id: a.id,
                  timestamp: a.createdAt,
                  title: a.title,
                  description: `${a.type.replace(/_/g, ' ')} • ${a.source}`,
                  type,
                  badge: a.severity,
                };
              })}
              maxHeight="max-h-[300px]"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Escalation Confirm Dialog */}
      <ConfirmDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        title="Escalate Alert"
        description="This will mark the alert as escalated and notify the security team. Are you sure?"
        confirmText="Escalate"
        variant="destructive"
        onConfirm={async () => {
          if (escalateTarget) await escalateAlert(escalateTarget);
        }}
      />
    </motion.div>
  );
}