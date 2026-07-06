'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo, XCircle, Plus, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, XCircle as FailIcon, Loader2, MinusCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Task {
  id: string; agentId: string | null; creatorId: string | null;
  type: string; status: string; priority: number; input: string;
  output: string | null; errorMessage: string | null; progress: number;
  startedAt: string | null; completedAt: string | null;
  createdAt: string; updatedAt: string;
  agent: { id: string; name: string; domain: string; status: string } | null;
  creator: { id: string; name: string | null; email: string } | null;
}

interface TasksResponse {
  tasks: Task[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const statusConfig: Record<string, { color: string; icon: typeof ListTodo; label: string }> = {
  pending: { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: Clock, label: 'Pending' },
  running: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Loader2, label: 'Running' },
  completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Completed' },
  failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: FailIcon, label: 'Failed' },
  cancelled: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: MinusCircle, label: 'Cancelled' },
};

const typeColors: Record<string, string> = {
  forensic: 'bg-violet-500/15 text-violet-400', offensive: 'bg-red-500/15 text-red-400',
  defensive: 'bg-emerald-500/15 text-emerald-400', micro_defensive: 'bg-teal-500/15 text-teal-400',
  sensors: 'bg-sky-500/15 text-sky-400', vip: 'bg-amber-500/15 text-amber-400', potentials: 'bg-rose-500/15 text-rose-400',
};

const TASK_TYPES = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];

function priorityColor(p: number): string {
  if (p >= 9) return 'text-red-400';
  if (p >= 7) return 'text-orange-400';
  if (p >= 5) return 'text-amber-400';
  if (p >= 3) return 'text-sky-400';
  return 'text-slate-400';
}

function priorityBarColor(p: number): string {
  if (p >= 9) return '[&>div]:bg-red-500';
  if (p >= 7) return '[&>div]:bg-orange-500';
  if (p >= 5) return '[&>div]:bg-amber-500';
  if (p >= 3) return '[&>div]:bg-sky-400';
  return '[&>div]:bg-slate-500';
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState('defensive');
  const [newPriority, setNewPriority] = useState('5');
  const [newInput, setNewInput] = useState('{}');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; domain: string }>>([]);
  const limit = 30;

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (agentFilter !== 'all') params.set('agentId', agentFilter);
    return `/api/tasks?${params.toString()}`;
  }, [page, statusFilter, typeFilter, agentFilter]);

  const { data, loading, error, refetch } = useApi<TasksResponse>(buildUrl());

  // Fetch agents for filter dropdown
  useEffect(() => {
    const token = localStorage.getItem('babirye_token');
    fetch('/api/agents', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      .then((r) => r.json())
      .then((j) => setAgents(j.agents || []))
      .catch(() => {});
  }, []);

  const createTask = async () => {
    const token = localStorage.getItem('babirye_token');
    let inputObj: any = {};
    try { inputObj = JSON.parse(newInput); } catch { /* keep empty */ }
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ type: newType, priority: parseInt(newPriority, 10) || 5, input: inputObj }),
    });
    setCreateOpen(false);
    refetch();
  };

  const cancelTask = async (taskId: string) => {
    const token = localStorage.getItem('babirye_token');
    await fetch(`/api/tasks?id=${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    refetch();
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  // Summary counts — derived from first load or re-count
  const summaryCounts = { pending: 0, running: 0, completed: 0, failed: 0 };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load tasks: {error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ListTodo className="h-6 w-6 text-emerald-400" /> Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.pagination.total ?? '—'} operational tasks</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" />New Task</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
            <DialogHeader><DialogTitle className="text-white text-sm">Create Task</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-slate-300">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {TASK_TYPES.map((t) => <SelectItem key={t} value={t} className="text-slate-200">{t.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-300">Priority: {newPriority}</Label>
                <Input type="range" min="1" max="10" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="accent-emerald-500" />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Input Params (JSON)</Label>
                <Textarea value={newInput} onChange={(e) => setNewInput(e.target.value)} rows={4} className="bg-slate-800 border-slate-600 text-white text-xs font-mono" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createTask} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', icon: Clock, color: 'text-sky-400', border: 'border-sky-500/30 bg-sky-500/5' },
          { label: 'Running', icon: Loader2, color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/5' },
          { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5' },
          { label: 'Failed', icon: FailIcon, color: 'text-red-400', border: 'border-red-500/30 bg-red-500/5' },
        ].map((sc) => {
          const count = sc.label === 'Pending' ? data?.tasks.filter((t) => t.status === 'pending').length ?? 0 :
                        sc.label === 'Running' ? data?.tasks.filter((t) => t.status === 'running').length ?? 0 :
                        sc.label === 'Completed' ? data?.tasks.filter((t) => t.status === 'completed').length ?? 0 :
                        data?.tasks.filter((t) => t.status === 'failed').length ?? 0;
          return (
            <Card key={sc.label} className={`border ${sc.border}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <sc.icon className={`h-7 w-7 ${sc.color} opacity-70`} />
                <div>
                  <p className="text-2xl font-bold text-white">{loading ? '—' : count}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{sc.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px] bg-slate-800 border-slate-600 text-xs text-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-200">All Statuses</SelectItem>
            {['pending', 'running', 'completed', 'failed', 'cancelled'].map((s) => (
              <SelectItem key={s} value={s} className="text-slate-200">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-slate-800 border-slate-600 text-xs text-white"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all" className="text-slate-200">All Types</SelectItem>
            {TASK_TYPES.map((t) => <SelectItem key={t} value={t} className="text-slate-200">{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-slate-800 border-slate-600 text-xs text-white"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
            <SelectItem value="all" className="text-slate-200">All Agents</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id} className="text-slate-200">{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tasks Table */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] text-slate-400 uppercase">Type</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden sm:table-cell">Agent</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Status</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden md:table-cell">Priority</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden lg:table-cell">Progress</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden xl:table-cell">Created</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.tasks.map((task) => {
                      const st = statusConfig[task.status] || statusConfig.pending;
                      return (
                        <TableRow key={task.id} className="border-slate-800/50 hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelectedTask(task)}>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${typeColors[task.type] || 'bg-slate-700 text-slate-300'}`}>
                              {task.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-300 py-2.5 hidden sm:table-cell max-w-[120px] truncate">
                            {task.agent?.name || <span className="text-slate-500">Unassigned</span>}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${st.color}`}>
                              <st.icon className="h-3 w-3 mr-1" />{st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${priorityColor(task.priority)}`}>{task.priority}</span>
                              <div className="w-12">
                                <Progress value={task.priority * 10} className={`h-1.5 bg-slate-800 ${priorityBarColor(task.priority)}`} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 hidden lg:table-cell">
                            <div className="flex items-center gap-2 w-24">
                              <Progress value={task.progress} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-400" />
                              <span className="text-[10px] text-slate-400">{task.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] text-slate-500 py-2.5 hidden xl:table-cell">
                            {new Date(task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                            {(task.status === 'pending' || task.status === 'running') && (
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => cancelTask(task.id)} title="Cancel">
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!data || data.tasks.length === 0) && (
                      <TableRow><TableCell colSpan={7} className="text-center text-xs text-slate-500 py-8">No tasks found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500">{data?.pagination.total ?? 0} tasks — page {page} of {data?.pagination.totalPages ?? 1}</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-slate-300 px-2">{page}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={page >= (data?.pagination.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-emerald-400" /> Task: {selectedTask.id.slice(0, 12)}…
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setSelectedTask(null)} className="border-slate-600 text-slate-400 hover:bg-slate-800 h-7">Close</Button>
                </div>
              </CardHeader>
              <Separator className="bg-slate-800" />
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">Type:</span> <Badge variant="outline" className={`text-[9px] ${typeColors[selectedTask.type]}`}>{selectedTask.type}</Badge></div>
                    <div><span className="text-slate-500">Status:</span> <Badge variant="outline" className={`text-[9px] ${statusConfig[selectedTask.status]?.color}`}>{selectedTask.status}</Badge></div>
                    <div><span className="text-slate-500">Priority:</span> <span className={priorityColor(selectedTask.priority)}>{selectedTask.priority}</span></div>
                    <div><span className="text-slate-500">Agent:</span> <span className="text-white">{selectedTask.agent?.name || 'Unassigned'}</span></div>
                    <div><span className="text-slate-500">Created:</span> <span className="text-slate-300">{new Date(selectedTask.createdAt).toLocaleString()}</span></div>
                    {selectedTask.completedAt && <div><span className="text-slate-500">Completed:</span> <span className="text-slate-300">{new Date(selectedTask.completedAt).toLocaleString()}</span></div>}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedTask.progress} className="h-2 bg-slate-800 flex-1 [&>div]:bg-emerald-400" />
                      <span className="text-xs text-slate-300 font-mono">{selectedTask.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedTask.output && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Output</p>
                      <ScrollArea className="max-h-32">
                        <pre className="text-[10px] text-emerald-300/80 bg-slate-800/50 rounded-lg p-2 font-mono whitespace-pre-wrap break-all">{selectedTask.output}</pre>
                      </ScrollArea>
                    </div>
                  )}
                  {selectedTask.errorMessage && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Error</p>
                      <ScrollArea className="max-h-32">
                        <pre className="text-[10px] text-red-300/80 bg-red-500/5 rounded-lg p-2 font-mono whitespace-pre-wrap break-all">{selectedTask.errorMessage}</pre>
                      </ScrollArea>
                    </div>
                  )}
                  {!selectedTask.output && !selectedTask.errorMessage && (
                    <p className="text-xs text-slate-500 italic">No output or errors recorded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}