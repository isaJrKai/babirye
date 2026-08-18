"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Pencil, Loader2, Eye, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { DetailPanel } from "@/components/shared/detail-panel";

interface Constitution {
  id: string; name: string; subsystem: string; content: string;
  version: string; isActive: boolean; createdAt: string; updatedAt: string;
}

const SUBSYSTEM_COLORS: Record<string, string> = {
  babirye: "bg-primary/10 text-primary border-primary/20",
  forensic: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  offensive: "bg-red-500/10 text-red-400 border-red-500/20",
  defensive: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  micro_defensive: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  sensors: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ConstitutionsPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [subsystemFilter, setSubsystemFilter] = useState<string>("all");
  const { data: constitutions, loading, refetch } = useApi<Constitution[]>(
    subsystemFilter === "all" ? "/api/constitutions" : `/api/constitutions?subsystem=${subsystemFilter}`,
  );

  const [viewCon, setViewCon] = useState<Constitution | null>(null);
  const [editCon, setEditCon] = useState<Constitution | null>(null);
  const [detailCon, setDetailCon] = useState<Constitution | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEditSave = async () => {
    if (!editCon) return;
    setSaving(true);
    const res = await fetch("/api/constitutions", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ id: editCon.id, content: editContent }),
    });
    if (res.ok) {
      toast({ title: "Constitution updated" });
      setEditCon(null);
      refetch();
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
    setSaving(false);
  };

  const openEdit = (con: Constitution) => {
    setEditCon(con);
    setEditContent(con.content);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Constitutions</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Subsystem governance documents and operational protocols</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Subsystem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subsystems</SelectItem>
              <SelectItem value="babirye">BABIRYE Core</SelectItem>
              <SelectItem value="forensic">Forensic</SelectItem>
              <SelectItem value="offensive">Offensive</SelectItem>
              <SelectItem value="defensive">Defensive</SelectItem>
              <SelectItem value="micro_defensive">Micro-Defensive</SelectItem>
              <SelectItem value="sensors">Sensors</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">GOVERNANCE</Badge>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>)
        ) : !constitutions?.length ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No constitutions found.</div>
        ) : (
          constitutions.map((con) => (
            <Card key={con.id} className={`border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors ${!con.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{con.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] font-mono ${SUBSYSTEM_COLORS[con.subsystem] || ""}`}>{con.subsystem.replace("_", " ")}</Badge>
                      <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">v{con.version}</Badge>
                      <MarkdownRenderer content={con.isActive ? '**Active**' : '**Inactive**'} className="inline" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {con.content.length > 200 ? con.content.slice(0, 200) + "…" : con.content}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => setViewCon(con)}>
                    <Eye className="h-3 w-3 mr-1" />View
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(con)}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>

      {/* View Constitution Dialog */}
      <Dialog open={!!viewCon} onOpenChange={() => setViewCon(null)}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-sm">{viewCon?.name}</DialogTitle>
              {viewCon && (
                <Badge variant="outline" className={`text-[10px] font-mono ${SUBSYSTEM_COLORS[viewCon.subsystem] || ""}`}>{viewCon.subsystem}</Badge>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              <MarkdownRenderer content={viewCon?.content ?? ''} className="text-foreground" />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      <DetailPanel
        open={!!detailCon}
        onOpenChange={(open) => { if (!open) setDetailCon(null); }}
        title={detailCon?.name ?? ''}
        description={detailCon?.subsystem ? `${detailCon.subsystem.replace('_', ' ')} · v${detailCon.version}` : undefined}
        actions={detailCon ? [
          {
            label: 'Edit',
            variant: 'default',
            onClick: () => { if (detailCon) { openEdit(detailCon); setDetailCon(null); } },
          },
          { label: 'Close', variant: 'ghost', onClick: () => setDetailCon(null) },
        ] : []}
      >
        {detailCon && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subsystem</span>
                <Badge variant="outline" className={`text-[10px] font-mono ${SUBSYSTEM_COLORS[detailCon.subsystem] || ""}`}>{detailCon.subsystem.replace('_', ' ')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Version</span>
                <span className="text-sm font-mono">v{detailCon.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-sm">{detailCon.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Updated</span>
                <span className="text-sm font-mono">{new Date(detailCon.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Content</p>
              <MarkdownRenderer content={detailCon.content} className="text-foreground max-h-[40vh] overflow-y-auto" />
            </div>
          </div>
        )}
      </DetailPanel>

      {/* Edit Constitution Dialog */}
      <Dialog open={!!editCon} onOpenChange={() => setEditCon(null)}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit: {editCon?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Constitution Content</Label>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[400px] font-mono text-xs bg-background/50 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditCon(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}