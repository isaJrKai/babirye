"use client";

import { lazy, Suspense, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/app-shell";

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
      <div className="h-8 w-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
    </div>
  );
}

// useSyncExternalStore to detect token in localStorage.
// On server (SSR): always returns "" — no hydration mismatch.
// On client: returns actual token or "".
// When token changes (via login/logout), storage event triggers re-render.
function getTokenSnapshot(): string {
  try { return localStorage.getItem("babirye_token") || ""; } catch { return ""; }
}
function subscribeToToken(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function Home() {
  const { currentPage } = useAppStore();
  // getTokenSnapshot is used for both server and client — no hydration mismatch possible
  const hasToken = useSyncExternalStore(subscribeToToken, getTokenSnapshot, getTokenSnapshot).length > 0;

  if (!hasToken) {
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