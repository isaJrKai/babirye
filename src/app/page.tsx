"use client";

import { lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/app-store";

const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const AgentsPage = lazy(() => import("@/pages/agents-page"));
const TasksPage = lazy(() => import("@/pages/tasks-page"));
const WallPage = lazy(() => import("@/pages/wall-page"));
const CouncilPage = lazy(() => import("@/pages/council-page"));
const ForensicPage = lazy(() => import("@/pages/forensic-page"));
const OffensivePage = lazy(() => import("@/pages/offensive-page"));
const DefensivePage = lazy(() => import("@/pages/defensive-page"));
const MicroDefensivePage = lazy(() => import("@/pages/micro-defensive-page"));
const SensorsPage = lazy(() => import("@/pages/sensors-page"));
const VipPage = lazy(() => import("@/pages/vip-page"));
const PotentialsPage = lazy(() => import("@/pages/potentials-page"));
const AlertsPage = lazy(() => import("@/pages/alerts-page"));
const AuditPage = lazy(() => import("@/pages/audit-page"));
const ReportsPage = lazy(() => import("@/pages/reports-page"));
const IntelPage = lazy(() => import("@/pages/intel-page"));
const WeaponsPage = lazy(() => import("@/pages/weapons-page"));
const GatewaysPage = lazy(() => import("@/pages/gateways-page"));
const ConstitutionsPage = lazy(() => import("@/pages/constitutions-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));

const PAGE: Record<string, any> = {
  dashboard: DashboardPage, agents: AgentsPage, tasks: TasksPage,
  "self-attack-wall": WallPage, "expert-council": CouncilPage,
  forensic: ForensicPage, offensive: OffensivePage, defensive: DefensivePage,
  "micro-defensive": MicroDefensivePage, sensors: SensorsPage,
  "vip-protection": VipPage, potentials: PotentialsPage, alerts: AlertsPage,
  "audit-logs": AuditPage, reports: ReportsPage, "intel-feeds": IntelPage,
  "weapons-db": WeaponsPage, "martial-arts": WeaponsPage,
  constitutions: ConstitutionsPage, "spa-gateways": GatewaysPage, settings: SettingsPage,
};

function Spin() {
  return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-500 animate-spin rounded-full" /></div>;
}

export default function Home() {
  const { currentPage } = useAppStore();
  const P = PAGE[currentPage] || DashboardPage;
  return <AppShell><Suspense fallback={<Spin />}><P /></Suspense></AppShell>;
}
