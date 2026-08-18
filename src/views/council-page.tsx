'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale, XCircle, Send, ThumbsUp, ThumbsDown, MinusCircle, Clock,
  Vote, Brain, ChevronLeft, ChevronRight, MessageSquare, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useApi } from '@/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CouncilDomain {
  id: string; name: string; description: string; specialty: string;
  confidenceBase: number; isActive: boolean; weight: number;
  voteCount: number; decisionCount: number; createdAt: string;
}

interface HistoryItem {
  id: string; query: string; decision: string; confidence: number;
  vetoBy: string | null; reasoning: string; voteCount: number;
  approveCount: number; rejectCount: number; abstainCount: number;
  domain: { id: string; name: string; specialty: string };
  createdAt: string;
}

interface DomainsResponse { domains: CouncilDomain[]; total: number }
interface HistoryResponse { history: HistoryItem[]; total: number; limit: number; offset: number }

const decisionColors: Record<string, string> = {
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  deferred: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CouncilPage() {
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 15;

  const { data: domainsData, loading: domainsLoading, error: domainsError, refetch: refetchDomains } = useApi<DomainsResponse>('/api/council?view=domains');
  const { data: historyData, loading: historyLoading, refetch: refetchHistory } = useApi<HistoryResponse>(
    `/api/council?view=history&limit=${historyLimit}&offset=${(historyPage - 1) * historyLimit}`
  );

  const consultCouncil = async () => {
    if (!query.trim()) return;
    setSubmitting(true);
    setLastResult(null);
    const token = localStorage.getItem('babirye_token');
    const res = await fetch('/api/council', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ query: query.trim() }),
    });
    const json = await res.json();
    setLastResult(json);
    setSubmitting(false);
    refetchDomains();
    refetchHistory();
    setQuery('');
  };

  if (domainsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400 text-sm">Failed to load council: {domainsError}</p>
        <Button variant="outline" size="sm" onClick={refetchDomains} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Scale className="h-6 w-6 text-emerald-400" /> Expert Council</h1>
        <p className="text-sm text-slate-400 mt-1">12-domain consensus decision engine with veto protocol</p>
      </motion.div>

      {/* Domain Grid */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-emerald-400" /> Council Domains
        </h2>
        {domainsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {domainsData?.domains.map((domain) => (
              <motion.div key={domain.id} variants={fadeUp}>
                <Card className={`bg-slate-900/80 border-slate-700/50 ${domain.isActive ? 'hover:border-emerald-500/30' : 'opacity-50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-white">{domain.name}</p>
                      <div className={`h-2 w-2 rounded-full ${domain.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{domain.specialty}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                      <div className="flex justify-between"><span className="text-slate-500">Weight</span><span className="text-white">{domain.weight.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Confidence</span><span className="text-sky-400">{(domain.confidenceBase * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Votes</span><span className="text-white">{domain.voteCount}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Decisions</span><span className="text-white">{domain.decisionCount}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Consult Council Panel */}
      <motion.div variants={fadeUp}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-400" /> Consult Council
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Submit a query for multi-domain evaluation and consensus decision</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the action or scenario you want the council to evaluate..."
              rows={3}
              className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
            />
            <div className="flex items-center gap-3">
              <Button onClick={consultCouncil} disabled={submitting || !query.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {submitting ? 'Evaluating...' : 'Submit to Council'}
              </Button>
              {submitting && <span className="text-xs text-amber-400 animate-pulse">All 12 domains are voting...</span>}
            </div>

            {/* Last Decision Result */}
            {lastResult && lastResult.decision && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Separator className="bg-slate-800 mb-4" />
                <div className={`p-4 rounded-lg border ${decisionColors[lastResult.decision.decision] || 'bg-slate-800 border-slate-700'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-bold text-white">
                      {lastResult.decision.decision === 'approved' && <><CheckCircle2 className="h-4 w-4 text-emerald-400 inline mr-1" />APPROVED</>}
                      {lastResult.decision.decision === 'rejected' && <><XCircle className="h-4 w-4 text-red-400 inline mr-1" />REJECTED</>}
                      {lastResult.decision.decision === 'deferred' && <><MinusCircle className="h-4 w-4 text-amber-400 inline mr-1" />DEFERRED</>}
                    </h4>
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-slate-300 border-white/10">
                      Confidence: {(lastResult.decision.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] mb-2">
                    <span className="flex items-center gap-1 text-emerald-400"><ThumbsUp className="h-3 w-3" /> {lastResult.decision.approveCount} approved</span>
                    <span className="flex items-center gap-1 text-red-400"><ThumbsDown className="h-3 w-3" /> {lastResult.decision.rejectCount} rejected</span>
                    <span className="flex items-center gap-1 text-slate-400"><MinusCircle className="h-3 w-3" /> {lastResult.decision.abstainCount} abstained</span>
                    {lastResult.decision.vetoBy && <Badge className="bg-red-500/20 text-red-400 text-[9px]">VETO by {lastResult.decision.vetoBy}</Badge>}
                  </div>
                  <ScrollArea className="max-h-24">
                    <p className="text-[10px] text-slate-400">{lastResult.decision.reasoning}</p>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Decision History */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-400" /> Decision History
        </h2>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/5" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] text-slate-400 uppercase">Query</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase">Decision</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden sm:table-cell">Confidence</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden md:table-cell">Votes (A/R/A)</TableHead>
                      <TableHead className="text-[10px] text-slate-400 uppercase hidden lg:table-cell">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData?.history.map((item) => (
                      <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/30">
                        <TableCell className="text-xs text-slate-300 max-w-[280px] truncate py-2.5">{item.query}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${decisionColors[item.decision] || ''}`}>
                            {item.decision}
                            {item.vetoBy && ' (veto)'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 py-2.5 hidden sm:table-cell">{(item.confidence * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-[10px] text-slate-400 py-2.5 hidden md:table-cell">
                          <span className="text-emerald-400">{item.approveCount}</span>/
                          <span className="text-red-400">{item.rejectCount}</span>/
                          <span className="text-slate-500">{item.abstainCount}</span>
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-500 py-2.5 hidden lg:table-cell">
                          {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!historyData || historyData.history.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="text-center text-xs text-slate-500 py-8">No decisions yet — consult the council above</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/50">
                  <p className="text-[10px] text-slate-500">{historyData?.total ?? 0} decisions</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={historyPage <= 1} onClick={() => setHistoryPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs text-slate-300 px-2">{historyPage}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" disabled={(historyData?.history.length ?? 0) < historyLimit} onClick={() => setHistoryPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}