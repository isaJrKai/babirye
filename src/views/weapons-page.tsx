"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Crosshair, Swords, Plus, Loader2, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useToast } from "@/hooks/use-toast";
import { FilterBar } from "@/components/shared/filter-bar";
import { DetailPanel } from "@/components/shared/detail-panel";
import { StatusBadge } from "@/components/shared/status-badge";
import { JsonViewer } from "@/components/shared/json-viewer";

interface Weapon {
  id: string; name: string; category: string; subcategory: string | null;
  caliber: string | null; range: number | null; rateOfFire: string | null;
  magazineCapacity: number | null; status: string; serialNumber: string | null;
  assignedTo: string | null; lastInspectionAt: string | null; createdAt: string;
}

interface MartialArt {
  id: string; name: string; style: string; origin: string; description: string;
  techniques: string; difficulty: string; effectiveness: string; createdAt: string;
}

const CATEGORIES = ["handgun", "rifle", "shotgun", "smg", "lmg", "sniper", "explosive", "directed_energy", "missile", "non_lethal", "cyber_kinetic"];

const CAT_COLORS: Record<string, string> = {
  handgun: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rifle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  shotgun: "bg-red-500/10 text-red-400 border-red-500/20",
  smg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  lmg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sniper: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  explosive: "bg-red-500/10 text-red-400 border-red-500/20",
  directed_energy: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  missile: "bg-red-500/10 text-red-400 border-red-500/20",
  non_lethal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  cyber_kinetic: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  armory: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  deployed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  decommissioned: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STYLE_COLORS: Record<string, string> = {
  striking: "bg-red-500/10 text-red-400 border-red-500/20",
  grappling: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  traditional: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  weapons: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  hybrid: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  expert: "bg-red-500/10 text-red-400 border-red-500/20",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function WeaponsPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [catFilter, setCatFilter] = useState<string>("all");
  const { data: weapons, loading: weaponsLoading, refetch: refetchWeapons } = useApi<Weapon[]>(
    catFilter === "all" ? "/api/weapons" : `/api/weapons?category=${catFilter}`,
  );

  const [styleFilter, setStyleFilter] = useState<string>("all");
  const { data: arts, loading: artsLoading, refetch: refetchArts } = useApi<MartialArt[]>(
    styleFilter === "all" ? "/api/weapons?view=martial_arts" : `/api/weapons?view=martial_arts&style=${styleFilter}`,
  );

  // Add weapon dialog
  const [addWeaponOpen, setAddWeaponOpen] = useState(false);
  const [newWeapon, setNewWeapon] = useState({ name: "", category: "rifle", caliber: "", range: "", rateOfFire: "", magazineCapacity: "", serialNumber: "" });
  const [adding, setAdding] = useState(false);
  const [detailWeapon, setDetailWeapon] = useState<Weapon | null>(null);

  const handleAddWeapon = async () => {
    if (!newWeapon.name) return;
    setAdding(true);
    const res = await fetch("/api/weapons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("babirye_token")}` },
      body: JSON.stringify({ view: "weapon", ...newWeapon }),
    });
    if (res.ok) { toast({ title: "Weapon added" }); setAddWeaponOpen(false); setNewWeapon({ name: "", category: "rifle", caliber: "", range: "", rateOfFire: "", magazineCapacity: "", serialNumber: "" }); refetchWeapons(); }
    else { const d = await res.json().catch(() => ({})); toast({ title: "Error", description: d.error, variant: "destructive" }); }
    setAdding(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Weapons Database</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">Manage weapon systems and martial arts profiles</p>
        </div>
        {isAdmin && (
          <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">ARMORY</Badge>
        )}
      </motion.div>

      <Tabs defaultValue="weapons" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="weapons" className="gap-1.5 text-xs"><Crosshair className="h-3.5 w-3.5" />Weapons</TabsTrigger>
          <TabsTrigger value="martial" className="gap-1.5 text-xs"><Swords className="h-3.5 w-3.5" />Martial Arts</TabsTrigger>
        </TabsList>

        {/* Weapons Tab */}
        <TabsContent value="weapons" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <FilterBar
              filters={[
                {
                  key: 'category',
                  label: 'Category',
                  options: CATEGORIES.map((c) => ({
                    value: c,
                    label: c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                  })),
                },
              ]}
              values={{ category: catFilter }}
              onChange={(vals) => setCatFilter(vals.category)}
            />
            {isAdmin && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAddWeaponOpen(true)}><Plus className="h-3.5 w-3.5" />Add Weapon</Button>
            )}
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                {weaponsLoading ? (
                  <div className="p-4 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : !weapons?.length ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">No weapons found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs font-mono hidden md:table-cell">Caliber</TableHead>
                        <TableHead className="text-xs font-mono hidden lg:table-cell">Range</TableHead>
                        <TableHead className="text-xs font-mono hidden lg:table-cell">RoF</TableHead>
                        <TableHead className="text-xs font-mono hidden md:table-cell">Cap.</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs font-mono hidden xl:table-cell">Serial</TableHead>
                        <TableHead className="text-xs font-mono hidden xl:table-cell">Inspected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weapons.map((w) => (
                        <TableRow key={w.id} className="border-border/30 cursor-pointer" onClick={() => setDetailWeapon(w)}>
                          <TableCell className="text-xs font-medium py-2.5">{w.name}</TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={`text-[10px] font-mono ${CAT_COLORS[w.category] || ""}`}>{w.category.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden md:table-cell py-2.5">{w.caliber || "—"}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden lg:table-cell py-2.5">{w.range ? `${w.range}m` : "—"}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden lg:table-cell py-2.5">{w.rateOfFire || "—"}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden md:table-cell py-2.5">{w.magazineCapacity || "—"}</TableCell>
                          <TableCell className="py-2.5">
                            <StatusBadge status={w.status} entityType="generic" className="text-[10px]" />
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden xl:table-cell py-2.5">{w.serialNumber || "—"}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono hidden xl:table-cell py-2.5">
                            {w.lastInspectionAt ? new Date(w.lastInspectionAt).toLocaleDateString() : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Martial Arts Tab */}
        <TabsContent value="martial" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={styleFilter} onValueChange={setStyleFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Style" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="striking">Striking</SelectItem>
                <SelectItem value="grappling">Grappling</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="weapons">Weapons</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {artsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
            </div>
          ) : !arts?.length ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No martial arts found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {arts.map((art) => {
                let techniques: string[] = [];
                try { techniques = JSON.parse(art.techniques); } catch { /* ignore */ }
                let effectiveness: string[] = [];
                try { effectiveness = JSON.parse(art.effectiveness); } catch { /* ignore */ }

                return (
                  <Card key={art.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-semibold">{art.name}</CardTitle>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[10px] font-mono ${STYLE_COLORS[art.style] || ""}`}>{art.style}</Badge>
                            <Badge variant="outline" className={`text-[10px] font-mono ${DIFFICULTY_COLORS[art.difficulty] || ""}`}>{art.difficulty}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-muted/30">{art.origin}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{art.description}</p>
                      {techniques.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Techniques</p>
                          <div className="flex gap-1 flex-wrap">
                            {techniques.slice(0, 6).map((t) => (
                              <Badge key={t} variant="outline" className="text-[9px] bg-muted/30">{t}</Badge>
                            ))}
                            {techniques.length > 6 && <Badge variant="outline" className="text-[9px] bg-muted/30">+{techniques.length - 6}</Badge>}
                          </div>
                        </div>
                      )}
                      {effectiveness.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Effectiveness</p>
                          <div className="space-y-1">
                            {effectiveness.slice(0, 3).map((e) => {
                              const [label, val] = e.split(":");
                              const num = parseInt(val, 10) || 0;
                              return (
                                <div key={e} className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-20 shrink-0">{label}</span>
                                  <Progress value={num} className="h-1.5 flex-1" />
                                  <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{num}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <JsonViewer
                        data={{
                          techniques,
                          effectiveness: effectiveness.length > 0
                            ? Object.fromEntries(effectiveness.map((e) => { const [k, v] = e.split(":"); return [k, v]; }))
                            : [],
                        }}
                        maxHeight="max-h-32"
                        initialDepth={1}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Weapon Detail Panel */}
      <DetailPanel
        open={!!detailWeapon}
        onOpenChange={(open) => { if (!open) setDetailWeapon(null); }}
        title={detailWeapon?.name ?? ''}
        description={detailWeapon?.category ? `Category: ${detailWeapon.category.replace('_', ' ')}` : undefined}
        actions={[
          { label: 'Close', variant: 'ghost', onClick: () => setDetailWeapon(null) },
        ]}
      >
        {detailWeapon && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={detailWeapon.status} entityType="generic" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Category</span>
                <Badge variant="outline" className={`text-[10px] font-mono ${CAT_COLORS[detailWeapon.category] || ""}`}>{detailWeapon.category.replace('_', ' ')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Caliber</span>
                <span className="text-sm font-mono">{detailWeapon.caliber || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Range</span>
                <span className="text-sm font-mono">{detailWeapon.range ? `${detailWeapon.range}m` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rate of Fire</span>
                <span className="text-sm font-mono">{detailWeapon.rateOfFire || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Magazine Capacity</span>
                <span className="text-sm font-mono">{detailWeapon.magazineCapacity || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Serial Number</span>
                <span className="text-sm font-mono">{detailWeapon.serialNumber || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Assigned To</span>
                <span className="text-sm font-mono">{detailWeapon.assignedTo || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Inspection</span>
                <span className="text-sm font-mono">{detailWeapon.lastInspectionAt ? new Date(detailWeapon.lastInspectionAt).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Weapon Data</p>
              <JsonViewer
                data={{
                  id: detailWeapon.id,
                  name: detailWeapon.name,
                  category: detailWeapon.category,
                  subcategory: detailWeapon.subcategory,
                  caliber: detailWeapon.caliber,
                  range: detailWeapon.range,
                  rateOfFire: detailWeapon.rateOfFire,
                  magazineCapacity: detailWeapon.magazineCapacity,
                  status: detailWeapon.status,
                  serialNumber: detailWeapon.serialNumber,
                  assignedTo: detailWeapon.assignedTo,
                  lastInspectionAt: detailWeapon.lastInspectionAt,
                }}
                maxHeight="max-h-64"
                initialDepth={2}
              />
            </div>
          </div>
        )}
      </DetailPanel>

      {/* Add Weapon Dialog */}
      <Dialog open={addWeaponOpen} onOpenChange={setAddWeaponOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-sm">Add Weapon</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Name</Label><Input value={newWeapon.name} onChange={(e) => setNewWeapon((w) => ({ ...w, name: e.target.value }))} className="bg-background/50 text-sm" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={newWeapon.category} onValueChange={(v) => setNewWeapon((w) => ({ ...w, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Caliber</Label><Input value={newWeapon.caliber} onChange={(e) => setNewWeapon((w) => ({ ...w, caliber: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Range (m)</Label><Input type="number" value={newWeapon.range} onChange={(e) => setNewWeapon((w) => ({ ...w, range: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Rate of Fire</Label><Input value={newWeapon.rateOfFire} onChange={(e) => setNewWeapon((w) => ({ ...w, rateOfFire: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Magazine Capacity</Label><Input type="number" value={newWeapon.magazineCapacity} onChange={(e) => setNewWeapon((w) => ({ ...w, magazineCapacity: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Serial Number</Label><Input value={newWeapon.serialNumber} onChange={(e) => setNewWeapon((w) => ({ ...w, serialNumber: e.target.value }))} className="bg-background/50 font-mono text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddWeaponOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddWeapon} disabled={adding}>{adding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}