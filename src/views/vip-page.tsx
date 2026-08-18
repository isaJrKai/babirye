'use client';

import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Crown,
  Plus,
  Plane,
  Car,
  Watch,
  AlertTriangle,
  ShieldCheck,
  Heart,
  Thermometer,
  MapPin,
  Battery,
  Camera,
  Flame,
  CheckCircle2,
  XCircle,
  Siren,
  Lock,
  Route,
  ArrowRight,
  ShieldAlert,
  Truck,
  Radio,
  Activity,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface VipProfile {
  id: string;
  name: string;
  designation: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  protectionLevel: number;
  status: 'active' | 'inactive';
  _count: { drones: number; vehicles: number; wearables: number; incidents: number };
}

interface Drone {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'standby' | 'maintenance' | 'offline';
  battery: number;
  altitude: number;
  speed: number;
  gpsLat: number;
  gpsLng: number;
  cameraEnabled: boolean;
  thermalEnabled: boolean;
  vipProfileId: string;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  plate: string;
  status: 'active' | 'standby' | 'maintenance';
  fuelLevel: number;
  gpsLat: number;
  gpsLng: number;
  route: string | null;
  speed: number;
  heading: number;
  vipProfileId: string;
}

interface Wearable {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'low_battery';
  battery: number;
  heartRate: number | null;
  temperature: number | null;
  sosTriggered: boolean;
  vipProfileId: string;
}

interface Incident {
  id: string;
  vipProfileId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  response: string | null;
  resolved: boolean;
  createdAt: string;
}

const THREAT_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  standby: 'secondary',
  inactive: 'secondary',
  low_battery: 'destructive',
  maintenance: 'outline',
  offline: 'destructive',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function VipPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data: profilesData, loading: pLoading, error: pError, refetch: pRefetch, post: pPost } = useApi<VipProfile[]>(
    '/api/vip?view=profiles', { headers }
  );
  const { data: dronesData, refetch: dRefetch, post: dPost } = useApi<Drone[]>('/api/vip?view=drones', { headers });
  const { data: vehiclesData, refetch: vRefetch, post: vPost } = useApi<Vehicle[]>('/api/vip?view=vehicles', { headers });
  const { data: wearablesData, refetch: wRefetch, post: wPost } = useApi<Wearable[]>('/api/vip?view=wearables', { headers });
  const { data: incidentsData, refetch: iRefetch } = useApi<Incident[]>('/api/vip?view=incidents', { headers });

  const [activeTab, setActiveTab] = useState('profiles');
  const [addDialog, setAddDialog] = useState<string | null>(null);

  const profiles = profilesData ?? [];
  const drones = dronesData ?? [];
  const vehicles = vehiclesData ?? [];
  const wearables = wearablesData ?? [];
  const incidents = incidentsData ?? [];

  /* SOS alert check */
  const sosWearables = useMemo(
    () => wearables.filter((w) => w.sosTriggered),
    [wearables]
  );

  const refetchAll = () => { pRefetch(); dRefetch(); vRefetch(); wRefetch(); iRefetch(); };

  /* ─── Incident Summary Stats ─── */
  const incidentSummary = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter(i => i.resolved).length;
    const inProgress = incidents.filter(i => !i.resolved).length;
    const critical = incidents.filter(i => i.severity === 'critical').length;
    return { total, resolved, inProgress, critical };
  }, [incidents]);

  /* ─── Wearable Health Monitor Data ─── */
  const healthData = useMemo(() => {
    return wearables.slice(0, 6).map((w, idx) => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hr = w.heartRate ?? 0;
      const temp = w.temperature ?? 0;
      const hrData = w.heartRate
        ? hours.map(h => hr + Math.sin(h * 0.5 + idx) * 12 + Math.random() * 5)
        : [];
      const tempData = w.temperature
        ? hours.map(h => temp + Math.sin(h * 0.3 + idx) * 0.3 + Math.random() * 0.2)
        : [];
      return { wearable: w, hrData, tempData };
    });
  }, [wearables]);

  /* ─── Patrol Route History ─── */
  const patrolHistory = [
    { id: 'pr-1', principal: 'Principal Alpha', from: 'HQ Building A', to: 'Convention Center', time: '14:30', status: 'completed' as const, distance: '12.4 km' },
    { id: 'pr-2', principal: 'Principal Alpha', from: 'Convention Center', to: 'Hotel Grand', time: '17:00', status: 'in_progress' as const, distance: '8.2 km' },
    { id: 'pr-3', principal: 'Principal Bravo', from: 'Office Tower', to: 'Airport VIP Lounge', time: '09:15', status: 'completed' as const, distance: '24.1 km' },
    { id: 'pr-4', principal: 'Principal Bravo', from: 'Airport VIP Lounge', to: 'Corporate HQ', time: '11:30', status: 'completed' as const, distance: '24.1 km' },
    { id: 'pr-5', principal: 'Principal Charlie', from: 'Tech Campus', to: 'Restaurant Le Jardin', time: '12:45', status: 'cancelled' as const, distance: '5.6 km' },
  ];

  /* ─── Response Protocol Steps ─── */
  const protocolSteps = [
    { name: 'Detection', icon: ShieldAlert, description: 'Identify threat via sensors, wearables, and intelligence', status: 'completed' as const },
    { name: 'Containment', icon: Lock, description: 'Isolate threat area, lock down perimeter, protect principal', status: 'completed' as const },
    { name: 'Eradication', icon: ShieldCheck, description: 'Neutralize threat with available assets and personnel', status: 'in_progress' as const },
    { name: 'Recovery', icon: CheckCircle2, description: 'Return to normal operations, debrief, update threat profile', status: 'pending' as const },
  ];

  /* Loading */
  if (pLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (pError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Crown className="size-12 text-destructive" />
        <p className="text-muted-foreground text-sm">{pError}</p>
        <Button variant="outline" onClick={pRefetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* SOS Banner */}
      <AnimatePresence>
        {sosWearables.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="size-4" />
              <AlertTitle className="text-red-500 font-bold">SOS ALERT — {sosWearables.length} Active</AlertTitle>
              <AlertDescription className="text-red-400">
                {sosWearables.map((w) => w.name).join(', ')} — Immediate response required!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 flex size-10 items-center justify-center rounded-lg">
            <Crown className="text-amber-500 size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VIP Protection</h1>
            <p className="text-muted-foreground text-sm">{profiles.length} protectees</p>
          </div>
        </div>
        <Dialog open={addDialog !== null} onOpenChange={(open) => !open && setAddDialog(null)}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={() => setAddDialog('vip')}>
              <Plus className="size-4" /> Add VIP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = e.currentTarget;
                await pPost('/api/vip', {
                  view: 'profiles',
                  name: (f.elements.namedItem('name') as HTMLInputElement).value,
                  designation: (f.elements.namedItem('designation') as HTMLInputElement).value,
                  threatLevel: (f.elements.namedItem('threatLevel') as HTMLSelectElement).value,
                  protectionLevel: parseInt((f.elements.namedItem('protectionLevel') as HTMLInputElement).value || '3'),
                });
                setAddDialog(null);
                pRefetch();
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Add VIP Profile</DialogTitle>
                <DialogDescription>Create a new protectee record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
                <div className="space-y-2"><Label>Designation</Label><Input name="designation" required /></div>
                <div className="space-y-2">
                  <Label>Threat Level</Label>
                  <Select name="threatLevel" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['low', 'medium', 'high', 'critical'] as const).map((l) => (
                        <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Protection Level (1-5)</Label><Input name="protectionLevel" type="number" min={1} max={5} defaultValue={3} /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialog(null)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-background p-1">
          <TabsTrigger value="profiles" className="gap-1.5 text-xs">
            <Crown className="size-3.5" /> Profiles
          </TabsTrigger>
          <TabsTrigger value="drones" className="gap-1.5 text-xs">
            <Plane className="size-3.5" /> Drones ({drones.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-1.5 text-xs">
            <Car className="size-3.5" /> Vehicles ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="wearables" className="gap-1.5 text-xs">
            <Watch className="size-3.5" /> Wearables ({wearables.length})
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-1.5 text-xs">
            <AlertTriangle className="size-3.5" /> Incidents ({incidents.length})
          </TabsTrigger>
        </TabsList>

        {/* ---- Profiles tab ---- */}
        <TabsContent value="profiles" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {p.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{p.designation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] capitalize ${THREAT_STYLES[p.threatLevel]}`}>
                      {p.threatLevel} threat
                    </Badge>
                    <span className="text-muted-foreground text-[11px]">Protection: {p.protectionLevel}/5</span>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-2 gap-1 text-[11px]">
                    <span>🛩 Drones: {p._count.drones}</span>
                    <span>🚗 Vehicles: {p._count.vehicles}</span>
                    <span>⌚ Wearables: {p._count.wearables}</span>
                    <span>🚨 Incidents: {p._count.incidents}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---- Drones tab ---- */}
        <TabsContent value="drones" className="mt-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead className="hidden sm:table-cell">Alt (m)</TableHead>
                    <TableHead className="hidden sm:table-cell">Speed</TableHead>
                    <TableHead className="hidden lg:table-cell">GPS</TableHead>
                    <TableHead className="hidden md:table-cell">Cams</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drones.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm">{d.name}</TableCell>
                      <TableCell className="text-xs">{d.model}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[d.status] ?? 'outline'} className="text-[10px] capitalize">{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={d.battery} className="h-2 w-16" />
                          <span className="text-[11px] font-mono">{d.battery}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{d.altitude}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">{d.speed} km/h</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-[10px]">
                        {d.gpsLat.toFixed(4)}, {d.gpsLng.toFixed(4)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Badge variant={d.cameraEnabled ? 'default' : 'outline'} className="gap-0.5 text-[10px]">
                            <Camera className="size-2.5" /> Cam
                          </Badge>
                          <Badge variant={d.thermalEnabled ? 'default' : 'outline'} className="gap-0.5 text-[10px]">
                            <Flame className="size-2.5" /> Therm
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Vehicles tab ---- */}
        <TabsContent value="vehicles" className="mt-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fuel</TableHead>
                    <TableHead className="hidden md:table-cell">Speed</TableHead>
                    <TableHead className="hidden lg:table-cell">GPS</TableHead>
                    <TableHead className="hidden lg:table-cell">Route</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">{v.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs capitalize">{v.type}</TableCell>
                      <TableCell className="font-mono text-xs">{v.plate}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[v.status] ?? 'outline'} className="text-[10px] capitalize">{v.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={v.fuelLevel} className="h-2 w-16" />
                          <span className="text-[11px] font-mono">{v.fuelLevel}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{v.speed} km/h &middot; {v.heading}°</TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-[10px]">
                        {v.gpsLat.toFixed(4)}, {v.gpsLng.toFixed(4)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs max-w-[120px] truncate">
                        {v.route ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Wearables tab ---- */}
        <TabsContent value="wearables" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wearables.map((w) => (
              <Card key={w.id} className={w.sosTriggered ? 'border-red-500/50 shadow-red-500/10' : ''}>
                {w.sosTriggered && <div className="h-1 bg-red-500 animate-pulse" />}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {w.sosTriggered && <AlertTriangle className="size-4 text-red-500 animate-pulse" />}
                      <CardTitle className="text-sm">{w.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={w.sosTriggered ? 'destructive' : STATUS_BADGE[w.status] ?? 'outline'} className="text-[10px]">
                        {w.sosTriggered ? 'SOS' : w.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Badge variant="outline" className="text-[10px] capitalize">{w.type}</Badge>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground"><Battery className="size-3" /> Battery</span>
                      <span className="font-mono text-[11px]">{w.battery}%</span>
                    </div>
                    <Progress value={w.battery} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="text-red-400 size-3" />
                      <span>{w.heartRate != null ? `${w.heartRate} bpm` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Thermometer className="text-amber-400 size-3" />
                      <span>{w.temperature != null ? `${w.temperature}°C` : '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---- Incidents tab ---- */}
        <TabsContent value="incidents" className="mt-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VIP</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden lg:table-cell">Response</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((inc) => {
                    const profile = profiles.find((p) => p.id === inc.vipProfileId);
                    return (
                      <TableRow key={inc.id}>
                        <TableCell className="font-medium text-sm">{profile?.name ?? '—'}</TableCell>
                        <TableCell className="text-xs capitalize">{inc.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${SEVERITY_STYLES[inc.severity]}`}>
                            {inc.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate text-xs">
                          {inc.description}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[150px] truncate text-xs">
                          {inc.response ?? '—'}
                        </TableCell>
                        <TableCell>
                          {inc.resolved
                            ? <Badge variant="default" className="gap-1 text-[10px]"><CheckCircle2 className="size-2.5" /> Resolved</Badge>
                            : <Badge variant="destructive" className="gap-1 text-[10px]"><XCircle className="size-2.5" /> Open</Badge>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-[11px]">
                          {new Date(inc.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Emergency Response Section ────────────────────────────── */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-500">
            <Siren className="h-4 w-4" /> Emergency Response
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Critical response actions for VIP protection scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="destructive"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => iRefetch()}
            >
              <Radio className="h-6 w-6 animate-pulse" />
              <span className="text-xs font-semibold">Activate SOS Protocol</span>
              <span className="text-[10px] opacity-70">Trigger all emergency channels</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-amber-500/30 hover:bg-amber-500/10"
              onClick={() => vRefetch()}
            >
              <Lock className="h-6 w-6 text-amber-500" />
              <span className="text-xs font-semibold">Lock Down Facility</span>
              <span className="text-[10px] opacity-70">Secure all access points</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 border-sky-500/30 hover:bg-sky-500/10"
              onClick={() => dRefetch()}
            >
              <Truck className="h-6 w-6 text-sky-500" />
              <span className="text-xs font-semibold">Evacuate Principal</span>
              <span className="text-[10px] opacity-70">Initiate extraction route</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Incident Summary ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: incidentSummary.total, icon: AlertTriangle, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Resolved', value: incidentSummary.resolved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'In Progress', value: incidentSummary.inProgress, icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Critical', value: incidentSummary.critical, icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex items-center justify-center rounded-lg p-2.5 ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Patrol Route History ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Route className="h-4 w-4 text-sky-500" /> Patrol Route History
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Recent route changes with before/after locations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">VIP</TableHead>
                  <TableHead className="text-xs">From</TableHead>
                  <TableHead className="text-xs" />
                  <TableHead className="text-xs">To</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Distance</TableHead>
                  <TableHead className="text-xs font-mono">Time</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrolHistory.map((route) => {
                  const statusBg = route.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : route.status === 'in_progress'
                    ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                    : 'bg-red-500/10 text-red-600 border-red-500/20';
                  return (
                    <TableRow key={route.id}>
                      <TableCell className="text-xs font-medium">{route.principal}</TableCell>
                      <TableCell className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{route.from}</TableCell>
                      <TableCell><ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-1" /></TableCell>
                      <TableCell className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{route.to}</TableCell>
                      <TableCell className="text-xs font-mono hidden sm:table-cell">{route.distance}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">{route.time}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize border ${statusBg}`}>{route.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Wearable Health Monitor ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" /> Wearable Health Monitor
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Real-time heart rate and temperature readings from active wearables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthData.map(({ wearable, hrData, tempData }) => (
            <div key={wearable.id} className={`p-3 rounded-lg border ${wearable.sosTriggered ? 'border-red-500/50 bg-red-500/5' : 'border-border/50 bg-muted/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Watch className="size-3.5 text-violet-500" />
                  <span className="text-xs font-medium">{wearable.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{wearable.type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-red-400">
                    <Heart className="size-3" />
                    {wearable.heartRate != null ? `${hrData[hrData.length - 1]?.toFixed(0) || wearable.heartRate} bpm` : '—'}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Thermometer className="size-3" />
                    {wearable.temperature != null ? `${tempData[tempData.length - 1]?.toFixed(1) || wearable.temperature}°C` : '—'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Heart Rate (24h)</p>
                  <div className="h-12 bg-muted/50 rounded overflow-hidden flex items-end gap-px px-1">
                    {hrData.length > 0 ? hrData.map((hr, i) => {
                      const h = Math.max(4, ((hr - 50) / 80) * 48);
                      return <div key={i} className="flex-1 bg-red-400/60 rounded-t" style={{ height: `${h}px` }} />;
                    }) : <div className="w-full flex items-center justify-center text-[10px] text-muted-foreground">No data</div>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Temperature (24h)</p>
                  <div className="h-12 bg-muted/50 rounded overflow-hidden flex items-end gap-px px-1">
                    {tempData.length > 0 ? tempData.map((temp, i) => {
                      const h = Math.max(4, ((temp - 35) / 4) * 48);
                      return <div key={i} className="flex-1 bg-amber-400/60 rounded-t" style={{ height: `${h}px` }} />;
                    }) : <div className="w-full flex items-center justify-center text-[10px] text-muted-foreground">No data</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {healthData.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No wearable health data available</p>
          )}
        </CardContent>
      </Card>

      {/* ─── Convoy Management ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-500" /> Convoy Management
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Active vehicle positions and convoy status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
          {/* Mini-map grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(100,100,100,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Compass indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-background/80 border border-border/50">
            <Activity className="size-3 text-muted-foreground" />
            <span className="text-[10px] font-mono">LIVE</span>
          </div>
          {/* Vehicle markers */}
          {vehicles.filter(v => v.status === 'active').map((v, idx) => {
            const x = 15 + ((v.gpsLng + 180) / 360) * 70;
            const y = 15 + ((90 - v.gpsLat) / 180) * 70;
            return (
              <div
                key={v.id}
                className="absolute flex flex-col items-center"
                style={{ left: `${Math.min(85, Math.max(5, x))}%`, top: `${Math.min(85, Math.max(5, y))}%` }}
              >
                <div className="relative">
                  <Car className="size-5 text-emerald-500" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[9px] font-medium bg-background/90 px-1 rounded mt-0.5 max-w-[80px] truncate">{v.name}</span>
                <span className="text-[8px] text-muted-foreground">{v.speed} km/h</span>
              </div>
            );
          })}
          {vehicles.filter(v => v.status === 'active').length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No active vehicles</div>
          )}
        </div>
        </CardContent>
      </Card>

      {/* ─── Response Protocol ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Response Protocol
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Standard incident response phases for VIP protection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
            {protocolSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isLast = idx === protocolSteps.length - 1;
              const statusBorder = step.status === 'completed'
                ? 'border-emerald-500 bg-emerald-500/10'
                : step.status === 'in_progress'
                ? 'border-sky-500 bg-sky-500/10 animate-pulse'
                : 'border-slate-300 bg-slate-50';
              return (
                <div key={step.name} className="flex items-center gap-3 sm:gap-0 flex-1 w-full sm:w-auto">
                  <div className="flex flex-col items-center gap-2 flex-1 sm:flex-none">
                    <div className={`flex items-center justify-center rounded-full border-2 size-14 ${statusBorder} transition-colors`}>
                      <StepIcon className={`size-6 ${step.status === 'pending' ? 'text-slate-400' : step.status === 'in_progress' ? 'text-sky-500' : 'text-emerald-500'}`} />
                    </div>
                    <p className="text-xs font-semibold text-center">{step.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center max-w-[130px] leading-tight">{step.description}</p>
                    <Badge variant="outline" className={`text-[9px] capitalize border ${
                      step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : step.status === 'in_progress' ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {step.status}
                    </Badge>
                  </div>
                  {!isLast && (
                    <div className={`hidden sm:block h-0.5 w-12 my-6 ${idx < 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}