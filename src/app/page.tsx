"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  AlertTriangle,
  Bot,
  Lock,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  Server,
  Globe,
  Cpu,
  Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const statCards = [
  {
    title: "Active Agents",
    value: "24",
    change: "+3",
    trend: "up" as const,
    icon: Bot,
    color: "emerald",
  },
  {
    title: "Threats Blocked",
    value: "1,847",
    change: "+12.5%",
    trend: "up" as const,
    icon: Shield,
    color: "emerald",
  },
  {
    title: "Active Alerts",
    value: "5",
    change: "-2",
    trend: "down" as const,
    icon: AlertTriangle,
    color: "red",
  },
  {
    title: "Sensors Online",
    value: "38/46",
    change: "82.6%",
    trend: "up" as const,
    icon: Radio,
    color: "amber",
  },
];

const recentActivity = [
  {
    time: "14:23:07",
    event: "Perimeter scan completed — Zone 7 clean",
    type: "success" as const,
  },
  {
    time: "14:21:45",
    event: "Agent ALPHA-7 reported anomalous traffic pattern",
    type: "warning" as const,
  },
  {
    time: "14:19:32",
    event: "Firewall rule updated — blocked IP range 192.168.x.x",
    type: "info" as const,
  },
  {
    time: "14:17:11",
    event: "DDoS mitigation activated — 2.4 Gbps absorbed",
    type: "critical" as const,
  },
  {
    time: "14:15:03",
    event: "VIP protection status: all principals secure",
    type: "success" as const,
  },
  {
    time: "14:12:58",
    event: "Intel feed synced — 47 new IOCs ingested",
    type: "info" as const,
  },
  {
    time: "14:10:22",
    event: "Self-attack wall integrity verified — 100%",
    type: "success" as const,
  },
  {
    time: "14:08:45",
    event: "Potential threat classified — LOW confidence",
    type: "warning" as const,
  },
];

const systemMetrics = [
  { label: "CPU Usage", value: 34, color: "bg-emerald-500" },
  { label: "Memory", value: 62, color: "bg-emerald-500" },
  { label: "Network I/O", value: 78, color: "bg-amber-500" },
  { label: "Disk", value: 45, color: "bg-emerald-500" },
  { label: "Agent Load", value: 56, color: "bg-emerald-500" },
];

const defenseLayers = [
  { name: "Perimeter Firewall", status: "active", load: 23 },
  { name: "IDS/IPS Layer", status: "active", load: 67 },
  { name: "Application WAF", status: "active", load: 41 },
  { name: "Micro-Segmentation", status: "active", load: 12 },
  { name: "Endpoint Protection", status: "degraded", load: 89 },
  { name: "Self-Attack Wall", status: "active", load: 8 },
];

function Dashboard() {
  const { currentPage } = useAppStore();

  if (currentPage !== "dashboard") {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-wider text-foreground">
              {currentPage
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              Module initializing...
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
              <span className="text-xs text-primary font-mono">STANDBY</span>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Page Title */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Operations Dashboard
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              Real-time security posture overview — All systems nominal
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
          >
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </Badge>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              emerald:
                "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
              red: "border-red-500/20 bg-red-500/5 text-red-400",
              amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
            };
            return (
              <Card
                key={stat.title}
                className={cn(
                  "border border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30",
                  "dark:bg-card/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold font-mono text-foreground tabular-nums">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border",
                        colorClasses[stat.color]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-emerald-400" />
                    )}
                    <span className="text-xs font-mono text-emerald-400">
                      {stat.change}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      from last cycle
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity Feed */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm dark:bg-card/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Live Activity Feed
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-primary/30 text-primary"
                  >
                    STREAMING
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[340px]">
                  <div className="px-4 pb-4 space-y-1">
                    {recentActivity.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
                      >
                        <span className="text-[11px] font-mono text-muted-foreground tabular-nums pt-0.5 shrink-0 w-14">
                          {log.time}
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 rounded-full shrink-0",
                            log.type === "success" && "bg-emerald-500",
                            log.type === "warning" && "bg-amber-500",
                            log.type === "critical" && "bg-red-500",
                            log.type === "info" && "bg-blue-500",
                            log.type === "critical" && "animate-pulse-dot"
                          )}
                        />
                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                          {log.event}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div variants={item} className="space-y-4">
            {/* System Metrics */}
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm dark:bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {metric.label}
                      </span>
                      <span className="text-xs font-mono text-foreground tabular-nums">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          metric.color,
                          metric.value > 75 && "bg-amber-500",
                          metric.value > 90 && "bg-red-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm dark:bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Network Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Inbound Traffic", value: "1.2 Gbps", icon: ArrowDownRight },
                  { label: "Outbound Traffic", value: "847 Mbps", icon: ArrowUpRight },
                  { label: "Connections", value: "14,293", icon: Wifi },
                  { label: "Blocked IPs", value: "2,847", icon: Lock },
                ].map((net) => {
                  const Icon = net.icon;
                  return (
                    <div
                      key={net.label}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {net.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-foreground tabular-nums">
                        {net.value}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Defense Layers */}
        <motion.div variants={item}>
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm dark:bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Defense Layers Status
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-emerald-500/30 text-emerald-400"
                >
                  5/6 ACTIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {defenseLayers.map((layer, idx) => (
                  <motion.div
                    key={layer.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      layer.status === "active"
                        ? "border-border/50 bg-muted/20 hover:border-emerald-500/30"
                        : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                    )}
                  >
                    <div
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-md border shrink-0",
                        layer.status === "active"
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-amber-500/30 bg-amber-500/10"
                      )}
                    >
                      <Shield
                        className={cn(
                          "h-4 w-4",
                          layer.status === "active"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}
                      />
                      {layer.status === "active" && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {layer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              layer.load > 80
                                ? "bg-red-500"
                                : layer.load > 60
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            )}
                            style={{ width: `${layer.load}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-7 text-right">
                          {layer.load}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Bar */}
        <motion.div
          variants={item}
          className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/60 pt-2 pb-4"
        >
          <span>BABIRYE v10.0.0 — Security Operations Platform</span>
          <span>Encryption: AES-256-GCM | Uptime: 99.97% | Clearance Required: CL-3+</span>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function Home() {
  return <Dashboard />;
}