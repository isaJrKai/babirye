'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, XCircle, RefreshCw, Filter, Plus, ChevronRight,
  Activity, Settings, Clock, CircleDot, Ban, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
interface Agent {
  id: string; name: string; domain: string; description: string; version: string;
  status: string; config: string; metrics: string; lastActivityAt: string | null;
  createdAt: string; updatedAt: string; _count: { tasks: number };
}

interface AgentsResponse { agents: Agent[]; total: number }

const statusConfig: Record<string, { color: string; icon: typeof Bot; label: string }> = {
  idle: { color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', icon: CircleDot, label: 'Idle' },
  running: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Activity, label: 'Running' },
  error: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle, label: 'Error' },
  disabled: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Ban, label: 'Disabled' },
};

const domainColors: Record<string, string> = {
  forensic: 'text-violet-400', offensive: 'text-red-400', defensive: 'text-emerald-400',
  micro_defensive: 'text-teal-400', sensors: 'text-sky-400', vip: 'text-amber-400', potentials: 'text-rose-400',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const TASK_TYPES = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
const PRIORITIES = ['1 (Low)', '2', '3', '4', '5 (Medium)', '6', '7', '8', '9', '10 (Critical)'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AgentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskType, setTaskType] = useState('defensive');
  const [taskPriority, setTaskPriority] = useState('5');
  const [taskInput, setTaskInput] = useState('{}');

  const url = statusFilter === 'all' ? '/api/agents' : `/api/agents?status=${statusFilter}`;
  const { data, loading, error, refetch } = useApi<AgentsResponse>(url);

  const handleCreateTask = async () => {
    const token = localStorage.getItem('babirye_token');
    const priority = parseInt(taskPriority, 10) || 5;
    let inputObj: any = {};
    try { inputObj = JSON.parse(taskInput); } catch { /* keep empty */ }
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ type: taskType, priority, input: inputObj, agentId: selectedAgent?.id }),
    });
    setCreateOpen(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load agents: {error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="text-sm text-slate-400 mt-1">{data?.total ?? '—'} agents deployed across all domains</p>
        </div>
      </motion.div>

      {/* Status Filter Bar */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-400" />
        {['all', 'idle', 'running', 'error', 'disabled'].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </motion.div>

      {/* Agent Grid */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl bg-white/5" />)}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.agents.map((agent) => {
            const st = statusConfig[agent.status] || statusConfig.idle;
            const cfg: any = {};
            try { Object.assign(cfg, JSON.parse(agent.config)); } catch { /* empty */ }
            const metrics: any = {};
            try { Object.assign(metrics, JSON.parse(agent.metrics)); } catch { /* empty */ }
            return (
              <motion.div key={agent.id} variants={fadeUp}>
                <Card
                  className={`bg-slate-900/80 border-slate-700/50 backdrop-blur-sm cursor-pointer hover:border-emerald-500/40 transition-all ${selectedAgent?.id === agent.id ? 'ring-1 ring-emerald-500/50 border-emerald-500/40' : ''}`}
                  onClick={() => setSelectedAgent(agent)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800/80">
                          <Bot className={`h-5 w-5 ${domainColors[agent.domain] || 'text-slate-300'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{agent.name}</p>
                          <p className="text-[10px] text-slate-500">{agent.version}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${st.color}`}>
                        <st.icon className="h-3 w-3 mr-1" />{st.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{agent.description}</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Domain</span>
                      <span className={`font-medium ${domainColors[agent.domain] || 'text-slate-300'}`}>{agent.domain}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      <span className="text-slate-500">Tasks</span>
                      <span className="text-slate-300">{agent._count.tasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      <span className="text-slate-500">Last active</span>
                      <span className="text-slate-300">
                        {agent.lastActivityAt ? new Date(agent.lastActivityAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5 text-emerald-400" /> {selectedAgent.name}
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">{selectedAgent.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                          <Plus className="h-3.5 w-3.5 mr-1" /> New Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white text-sm">Create Task for {selectedAgent.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label className="text-xs text-slate-300">Type</Label>
                            <Select value={taskType} onValueChange={setTaskType}>
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {TASK_TYPES.map((t) => <SelectItem key={t} value={t} className="text-slate-200">{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-300">Priority (1-10)</Label>
                            <Select value={taskPriority} onValueChange={setTaskPriority}>
                              <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {PRIORITIES.map((p, i) => <SelectItem key={i + 1} value={String(i + 1)} className="text-slate-200">{p}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-300">Input Params (JSON)</Label>
                            <Textarea value={taskInput} onChange={(e) => setTaskInput(e.target.value)} rows={4} className="bg-slate-800 border-slate-600 text-white text-xs font-mono" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateTask} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" onClick={() => setSelectedAgent(null)} className="border-slate-600 text-slate-400 hover:bg-slate-800">
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator className="bg-slate-800" />
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Settings className="h-3.5 w-3.5 text-emerald-400" /> Configuration</h4>
                  <ScrollArea className="max-h-40">
                    <pre className="text-[10px] text-slate-400 font-mono bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap break-all">{selectedAgent.config || '{}'}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-emerald-400" /> Metrics</h4>
                  <ScrollArea className="max-h-40">
                    <pre className="text-[10px] text-slate-400 font-mono bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap break-all">{selectedAgent.metrics || '{}'}</pre>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-400" /> Info</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Domain</span><span className="text-white">{selectedAgent.domain}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Status</span><Badge variant="outline" className={`text-[10px] ${statusConfig[selectedAgent.status]?.color}`}>{selectedAgent.status}</Badge></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tasks</span><span className="text-white">{selectedAgent._count.tasks}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="text-slate-300">{new Date(selectedAgent.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}