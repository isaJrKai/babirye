"use client";

import { lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useAppStore } from "@/stores/app-store";

const DashboardPage = lazy(() => import("@/views/dashboard-page"));
const AgentsPage = lazy(() => import("@/views/agents-page"));
const TasksPage = lazy(() => import("@/views/tasks-page"));
const WallPage = lazy(() => import("@/views/wall-page"));
const CouncilPage = lazy(() => import("@/views/council-page"));
const ForensicPage = lazy(() => import("@/views/forensic-page"));
const OffensivePage = lazy(() => import("@/views/offensive-page"));
const DefensivePage = lazy(() => import("@/views/defensive-page"));
const MicroDefensivePage = lazy(() => import("@/views/micro-defensive-page"));
const SensorsPage = lazy(() => import("@/views/sensors-page"));
const VipPage = lazy(() => import("@/views/vip-page"));
const PotentialsPage = lazy(() => import("@/views/potentials-page"));
const AlertsPage = lazy(() => import("@/views/alerts-page"));
const AuditPage = lazy(() => import("@/views/audit-page"));
const ReportsPage = lazy(() => import("@/views/reports-page"));
const IntelPage = lazy(() => import("@/views/intel-page"));
const WeaponsPage = lazy(() => import("@/views/weapons-page"));
const GatewaysPage = lazy(() => import("@/views/gateways-page"));
const ConstitutionsPage = lazy(() => import("@/views/constitutions-page"));
const SettingsPage = lazy(() => import("@/views/settings-page"));

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
