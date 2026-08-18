"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FileText, FileWarning, Search, Shield, CheckCircle, Brain, Crosshair, Monitor, Trash2, Loader2, Eye, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { FilterBar } from "@/components/shared/filter-bar";
import { JsonViewer } from "@/components/shared/json-viewer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface Report {
  id: string; title: string; type: string; format: string; summary: string | null;
  classification: string; generatedBy: string | null; createdAt: string;
}

interface ReportFull extends Report {
  content: string;
}

const REPORT_TYPES = [
  { key: "incident", label: "Incident", icon: FileWarning, color: "text-red-400 border-red-500/20 bg-red-500/5" },
  { key: "forensic", label: "Forensic", icon: Search, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  { key: "vulnerability", label: "Vulnerability", icon: Shield, color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  { key: "compliance", label: "Compliance", icon: CheckCircle, color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
  { key: "intelligence", label: "Intelligence", icon: Brain, color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
  { key: "operation", label: "Operation", icon: Crosshair, color: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
  { key: "system", label: "System", icon: Monitor, color: "text-slate-400 border-slate-500/20 bg-slate-500/5" },
];

const CLASS_COLORS: Record<string, string> = {
  internal: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  confidential: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  secret: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  top_secret: "bg-red-500/10 text-red-400 border-red-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  forensic: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  vulnerability: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  compliance: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  intelligence: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  operation: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  system: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: reports, loading, refetch } = useApi<Report[]>("/api/reports");
  const [genDialog, setGenDialog] = useState(false);
  const [genType, setGenType] = useState("system");
  const [genClass, setGenClass] = useState("internal");
  const [generating, setGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [viewReport, setViewReport] = useState<ReportFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reports?type=${genType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
        body: JSON.stringify({ classification: genClass }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Report generated", description: data.title });
        setGenDialog(false);
        refetch();
      } else {
        toast({ title: "Error", description: data.error || "Generation failed", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Network error", variant: "destructive" }); }
    setGenerating(false);
  };

  const handleView = async (id: string) => {
    setViewLoading(true);
    setViewReport(null);
    try {
      const res = await fetch(`/api/reports?id=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      });
      if (res.ok) {
        setViewReport(await res.json());
      }
    } catch { /* ignore */ }
    setViewLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      });
      refetch();
      toast({ title: "Report deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const renderContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const md = "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
      return <ReactMarkdown>{md}</ReactMarkdown>;
    } catch {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Generate, view, and manage operational reports</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterBar
            filters={[
              {
                key: 'type',
                label: 'Type',
                options: REPORT_TYPES.map((rt) => ({ value: rt.key, label: rt.label })),
              },
            ]}
            values={{ type: typeFilter }}
            onChange={(vals) => setTypeFilter(vals.type)}
            className="w-auto"
          />
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setGenDialog(true)}><Plus className="h-3.5 w-3.5" />Generate Report</Button>
        </div>
      </motion.div>

      {/* Report Type Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {REPORT_TYPES.map((rt) => {
          const Icon = rt.icon;
          return (
            <Card key={rt.key} className={`border ${rt.color} hover:scale-[1.02] transition-transform cursor-pointer`} onClick={() => { setGenType(rt.key); setGenDialog(true); }}>
              <CardContent className="p-3 text-center space-y-2">
                <Icon className="h-5 w-5 mx-auto" />
                <p className="text-xs font-medium">{rt.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Reports Table */}
      <motion.div variants={item}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              {loading ? (
                <div className="p-4 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : !reports?.length ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No reports generated yet. Click &quot;Generate Report&quot; to create one.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Classification</TableHead>
                      <TableHead className="text-xs font-mono hidden md:table-cell">Generated By</TableHead>
                      <TableHead className="text-xs font-mono hidden lg:table-cell">Created</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.id} className="border-border/30">
                        <TableCell className="text-xs font-medium py-2.5 max-w-[300px] truncate">{r.title}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[10px] font-mono ${TYPE_COLORS[r.type] || ""}`}>{r.type}</Badge>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[10px] font-mono ${CLASS_COLORS[r.classification] || ""}`}>
                            {r.classification.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground font-mono hidden md:table-cell py-2.5">{r.generatedBy ? r.generatedBy.slice(0, 8) + "…" : "—"}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground font-mono hidden lg:table-cell py-2.5">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(r.id)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setDeleteTarget(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Dialog */}
      <Dialog open={genDialog} onOpenChange={setGenDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-sm">Generate Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Report Type</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((rt) => <SelectItem key={rt.key} value={rt.key}>{rt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Classification</Label>
              <Select value={genClass} onValueChange={setGenClass}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                  <SelectItem value="top_secret">Top Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGenDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport || viewLoading} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">{viewReport?.title || "Loading…"}</DialogTitle>
            {viewReport && (
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[viewReport.type] || ""}`}>{viewReport.type}</Badge>
                <Badge variant="outline" className={`text-[10px] ${CLASS_COLORS[viewReport.classification] || ""}`}>{viewReport.classification.replace("_", " ").toUpperCase()}</Badge>
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="h-[55vh]">
            {viewLoading ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-6 w-full" /></div>
            ) : viewReport ? (
              <div className="space-y-4">
                {viewReport.summary && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 text-foreground text-xs">
                    <span className="font-semibold">Summary:</span> {viewReport.summary}
                  </div>
                )}
                <MarkdownRenderer content={viewReport.content} className="text-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Raw JSON Data</p>
                  <JsonViewer
                    data={{
                      id: viewReport.id,
                      title: viewReport.title,
                      type: viewReport.type,
                      format: viewReport.format,
                      classification: viewReport.classification,
                      generatedBy: viewReport.generatedBy,
                      createdAt: viewReport.createdAt,
                      summary: viewReport.summary,
                      contentLength: viewReport.content?.length ?? 0,
                    }}
                    maxHeight="max-h-64"
                    initialDepth={2}
                  />
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget); }}
        loading={deleting}
      />
    </motion.div>
  );
}