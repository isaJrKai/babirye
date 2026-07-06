"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { Shield, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/app-store";

const LoginPage = lazy(() => import("@/pages/login-page").then(m => ({ default: m.default })));
const DashboardPage = lazy(() => import("@/pages/dashboard-page").then(m => ({ default: m.default })));
const AgentsPage = lazy(() => import("@/pages/agents-page").then(m => ({ default: m.default })));
const TasksPage = lazy(() => import("@/pages/tasks-page").then(m => ({ default: m.default })));
const WallPage = lazy(() => import("@/pages/wall-page").then(m => ({ default: m.default })));
const CouncilPage = lazy(() => import("@/pages/council-page").then(m => ({ default: m.default })));
const ForensicPage = lazy(() => import("@/pages/forensic-page").then(m => ({ default: m.default })));
const OffensivePage = lazy(() => import("@/pages/offensive-page").then(m => ({ default: m.default })));
const DefensivePage = lazy(() => import("@/pages/defensive-page").then(m => ({ default: m.default })));
const MicroDefensivePage = lazy(() => import("@/pages/micro-defensive-page").then(m => ({ default: m.default })));
const SensorsPage = lazy(() => import("@/pages/sensors-page").then(m => ({ default: m.default })));
const VipPage = lazy(() => import("@/pages/vip-page").then(m => ({ default: m.default })));
const PotentialsPage = lazy(() => import("@/pages/potentials-page").then(m => ({ default: m.default })));
const AlertsPage = lazy(() => import("@/pages/alerts-page").then(m => ({ default: m.default })));
const AuditPage = lazy(() => import("@/pages/audit-page").then(m => ({ default: m.default })));
const ReportsPage = lazy(() => import("@/pages/reports-page").then(m => ({ default: m.default })));
const IntelPage = lazy(() => import("@/pages/intel-page").then(m => ({ default: m.default })));
const WeaponsPage = lazy(() => import("@/pages/weapons-page").then(m => ({ default: m.default })));
const GatewaysPage = lazy(() => import("@/pages/gateways-page").then(m => ({ default: m.default })));
const ConstitutionsPage = lazy(() => import("@/pages/constitutions-page").then(m => ({ default: m.default })));
const SettingsPage = lazy(() => import("@/pages/settings-page").then(m => ({ default: m.default })));

const PAGE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
  agents: AgentsPage,
  tasks: TasksPage,
  "self-attack-wall": WallPage,
  "expert-council": CouncilPage,
  forensic: ForensicPage,
  offensive: OffensivePage,
  defensive: DefensivePage,
  "micro-defensive": MicroDefensivePage,
  sensors: SensorsPage,
  "vip-protection": VipPage,
  potentials: PotentialsPage,
  alerts: AlertsPage,
  "audit-logs": AuditPage,
  reports: ReportsPage,
  "intel-feeds": IntelPage,
  "weapons-db": WeaponsPage,
  "martial-arts": WeaponsPage,
  constitutions: ConstitutionsPage,
  "spa-gateways": GatewaysPage,
  settings: SettingsPage,
};

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 text-primary/50 animate-spin" />
    </div>
  );
}

export default function Home() {
  const { currentPage } = useAppStore();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("babirye_token");
    if (!token) {
      requestAnimationFrame(() => setAuthenticated(false));
      return;
    }

    let cancelled = false;
    fetch("/api/auth?view=me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          res.json().then((u) => {
            if (cancelled) return;
            const store = useAppStore.getState();
            store.setUser({
              id: u.id as string,
              name: (u.name as string) || (u.email as string),
              email: u.email as string,
              role: u.role as string,
              clearanceLevel: (u.role as string) === "admin" ? 5 : (u.role as string) === "operator" ? 4 : 3,
            });
            setAuthenticated(true);
          });
        } else {
          localStorage.removeItem("babirye_token");
          setAuthenticated(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAuthenticated(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-primary/30 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground font-mono tracking-widest">AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  const PageComponent = PAGE_MAP[currentPage] || DashboardPage;

  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <PageComponent />
      </Suspense>
    </AppShell>
  );
}