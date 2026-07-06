/**
 * BABIRYE v10.0.0 — Comprehensive Typed API Client
 *
 * Centralised, fully-typed client for every API endpoint.
 * Thin wrapper around api-helpers that provides domain-specific
 * method signatures and request/response types.
 *
 * Usage:
 *   import { babiryeApi } from '@/lib/api-client';
 *   const agents = await babiryeApi.getAgents();
 */

'use client';

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from './api-helpers';
import type {
  User,
  UserWithSecurity,
  LoginResponse,
  Agent,
  Task,
  PaginatedResponse,
  WallGuard,
  WallBlock,
  CouncilDomain,
  CouncilDecision,
  ForensicTool,
  OffensiveTool,
  DefensiveTool,
  MicroDefensiveTool,
  Sensor,
  SensorReading,
  VipProfile,
  VipDrone,
  VipVehicle,
  VipWearable,
  VipIncident,
  Potential,
  SecurityAlert,
  AuditLog,
  SystemSetting,
  Report,
  IntelligenceFeed,
  IntelItem,
  Weapon,
  MartialArt,
  SpaGateway,
  Constitution,
  DashboardStats,
  Notification,
} from './types';

// ============================================================================
// API Client Class
// ============================================================================

class BabiryeApiClient {
  // ==========================================================================
  // Auth
  // ==========================================================================

  /** Authenticate with email + password. */
  login(email: string, password: string): Promise<LoginResponse> {
    return apiPost<LoginResponse>('/auth/login', { email, password });
  }

  /** Terminate the current session. */
  logout(): Promise<void> {
    return apiPost<void>('/auth/logout');
  }

  /** Fetch the currently authenticated user. */
  getMe(): Promise<User> {
    return apiGet<User>('/auth/me');
  }

  /** List all users with security metadata. */
  getUsers(): Promise<UserWithSecurity[]> {
    return apiGet<UserWithSecurity[]>('/auth/users');
  }

  /** First-time setup: create admin user and return session. */
  setup(name: string, email: string, password: string): Promise<LoginResponse> {
    return apiPost<LoginResponse>('/auth/setup', { name, email, password });
  }

  // ==========================================================================
  // Agents
  // ==========================================================================

  /** List agents, optionally filtered by status. */
  getAgents(status?: string): Promise<{ agents: Agent[]; total: number }> {
    return apiGet<{ agents: Agent[]; total: number }>('/agents', { status } as Record<string, string>);
  }

  /** Fetch a single agent by ID. */
  getAgent(id: string): Promise<Agent> {
    return apiGet<Agent>(`/agents/${id}`);
  }

  /** Create a new agent. */
  createAgent(data: Record<string, unknown>): Promise<Agent> {
    return apiPost<Agent>('/agents', data);
  }

  /** Update an existing agent. */
  updateAgent(id: string, data: Record<string, unknown>): Promise<Agent> {
    return apiPut<Agent>(`/agents/${id}`, data);
  }

  /** Delete an agent by ID. */
  deleteAgent(id: string): Promise<void> {
    return apiDelete(`/agents/${id}`);
  }

  // ==========================================================================
  // Tasks
  // ==========================================================================

  /** List tasks with optional filters (status, type, page, limit, etc.). */
  getTasks(filters?: Record<string, unknown>): Promise<PaginatedResponse<Task>> {
    return apiGet<PaginatedResponse<Task>>('/tasks', filters as Record<string, string | number | boolean>);
  }

  /** Fetch a single task by ID. */
  getTask(id: string): Promise<Task> {
    return apiGet<Task>(`/tasks/${id}`);
  }

  /** Create a new task. */
  createTask(data: Record<string, unknown>): Promise<Task> {
    return apiPost<Task>('/tasks', data);
  }

  /** Update an existing task. */
  updateTask(id: string, data: Record<string, unknown>): Promise<Task> {
    return apiPut<Task>(`/tasks/${id}`, data);
  }

  /** Delete a task by ID. */
  deleteTask(id: string): Promise<void> {
    return apiDelete(`/tasks/${id}`);
  }

  // ==========================================================================
  // Wall Guards
  // ==========================================================================

  /** List all wall guards. */
  getWallGuards(): Promise<WallGuard[]> {
    return apiGet<WallGuard[]>('/wall/guards');
  }

  /** Get wall guard aggregate statistics. */
  getWallStats(): Promise<Record<string, unknown>> {
    return apiGet<Record<string, unknown>>('/wall/stats');
  }

  /** List wall block events with optional filters. */
  getWallBlocks(filters?: Record<string, unknown>): Promise<PaginatedResponse<WallBlock>> {
    return apiGet<PaginatedResponse<WallBlock>>('/wall/blocks', filters as Record<string, string | number | boolean>);
  }

  /** Test a wall guard against a sample payload. */
  testGuard(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiPost<Record<string, unknown>>('/wall/test', data);
  }

  /** Activate or deactivate a wall guard. */
  toggleGuard(id: string, active: boolean): Promise<WallGuard> {
    return apiPatch<WallGuard>(`/wall/guards/${id}`, { isActive: active });
  }

  // ==========================================================================
  // Council
  // ==========================================================================

  /** List all council domains (voting entities). */
  getCouncilDomains(): Promise<CouncilDomain[]> {
    return apiGet<CouncilDomain[]>('/council/domains');
  }

  /** Submit a query to the council for collective decision-making. */
  consultCouncil(query: string): Promise<CouncilDecision> {
    return apiPost<CouncilDecision>('/council/consult', { query });
  }

  /** Get the history of council decisions. */
  getCouncilHistory(): Promise<CouncilDecision[]> {
    return apiGet<CouncilDecision[]>('/council/history');
  }

  // ==========================================================================
  // Forensic Tools
  // ==========================================================================

  /** List forensic tools, optionally filtered by category. */
  getForensicTools(category?: string): Promise<ForensicTool[]> {
    return apiGet<ForensicTool[]>('/tools/forensic', category ? { category } : undefined);
  }

  /** Activate (deploy) a forensic tool instance. */
  activateTool(type: string, id: string): Promise<Record<string, unknown>> {
    return apiPost<Record<string, unknown>>(`/tools/${type}/${id}/activate`);
  }

  /** Deactivate a running tool instance. */
  deactivateTool(type: string, id: string): Promise<Record<string, unknown>> {
    return apiPost<Record<string, unknown>>(`/tools/${type}/${id}/deactivate`);
  }

  // ==========================================================================
  // Offensive Tools
  // ==========================================================================

  /** List offensive tools, optionally filtered by category. */
  getOffensiveTools(category?: string): Promise<OffensiveTool[]> {
    return apiGet<OffensiveTool[]>('/tools/offensive', category ? { category } : undefined);
  }

  // ==========================================================================
  // Defensive Tools
  // ==========================================================================

  /** List defensive tools, optionally filtered by category. */
  getDefensiveTools(category?: string): Promise<DefensiveTool[]> {
    return apiGet<DefensiveTool[]>('/tools/defensive', category ? { category } : undefined);
  }

  // ==========================================================================
  // Micro-Defensive Tools
  // ==========================================================================

  /** List micro-defensive tools, optionally filtered by category. */
  getMicroDefensiveTools(category?: string): Promise<MicroDefensiveTool[]> {
    return apiGet<MicroDefensiveTool[]>('/tools/micro-defensive', category ? { category } : undefined);
  }

  // ==========================================================================
  // Sensors
  // ==========================================================================

  /** List sensors, optionally filtered by type. */
  getSensors(type?: string): Promise<Sensor[]> {
    return apiGet<Sensor[]>('/sensors', type ? { type } : undefined);
  }

  /** Submit a new sensor reading. */
  createSensorReading(sensorId: string, value: number): Promise<SensorReading> {
    return apiPost<SensorReading>(`/sensors/${sensorId}/readings`, { value });
  }

  // ==========================================================================
  // VIP Protection
  // ==========================================================================

  /** List all VIP profiles. */
  getVipProfiles(): Promise<VipProfile[]> {
    return apiGet<VipProfile[]>('/vip/profiles');
  }

  /** Get drones for a specific VIP (or all if no ID). */
  getVipDrones(vipId?: string): Promise<VipDrone[]> {
    return apiGet<VipDrone[]>('/vip/drones', vipId ? { vipId } : undefined);
  }

  /** Get vehicles for a specific VIP (or all if no ID). */
  getVipVehicles(vipId?: string): Promise<VipVehicle[]> {
    return apiGet<VipVehicle[]>('/vip/vehicles', vipId ? { vipId } : undefined);
  }

  /** Get wearables for a specific VIP (or all if no ID). */
  getVipWearables(vipId?: string): Promise<VipWearable[]> {
    return apiGet<VipWearable[]>('/vip/wearables', vipId ? { vipId } : undefined);
  }

  /** Get incidents for a specific VIP (or all if no ID). */
  getVipIncidents(vipId?: string): Promise<VipIncident[]> {
    return apiGet<VipIncident[]>('/vip/incidents', vipId ? { vipId } : undefined);
  }

  /** Trigger an SOS emergency from a wearable device. */
  triggerSos(wearableId: string): Promise<void> {
    return apiPost<void>(`/vip/wearables/${wearableId}/sos`);
  }

  // ==========================================================================
  // Potentials / Scenarios
  // ==========================================================================

  /** List potential threats/scenarios with optional filters. */
  getPotentials(filters?: Record<string, unknown>): Promise<Potential[]> {
    return apiGet<Potential[]>('/potentials', filters as Record<string, string | number | boolean>);
  }

  /** Explore potentials using natural-language search. */
  explorePotentials(query: string): Promise<Potential[]> {
    return apiGet<Potential[]>('/potentials/explore', { query });
  }

  /** Get counts of potentials grouped by category. */
  getPotentialCategories(): Promise<Record<string, number>> {
    return apiGet<Record<string, number>>('/potentials/categories');
  }

  // ==========================================================================
  // Security Alerts
  // ==========================================================================

  /** List security alerts with optional filters. */
  getAlerts(filters?: Record<string, unknown>): Promise<PaginatedResponse<SecurityAlert>> {
    return apiGet<PaginatedResponse<SecurityAlert>>('/alerts', filters as Record<string, string | number | boolean>);
  }

  /** Get a summary/count of alerts grouped by severity. */
  getAlertSummary(): Promise<Record<string, unknown>> {
    return apiGet<Record<string, unknown>>('/alerts/summary');
  }

  /** Update an alert (change status, assign, resolve, etc.). */
  updateAlert(id: string, data: Record<string, unknown>): Promise<SecurityAlert> {
    return apiPatch<SecurityAlert>(`/alerts/${id}`, data);
  }

  /** Escalate an alert to a higher priority. */
  escalateAlert(id: string): Promise<SecurityAlert> {
    return apiPost<SecurityAlert>(`/alerts/${id}/escalate`);
  }

  // ==========================================================================
  // Audit Logs
  // ==========================================================================

  /** List audit log entries with optional filters. */
  getAuditLogs(filters?: Record<string, unknown>): Promise<AuditLog[]> {
    return apiGet<AuditLog[]>('/audit/logs', filters as Record<string, string | number | boolean>);
  }

  // ==========================================================================
  // System Settings
  // ==========================================================================

  /** List system settings, optionally filtered by category. */
  getSettings(category?: string): Promise<SystemSetting[]> {
    return apiGet<SystemSetting[]>('/settings', category ? { category } : undefined);
  }

  /** Update a single system setting by key. */
  updateSetting(key: string, value: unknown): Promise<SystemSetting> {
    return apiPut<SystemSetting>(`/settings/${key}`, { value });
  }

  // ==========================================================================
  // Reports
  // ==========================================================================

  /** List reports, optionally filtered by type. */
  getReports(type?: string): Promise<Report[]> {
    return apiGet<Report[]>('/reports', type ? { type } : undefined);
  }

  /** Generate (and persist) a report of the given type. */
  generateReport(type: string): Promise<Report> {
    return apiPost<Report>('/reports/generate', { type });
  }

  /** Delete a report by ID. */
  deleteReport(id: string): Promise<void> {
    return apiDelete(`/reports/${id}`);
  }

  // ==========================================================================
  // Intelligence
  // ==========================================================================

  /** List configured intelligence feeds. */
  getIntelFeeds(): Promise<IntelligenceFeed[]> {
    return apiGet<IntelligenceFeed[]>('/intel/feeds');
  }

  /** List intel items, optionally filtered by feed ID. */
  getIntelItems(feedId?: string): Promise<IntelItem[]> {
    return apiGet<IntelItem[]>('/intel/items', feedId ? { feedId } : undefined);
  }

  // ==========================================================================
  // Arsenal (Weapons & Martial Arts)
  // ==========================================================================

  /** List weapons, optionally filtered by category. */
  getWeapons(category?: string): Promise<Weapon[]> {
    return apiGet<Weapon[]>('/arsenal/weapons', category ? { category } : undefined);
  }

  /** Get martial arts reference data. */
  getMartialArts(): Promise<MartialArt> {
    return apiGet<MartialArt>('/arsenal/martial-arts');
  }

  // ==========================================================================
  // Constitutions
  // ==========================================================================

  /** Get constitutions, optionally filtered by subsystem. */
  getConstitutions(subsystem?: string): Promise<Constitution[]> {
    return apiGet<Constitution[]>('/constitutions', subsystem ? { subsystem } : undefined);
  }

  /** Update the content of a specific constitution. */
  updateConstitution(id: string, content: string): Promise<Constitution> {
    return apiPut<Constitution>(`/constitutions/${id}`, { content });
  }

  // ==========================================================================
  // SPA Gateways
  // ==========================================================================

  /** List all SPA gateways. */
  getGateways(): Promise<SpaGateway[]> {
    return apiGet<SpaGateway[]>('/gateways');
  }

  /** Get the aggregate status of all gateways. */
  getGatewayStatus(): Promise<Record<string, unknown>> {
    return apiGet<Record<string, unknown>>('/gateways/status');
  }

  /** Activate an SPA gateway. */
  activateGateway(id: string): Promise<SpaGateway> {
    return apiPost<SpaGateway>(`/gateways/${id}/activate`);
  }

  /** Deactivate an SPA gateway. */
  deactivateGateway(id: string): Promise<SpaGateway> {
    return apiPost<SpaGateway>(`/gateways/${id}/deactivate`);
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  /** Fetch the main dashboard statistics payload. */
  getDashboard(): Promise<DashboardStats> {
    return apiGet<DashboardStats>('/dashboard');
  }

  // ==========================================================================
  // Seed / Database
  // ==========================================================================

  /** Check the current seed status of the database. */
  getSeedStatus(): Promise<Record<string, unknown>> {
    return apiGet<Record<string, unknown>>('/seed/status');
  }

  /** Trigger database seeding with sample data. */
  seedDatabase(): Promise<Record<string, unknown>> {
    return apiPost<Record<string, unknown>>('/seed');
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /** List notifications, optionally filtered. */
  getNotifications(filters?: Record<string, unknown>): Promise<Notification[]> {
    return apiGet<Notification[]>('/notifications', filters as Record<string, string | number | boolean>);
  }

  /** Get the count of unread notifications. */
  getNotificationCount(): Promise<{ unread: number }> {
    return apiGet<{ unread: number }>('/notifications/count');
  }

  /** Mark a single notification as read. */
  markNotificationRead(id: string): Promise<void> {
    return apiPatch<void>(`/notifications/${id}`, { isRead: true });
  }

  /** Mark all notifications as read. Returns the count marked. */
  markAllNotificationsRead(): Promise<number> {
    return apiPost<number>('/notifications/read-all');
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Singleton API client instance. Import and use directly. */
export const babiryeApi = new BabiryeApiClient();

export default babiryeApi;