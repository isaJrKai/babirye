'use client';

import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/use-api';
import { SensorCoverageChart } from '@/components/charts/sensor-coverage-chart';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterOption } from '@/components/shared/filter-bar';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Radar,
  Radio,
  RadioTower,
  AudioLines,
  Satellite,
  Plus,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  X,
  MapPin,
  Signal,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SensorReading {
  id: string;
  value: number;
  unit: string | null;
  isAnomaly: boolean;
  anomalyScore: number | null;
  createdAt: string;
}

interface Sensor {
  id: string;
  name: string;
  type: 'radar' | 'sonar' | 'lidar' | 'acoustic' | 'ew';
  subtype: string | null;
  description: string;
  status: 'online' | 'offline' | 'maintenance';
  location: string | null;
  range: number | null;
  frequency: string | null;
  sensitivity: number;
  latestReading: SensorReading | null;
  createdAt: string;
  updatedAt: string;
}

const SENSOR_TYPES = ['radar', 'sonar', 'lidar', 'acoustic', 'ew'] as const;
const TYPE_ICONS: Record<string, React.ReactNode> = {
  radar: <Radar className="size-4" />,
  sonar: <Radio className="size-4" />,
  lidar: <RadioTower className="size-4" />,
  acoustic: <AudioLines className="size-4" />,
  ew: <Satellite className="size-4" />,
};
const TYPE_COLORS: Record<string, string> = {
  radar: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
  sonar: 'text-violet-500 bg-violet-500/10 border-violet-500/30',
  lidar: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  acoustic: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  ew: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
};

/* Mock reading history for the detail panel */
function generateMockHistory(current: number | null, points = 20) {
  const base = current ?? 0;
  return Array.from({ length: points }, (_, i) => ({
    time: `${i}m`,
    value: base + (Math.random() - 0.5) * base * 0.2,
  }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function SensorsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('babirye_token') : null;
  const { data, loading, error, refetch, post } = useApi<{ sensors: Sensor[]; total: number }>(
    '/api/sensors',
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );

  const [typeFilter, setTypeFilter] = useState('all');
  const [sensorSearch, setSensorSearch] = useState('');
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const sensors = data?.sensors ?? [];

  /* Summary stats */
  const stats = useMemo(() => {
    const online = sensors.filter((s) => s.status === 'online').length;
    const offline = sensors.filter((s) => s.status === 'offline').length;
    const anomalies = sensors.filter((s) => s.latestReading?.isAnomaly).length;
    return { total: sensors.length, online, offline, anomalies };
  }, [sensors]);

  /* Filtered sensors */
  const filtered = useMemo(() => {
    let result = sensors;
    if (typeFilter === 'all') result = sensors;
    else result = sensors.filter((s) => s.type === typeFilter);
    if (sensorSearch.trim()) {
      const q = sensorSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [sensors, typeFilter, sensorSearch]);

  /* Type counts for tab badges */
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sensors.length };
    for (const t of SENSOR_TYPES) counts[t] = 0;
    for (const s of sensors) {
      if (s.type in counts) counts[s.type]++;
    }
    return counts;
  }, [sensors]);

  /* Add sensor handler */
  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body: Record<string, unknown> = {
      name: (form.elements.namedItem('name') as HTMLInputElement)?.value,
      type: (form.elements.namedItem('type') as HTMLSelectElement)?.value,
      subtype: (form.elements.namedItem('subtype') as HTMLInputElement)?.value || null,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement)?.value,
      config: {},
      location: (form.elements.namedItem('location') as HTMLInputElement)?.value || null,
      range: parseFloat((form.elements.namedItem('range') as HTMLInputElement)?.value) || null,
      frequency: (form.elements.namedItem('frequency') as HTMLInputElement)?.value || null,
      sensitivity: parseFloat((form.elements.namedItem('sensitivity') as HTMLInputElement)?.value) || 0.5,
    };
    try {
      await post('/api/sensors', body);
      setAddOpen(false);
      form.reset();
      refetch();
    } catch {
      /* handled by hook */
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Radar className="size-12 text-destructive" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 flex size-10 items-center justify-center rounded-lg">
            <Radar className="text-cyan-500 size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sensor Network</h1>
            <p className="text-muted-foreground text-sm">{stats.total} sensors deployed</p>
          </div>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5" size="sm">
              <Plus className="size-4" /> Add Sensor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAdd} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add New Sensor</DialogTitle>
                <DialogDescription>Deploy a new sensor to the network.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Radar-Alpha-01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="radar">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SENSOR_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtype">Subtype</Label>
                  <Input id="subtype" name="subtype" placeholder="e.g. X-Band" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g. North Perimeter" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input id="frequency" name="frequency" placeholder="e.g. 2.4 GHz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range">Range (m)</Label>
                  <Input id="range" name="range" type="number" step="any" placeholder="e.g. 500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Sensitivity: 0.5</Label>
                <Slider name="sensitivity" defaultValue={[0.5]} min={0} max={1} step={0.01} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Sensor purpose and configuration..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Deploy Sensor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Sensors', value: stats.total, icon: <Signal className="size-4" />, color: 'text-foreground' },
          { label: 'Online', value: stats.online, icon: <Wifi className="size-4" />, color: 'text-emerald-500' },
          { label: 'Offline', value: stats.offline, icon: <WifiOff className="size-4" />, color: 'text-red-500' },
          { label: 'Anomalies', value: stats.anomalies, icon: <AlertTriangle className="size-4" />, color: 'text-amber-500' },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="flex items-center gap-3">
              <div className={`flex items-center justify-center rounded-lg bg-muted p-2 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sensor Coverage Chart */}
      <SensorCoverageChart />

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <SearchBar placeholder="Search sensors by name..." onChange={(v) => setSensorSearch(v)} value={sensorSearch} className="max-w-sm w-full" />
        <FilterBar
          filters={[
            { key: 'type', label: 'Sensor Type', options: SENSOR_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
          ]}
          values={{ type: typeFilter }}
          onChange={(vals) => setTypeFilter(vals.type || 'all')}
          className="flex-1"
        />
      </div>

      {/* Type filter */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="flex-wrap h-auto gap-1 bg-background p-1">
          <TabsTrigger value="all" className="text-xs">All ({typeCounts.all})</TabsTrigger>
          {SENSOR_TYPES.map((t) => (
            <TabsTrigger key={t} value={t} className="gap-1 capitalize text-xs">
              {TYPE_ICONS[t]} {t} ({typeCounts[t]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Sensor grid + detail panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((sensor) => (
              <motion.div
                key={sensor.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`cursor-pointer transition-shadow hover:shadow-md ${selectedSensor?.id === sensor.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedSensor(sensor)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Animated status dot */}
                        <span className="relative flex size-2.5">
                          {sensor.status === 'online' && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span
                            className={`relative inline-flex size-2.5 rounded-full ${
                              sensor.status === 'online'
                                ? 'bg-emerald-500'
                                : sensor.status === 'maintenance'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                          />
                        </span>
                        <CardTitle className="text-sm">{sensor.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-[10px] capitalize ${TYPE_COLORS[sensor.type]}`}>
                        {sensor.type}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1 text-xs">{sensor.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {sensor.location ?? 'No location'}
                      </span>
                      {sensor.frequency && <span>{sensor.frequency}</span>}
                    </div>

                    {sensor.latestReading && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">Latest:</span>
                          <span className={`font-mono text-sm font-medium ${sensor.latestReading.isAnomaly ? 'text-red-500' : ''}`}>
                            {sensor.latestReading.value} {sensor.latestReading.unit || ''}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Sensitivity</span>
                        <span className="font-mono">{sensor.sensitivity.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${sensor.sensitivity * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedSensor && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-1.5 ${TYPE_COLORS[selectedSensor.type]}`}>
                        {TYPE_ICONS[selectedSensor.type]}
                      </div>
                      <div>
                        <CardTitle className="text-base">{selectedSensor.name}</CardTitle>
                        <CardDescription className="capitalize text-xs">{selectedSensor.type} sensor</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedSensor(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className="mt-0.5 capitalize font-medium">{selectedSensor.status}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location</span>
                      <p className="mt-0.5 font-medium">{selectedSensor.location ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency</span>
                      <p className="mt-0.5 font-medium">{selectedSensor.frequency ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Range</span>
                      <p className="mt-0.5 font-medium">{selectedSensor.range != null ? `${selectedSensor.range}m` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sensitivity</span>
                      <p className="mt-0.5 font-mono font-medium">{selectedSensor.sensitivity.toFixed(2)}</p>
                    </div>
                    {selectedSensor.latestReading && (
                      <div>
                        <span className="text-muted-foreground">Anomaly</span>
                        <p className={`mt-0.5 font-medium ${selectedSensor.latestReading.isAnomaly ? 'text-red-500' : 'text-emerald-500'}`}>
                          {selectedSensor.latestReading.isAnomaly ? 'Detected' : 'Clear'}
                          {selectedSensor.latestReading.anomalyScore != null && ` (${selectedSensor.latestReading.anomalyScore.toFixed(2)})`}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Mini reading history chart */}
                  <div>
                    <p className="mb-2 text-xs font-medium">Reading History (simulated)</p>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateMockHistory(selectedSensor.latestReading?.value ?? 0, 30)}>
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={40} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={selectedSensor.latestReading?.isAnomaly ? '#ef4444' : '#10b981'}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 1, stroke: selectedSensor.latestReading?.isAnomaly ? '#ef4444' : '#10b981', fill: 'hsl(var(--background))' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12">
          <Radar className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">No sensors found.</p>
        </div>
      )}
    </div>
  );
}