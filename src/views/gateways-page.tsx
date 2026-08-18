"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server, Power, PowerOff, Pencil, Loader2, Activity, Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailPanel } from "@/components/shared/detail-panel";
import { JsonViewer } from "@/components/shared/json-viewer";

interface GatewayStatus {
  id: string; name: string; subsystem: string; isActive: boolean;
  port: number; host: string; deployedServices: string[]; network: string | null; updatedAt: string;
}

interface GatewaySummary {
  total: number; active: number; inactive: number;
}

interface GatewayStatusData {
  gateways: GatewayStatus[];
  summary: GatewaySummary;
}

const SUBSYSTEM_LABELS: Record<string, string> = {
  forensic: "Forensic",
  offensive: "Offensive",
  defensive: "Defensive",
  micro_defensive: "Micro-Defensive",
  sensors: "Sensors",
  vip: "VIP Protection",
};

const SUBSYSTEM_COLORS: Record<string, string> = {
  forensic: "border-emerald-500/20 hover:border-emerald-500/40",
  offensive: "border-red-500/20 hover:border-red-500/40",
  defensive: "border-amber-500/20 hover:border-amber-500/40",
  micro_defensive: "border-cyan-500/20 hover:border-cyan-500/40",
  sensors: "border-purple-500/20 hover:border-purple-500/40",
  vip: "border-rose-500/20 hover:border-rose-500/40",
};

const SUBSYSTEM_ICON_COLORS: Record<string, string> = {
  forensic: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  offensive: "text-red-400 bg-red-500/10 border-red-500/20",
  defensive: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  micro_defensive: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  sensors: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  vip: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const DEFAULT_PORTS: Record<string, number> = {
  forensic: 4748,
  offensive: 4747,
  defensive: 4749,
  micro_defensive: 4750,
  sensors: 9901,
  vip: 4751,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function GatewaysPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const { data: statusData, loading, refetch } = useApi<GatewayStatusData>("/api/gateways?view=status");

  const [editGateway, setEditGateway] = useState<GatewayStatus | null>(null);
  const [editForm, setEditForm] = useState({ port: 0, host: "", network: "", services: "" });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [detailGw, setDetailGw] = useState<GatewayStatus | null>(null);

  const gateways = statusData?.gateways || [];
  const summary = statusData?.summary || { total: 0, active: 0, inactive: 0 };

  const handleToggle = async (gw: GatewayStatus) => {
    setTogglingId(gw.id);
    const action = gw.isActive ? "deactivate" : "activate";
    const res = await fetch(`/api/gateways?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ id: gw.id }),
    });
    if (res.ok) {
      toast({ title: `Gateway ${action}d`, description: `${gw.name} is now ${gw.isActive ? "inactive" : "active"}` });
      refetch();
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
    setTogglingId(null);
  };

  const openEdit = (gw: GatewayStatus) => {
    setEditGateway(gw);
    setEditForm({
      port: gw.port,
      host: gw.host,
      network: gw.network || "",
      services: (gw.deployedServices || []).join(", "),
    });
  };

  const handleSaveEdit = async () => {
    if (!editGateway) return;
    setSaving(true);
    const services = editForm.services.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/gateways", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({
        id: editGateway.id,
        port: editForm.port,
        host: editForm.host,
        network: editForm.network || null,
        deployedServices: services,
      }),
    });
    if (res.ok) {
      toast({ title: "Gateway updated" });
      setEditGateway(null);
      refetch();
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SPA Gateways</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Single-Page Application gateway management and configuration</p>
        </div>
      </motion.div>

      {/* Summary Bar */}
      <motion.div variants={item}>
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Gateways:</span>
            <span className="text-sm font-mono font-bold">{summary.total}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            <span className="text-xs text-muted-foreground">Active:</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{summary.active}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-xs text-muted-foreground">Inactive:</span>
            <span className="text-sm font-mono font-bold text-slate-400">{summary.inactive}</span>
          </div>
        </div>
      </motion.div>

      {/* Gateway Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>)
        ) : gateways.map((gw) => (
          <Card key={gw.id} className={`border ${SUBSYSTEM_COLORS[gw.subsystem] || "border-border/50"} bg-card/80 backdrop-blur-sm transition-all cursor-pointer`}
            onClick={() => setDetailGw(gw)}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${SUBSYSTEM_ICON_COLORS[gw.subsystem] || ""}`}>
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{SUBSYSTEM_LABELS[gw.subsystem] || gw.subsystem}</CardTitle>
                      <p className="text-[10px] font-mono text-muted-foreground">{gw.name}</p>
                    </div>
                  </div>
                </div>
                {gw.isActive ? (
                  <StatusBadge status="active" entityType="gateway" className="text-[10px]" pulse />
                ) : (
                  <StatusBadge status="inactive" entityType="gateway" className="text-[10px]" />
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">Port</p>
                  <p className="font-mono font-bold text-foreground">{gw.port}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">Network</p>
                  <p className="font-mono font-bold text-foreground truncate">{gw.network || "—"}</p>
                </div>
              </div>

              {gw.deployedServices && gw.deployedServices.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Deployed Services</p>
                  <div className="flex gap-1 flex-wrap">
                    {gw.deployedServices.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-primary/5 border-primary/10 text-primary/70">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant={gw.isActive ? "outline" : "default"}
                  className={`flex-1 text-xs h-7 ${gw.isActive ? "text-red-400 border-red-500/20 hover:bg-red-500/10" : ""}`}
                  onClick={() => handleToggle(gw)}
                  disabled={togglingId === gw.id}
                >
                  {togglingId === gw.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : gw.isActive ? (
                    <><PowerOff className="h-3 w-3 mr-1" />Deactivate</>
                  ) : (
                    <><Power className="h-3 w-3 mr-1" />Activate</>
                  )}
                </Button>
                {isAdmin && (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(gw)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Gateway Detail Panel */}
      <DetailPanel
        open={!!detailGw}
        onOpenChange={(open) => { if (!open) setDetailGw(null); }}
        title={detailGw ? SUBSYSTEM_LABELS[detailGw.subsystem] || detailGw.subsystem : ''}
        description={detailGw?.name}
        actions={detailGw ? [
          {
            label: detailGw.isActive ? 'Deactivate' : 'Activate',
            variant: detailGw.isActive ? 'destructive' : 'default',
            onClick: () => { if (detailGw) handleToggle(detailGw); },
          },
          {
            label: 'Edit',
            variant: 'outline',
            onClick: () => { if (detailGw) { openEdit(detailGw); setDetailGw(null); } },
          },
          { label: 'Close', variant: 'ghost', onClick: () => setDetailGw(null) },
        ] : []}
      >
        {detailGw && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={detailGw.isActive ? 'active' : 'inactive'} entityType="gateway" pulse={detailGw.isActive} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Port</span>
                <span className="text-sm font-mono">{detailGw.port}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Host</span>
                <span className="text-sm font-mono">{detailGw.host}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Network</span>
                <span className="text-sm font-mono">{detailGw.network || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Updated</span>
                <span className="text-sm font-mono">{new Date(detailGw.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Deployed Services</p>
              <JsonViewer
                data={detailGw.deployedServices || []}
                maxHeight="max-h-64"
                initialDepth={2}
              />
            </div>
          </div>
        )}
      </DetailPanel>

      {/* Edit Gateway Dialog */}
      <Dialog open={!!editGateway} onOpenChange={() => setEditGateway(null)}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Gateway: {editGateway?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Port</Label>
                <Input type="number" value={editForm.port} onChange={(e) => setEditForm((f) => ({ ...f, port: parseInt(e.target.value, 10) || 0 }))} className="bg-background/50 font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Host</Label>
                <Input value={editForm.host} onChange={(e) => setEditForm((f) => ({ ...f, host: e.target.value }))} className="bg-background/50 font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Network</Label>
              <Input value={editForm.network} onChange={(e) => setEditForm((f) => ({ ...f, network: e.target.value }))} placeholder="e.g. 10.0.0.0/24" className="bg-background/50 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deployed Services (comma-separated)</Label>
              <Input value={editForm.services} onChange={(e) => setEditForm((f) => ({ ...f, services: e.target.value }))} className="bg-background/50 font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditGateway(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Activity className="h-3.5 w-3.5 mr-1.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}