/**
 * BABIRYE v10.0.0 — Role-Based Access Control (RBAC) Utilities
 *
 * Comprehensive permission system mapping roles to fine-grained capabilities.
 * Provides functions and React hooks for checking permissions at the
 * role, permission, and tool-specific action levels.
 *
 * Role Hierarchy (most privileged → least):
 *   admin > operator > analyst > viewer
 *
 * Permission Format: `resource:action` (e.g. `agents:manage`, `tasks:read`)
 */

'use client';

import { useCallback } from 'react';
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

// ============================================================================
// Types
// ============================================================================

/** A single permission in `resource:action` format. */
export type Permission = string;

/** A role name that maps to a set of permissions. */
export type Role = UserRole | string;

/** A capability represents a named permission with optional metadata. */
export interface Capability {
  /** The permission string in `resource:action` format. */
  permission: Permission;
  /** Human-readable description of what this permission allows. */
  description: string;
  /** The resource category this permission belongs to. */
  category: PermissionCategory;
}

/** Permission categories for grouping. */
export type PermissionCategory =
  | 'user_management'
  | 'system_config'
  | 'agents'
  | 'tasks'
  | 'tools'
  | 'sensors'
  | 'wall_guard'
  | 'vip'
  | 'alerts'
  | 'intel'
  | 'reports'
  | 'council'
  | 'audit'
  | 'settings'
  | 'dashboard';

/** Tool types that can be permission-gated. */
export type ToolType =
  | 'forensic'
  | 'offensive'
  | 'defensive'
  | 'micro_defensive'
  | 'sensor';

/** Actions that can be performed on tools. */
export type ToolAction = 'read' | 'deploy' | 'undeploy' | 'configure' | 'execute';

// ============================================================================
// Permission Definitions
// ============================================================================

/**
 * Complete mapping of every permission to its metadata.
 * Each permission is uniquely identified and categorized.
 */
export const PERMISSION_CATALOG: Record<Permission, Capability> = {
  // User Management
  'users:read':          { permission: 'users:read',          description: 'View user list and profiles',              category: 'user_management' },
  'users:create':        { permission: 'users:create',        description: 'Create new user accounts',                  category: 'user_management' },
  'users:update':        { permission: 'users:update',        description: 'Edit user profiles and settings',           category: 'user_management' },
  'users:delete':        { permission: 'users:delete',        description: 'Delete user accounts',                       category: 'user_management' },
  'users:manage_roles':  { permission: 'users:manage_roles',  description: 'Assign and change user roles',              category: 'user_management' },
  'users:manage_tokens': { permission: 'users:manage_tokens', description: 'Create, revoke, and manage API tokens',     category: 'user_management' },
  'users:lock_unlock':   { permission: 'users:lock_unlock',   description: 'Lock and unlock user accounts',             category: 'user_management' },

  // System Configuration
  'system:config':       { permission: 'system:config',       description: 'Modify system-wide configuration',         category: 'system_config' },
  'system:seed':         { permission: 'system:seed',         description: 'Seed or reset the database',                category: 'system_config' },
  'system:constitution': { permission: 'system:constitution', description: 'Edit system constitutions and policies',     category: 'system_config' },
  'system:spa_gateway':  { permission: 'system:spa_gateway',  description: 'Manage SPA gateways',                       category: 'system_config' },

  // Agents
  'agents:read':    { permission: 'agents:read',    description: 'View agent list and details',      category: 'agents' },
  'agents:create':  { permission: 'agents:create',  description: 'Create new agents',                category: 'agents' },
  'agents:update':  { permission: 'agents:update',  description: 'Edit agent configuration',          category: 'agents' },
  'agents:delete':  { permission: 'agents:delete',  description: 'Delete agents',                     category: 'agents' },
  'agents:execute': { permission: 'agents:execute', description: 'Execute agent tasks',               category: 'agents' },

  // Tasks
  'tasks:read':    { permission: 'tasks:read',    description: 'View tasks and results',             category: 'tasks' },
  'tasks:create':  { permission: 'tasks:create',  description: 'Create new tasks',                   category: 'tasks' },
  'tasks:update':  { permission: 'tasks:update',  description: 'Edit and update tasks',              category: 'tasks' },
  'tasks:delete':  { permission: 'tasks:delete',  description: 'Delete tasks',                       category: 'tasks' },
  'tasks:execute': { permission: 'tasks:execute', description: 'Execute and cancel tasks',           category: 'tasks' },

  // Tools (generic)
  'tools:read':      { permission: 'tools:read',      description: 'View tool catalog and status',            category: 'tools' },
  'tools:deploy':    { permission: 'tools:deploy',    description: 'Deploy tools to subsystems',             category: 'tools' },
  'tools:undeploy':  { permission: 'tools:undeploy',  description: 'Undeploy tools from subsystems',         category: 'tools' },
  'tools:configure': { permission: 'tools:configure', description: 'Configure tool settings and parameters',  category: 'tools' },
  'tools:execute':   { permission: 'tools:execute',   description: 'Execute tool operations',                category: 'tools' },

  // Sensors
  'sensors:read':    { permission: 'sensors:read',    description: 'View sensors and readings',            category: 'sensors' },
  'sensors:create':  { permission: 'sensors:create',  description: 'Register new sensors',                category: 'sensors' },
  'sensors:update':  { permission: 'sensors:update',  description: 'Update sensor configuration',         category: 'sensors' },
  'sensors:delete':  { permission: 'sensors:delete',  description: 'Remove sensors',                      category: 'sensors' },
  'sensors:manage':  { permission: 'sensors:manage',  description: 'Full sensor management',               category: 'sensors' },

  // Wall Guard
  'wall-guard:read':    { permission: 'wall-guard:read',    description: 'View wall guards and blocks',           category: 'wall_guard' },
  'wall-guard:create':  { permission: 'wall-guard:create',  description: 'Create wall guard rules',              category: 'wall_guard' },
  'wall-guard:update':  { permission: 'wall-guard:update',  description: 'Edit wall guard configuration',        category: 'wall_guard' },
  'wall-guard:delete':  { permission: 'wall-guard:delete',  description: 'Delete wall guards',                   category: 'wall_guard' },
  'wall-guard:manage':  { permission: 'wall-guard:manage',  description: 'Full wall guard management',           category: 'wall_guard' },
  'wall-guard:test':    { permission: 'wall-guard:test',    description: 'Test wall guards against payloads',    category: 'wall_guard' },

  // VIP Protection
  'vip:read':      { permission: 'vip:read',      description: 'View VIP profiles and assets',       category: 'vip' },
  'vip:create':    { permission: 'vip:create',    description: 'Create VIP profiles',               category: 'vip' },
  'vip:update':    { permission: 'vip:update',    description: 'Edit VIP profiles',                 category: 'vip' },
  'vip:delete':    { permission: 'vip:delete',    description: 'Delete VIP profiles',               category: 'vip' },
  'vip:manage':    { permission: 'vip:manage',    description: 'Full VIP management',                category: 'vip' },
  'vip:drone_ops': { permission: 'vip:drone_ops', description: 'Operate VIP drones',                 category: 'vip' },
  'vip:sos':       { permission: 'vip:sos',       description: 'Trigger and manage VIP SOS alerts',  category: 'vip' },

  // Alerts
  'alerts:read':      { permission: 'alerts:read',      description: 'View security alerts',               category: 'alerts' },
  'alerts:update':    { permission: 'alerts:update',    description: 'Update alert status and assignment', category: 'alerts' },
  'alerts:create':    { permission: 'alerts:create',    description: 'Create manual security alerts',     category: 'alerts' },
  'alerts:delete':    { permission: 'alerts:delete',    description: 'Delete alerts',                     category: 'alerts' },
  'alerts:manage':    { permission: 'alerts:manage',    description: 'Full alert management',             category: 'alerts' },
  'alerts:escalate':  { permission: 'alerts:escalate',  description: 'Escalate alerts',                   category: 'alerts' },

  // Intelligence
  'intel:read':      { permission: 'intel:read',      description: 'View intelligence feeds and items',      category: 'intel' },
  'intel:create':    { permission: 'intel:create',    description: 'Create intelligence feeds',             category: 'intel' },
  'intel:update':    { permission: 'intel:update',    description: 'Edit intelligence feeds',               category: 'intel' },
  'intel:delete':    { permission: 'intel:delete',    description: 'Delete intelligence feeds',             category: 'intel' },
  'intel:manage':    { permission: 'intel:manage',    description: 'Full intelligence management',         category: 'intel' },

  // Reports
  'reports:read':      { permission: 'reports:read',      description: 'View generated reports',              category: 'reports' },
  'reports:generate':  { permission: 'reports:generate',  description: 'Generate new reports',                category: 'reports' },
  'reports:delete':    { permission: 'reports:delete',    description: 'Delete reports',                       category: 'reports' },
  'reports:manage':    { permission: 'reports:manage',    description: 'Full report management',               category: 'reports' },

  // Council
  'council:read':       { permission: 'council:read',       description: 'View council domains and decisions',      category: 'council' },
  'council:consult':    { permission: 'council:consult',    description: 'Consult the expert council',             category: 'council' },
  'council:vote':       { permission: 'council:vote',       description: 'Cast votes in council decisions',        category: 'council' },
  'council:manage':     { permission: 'council:manage',     description: 'Manage council domains and weights',    category: 'council' },

  // Audit
  'audit:read':     { permission: 'audit:read',     description: 'View audit logs',                   category: 'audit' },
  'audit:export':   { permission: 'audit:export',   description: 'Export audit logs',                  category: 'audit' },
  'audit:manage':   { permission: 'audit:manage',   description: 'Manage audit log retention',       category: 'audit' },

  // Settings
  'settings:read':    { permission: 'settings:read',    description: 'View system settings',              category: 'settings' },
  'settings:update':  { permission: 'settings:update',  description: 'Modify system settings',            category: 'settings' },
  'settings:manage':  { permission: 'settings:manage',  description: 'Full settings management',          category: 'settings' },

  // Dashboard
  'dashboard:read':   { permission: 'dashboard:read',   description: 'View dashboard and statistics',      category: 'dashboard' },
  'dashboard:config': { permission: 'dashboard:config', description: 'Configure dashboard widgets',        category: 'dashboard' },
} as const;

// ============================================================================
// Role → Permission Mapping
// ============================================================================

/**
 * Maps each role to its complete set of permissions.
 *
 * - **admin**: Full access to all system capabilities including user management,
 *   system configuration, all tool operations, council consultation, and reports.
 * - **operator**: Tool deployment, task execution, VIP operations, council
 *   consultation, and report generation. No user or system management.
 * - **analyst**: Read-only data access, report generation, alert investigation,
 *   task creation, and council consultation.
 * - **viewer**: Read-only access to dashboards, reports, and data views.
 */
export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Wildcard represents full access — resolved at check time
    '*',
    // User management
    'users:read', 'users:create', 'users:update', 'users:delete',
    'users:manage_roles', 'users:manage_tokens', 'users:lock_unlock',
    // System configuration
    'system:config', 'system:seed', 'system:constitution', 'system:spa_gateway',
    // Agents
    'agents:read', 'agents:create', 'agents:update', 'agents:delete', 'agents:execute',
    // Tasks
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:execute',
    // Tools
    'tools:read', 'tools:deploy', 'tools:undeploy', 'tools:configure', 'tools:execute',
    // Sensors
    'sensors:read', 'sensors:create', 'sensors:update', 'sensors:delete', 'sensors:manage',
    // Wall Guard
    'wall-guard:read', 'wall-guard:create', 'wall-guard:update', 'wall-guard:delete',
    'wall-guard:manage', 'wall-guard:test',
    // VIP
    'vip:read', 'vip:create', 'vip:update', 'vip:delete', 'vip:manage', 'vip:drone_ops', 'vip:sos',
    // Alerts
    'alerts:read', 'alerts:update', 'alerts:create', 'alerts:delete', 'alerts:manage', 'alerts:escalate',
    // Intelligence
    'intel:read', 'intel:create', 'intel:update', 'intel:delete', 'intel:manage',
    // Reports
    'reports:read', 'reports:generate', 'reports:delete', 'reports:manage',
    // Council
    'council:read', 'council:consult', 'council:vote', 'council:manage',
    // Audit
    'audit:read', 'audit:export', 'audit:manage',
    // Settings
    'settings:read', 'settings:update', 'settings:manage',
    // Dashboard
    'dashboard:read', 'dashboard:config',
  ],

  operator: [
    // Agents
    'agents:read', 'agents:create', 'agents:update', 'agents:execute',
    // Tasks
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:execute',
    // Tools
    'tools:read', 'tools:deploy', 'tools:undeploy', 'tools:configure', 'tools:execute',
    // Sensors
    'sensors:read', 'sensors:manage',
    // Wall Guard
    'wall-guard:read', 'wall-guard:manage', 'wall-guard:test',
    // VIP
    'vip:read', 'vip:manage', 'vip:drone_ops', 'vip:sos',
    // Alerts
    'alerts:read', 'alerts:manage', 'alerts:escalate',
    // Intelligence
    'intel:read',
    // Reports
    'reports:read', 'reports:generate',
    // Council
    'council:read', 'council:consult',
    // Dashboard
    'dashboard:read',
  ],

  analyst: [
    // Agents
    'agents:read',
    // Tasks
    'tasks:read', 'tasks:create',
    // Tools
    'tools:read',
    // Sensors
    'sensors:read',
    // Wall Guard
    'wall-guard:read',
    // VIP
    'vip:read',
    // Alerts
    'alerts:read', 'alerts:update',
    // Intelligence
    'intel:read',
    // Reports
    'reports:read', 'reports:generate',
    // Council
    'council:read', 'council:consult',
    // Dashboard
    'dashboard:read',
  ],

  viewer: [
    // Read-only access
    'dashboard:read',
    'agents:read',
    'tasks:read',
    'tools:read',
    'sensors:read',
    'wall-guard:read',
    'vip:read',
    'alerts:read',
    'intel:read',
    'reports:read',
    'council:read',
    'audit:read',
  ],
};

/** Role hierarchy from most to least privileged. */
const ROLE_HIERARCHY: Role[] = ['admin', 'operator', 'analyst', 'viewer'];

// ============================================================================
// Core Permission Check Functions
// ============================================================================

/**
 * Check if a given role has a specific permission.
 *
 * The wildcard `*` permission (admin) grants all permissions.
 * Unknown roles and unknown permissions both return `false`.
 *
 * @param role       - The role to check
 * @param permission - The permission string in `resource:action` format
 * @returns `true` if the role has the permission
 */
export function hasPermission(role: string, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role];

  // Unknown role — no permissions
  if (!rolePermissions) {
    return false;
  }

  // Wildcard grants everything
  if (rolePermissions.includes('*')) {
    return true;
  }

  return rolePermissions.includes(permission as Permission);
}

/**
 * Check if a role has ALL of the specified permissions.
 *
 * @param role        - The role to check
 * @param permissions - Array of permissions that all must be granted
 * @returns `true` if the role has every permission listed
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 *
 * @param role        - The role to check
 * @param permissions - Array of permissions where at least one must be granted
 * @returns `true` if the role has at least one of the permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a given role.
 *
 * @param role - The role to get permissions for
 * @returns Array of permission strings (excludes wildcard `*`)
 */
export function getPermissionsForRole(role: string): Permission[] {
  const perms = PERMISSIONS[role];
  if (!perms) return [];
  return perms.filter((p) => p !== '*');
}

/**
 * Get all capabilities (permissions with metadata) for a given role.
 *
 * @param role - The role to get capabilities for
 * @returns Array of Capability objects
 */
export function getCapabilitiesForRole(role: string): Capability[] {
  const perms = getPermissionsForRole(role);
  return perms
    .map((p) => PERMISSION_CATALOG[p])
    .filter((c): c is Capability => c !== undefined);
}

// ============================================================================
// Tool-Specific Permission Checks
// ============================================================================

/**
 * Check if a role can perform a specific action on a tool type.
 *
 * Maps tool types and actions to the appropriate permission strings.
 *
 * @param role     - The user's role
 * @param toolType - The type of tool (forensic, offensive, defensive, etc.)
 * @param action   - The action to perform (read, deploy, undeploy, configure, execute)
 * @returns `true` if the action is permitted
 */
export function canAccessTool(role: string, toolType: string, action: string): boolean {
  // All tool permissions use the same pattern regardless of tool type
  // Tools are differentiated by API routes, not by individual permissions
  const toolActionMap: Record<string, Permission> = {
    read: 'tools:read',
    deploy: 'tools:deploy',
    undeploy: 'tools:undeploy',
    configure: 'tools:configure',
    execute: 'tools:execute',
  };

  // Map generic tool actions to permission strings
  const mappedPermission = toolActionMap[action];
  if (!mappedPermission) {
    return false;
  }

  return hasPermission(role, mappedPermission);
}

/**
 * Check tool-specific permissions with additional role-based restrictions.
 *
 * Some tool types have additional restrictions:
 * - Offensive tools require at least 'operator' role
 * - Micro-defensive configuration requires at least 'operator' role
 *
 * @param role     - The user's role
 * @param toolType - The type of tool
 * @param action   - The action to perform
 * @returns `true` if the action is permitted for this tool type
 */
export function canAccessToolWithRestrictions(
  role: string,
  toolType: ToolType,
  action: ToolAction
): boolean {
  // Check base tool permission first
  if (!canAccessTool(role, toolType, action)) {
    return false;
  }

  // Additional role-based restrictions
  const roleIndex = ROLE_HIERARCHY.indexOf(role as Role);
  if (roleIndex === -1) return false;

  // Offensive tools: minimum operator (index 1)
  if (toolType === 'offensive') {
    if (action !== 'read' && roleIndex > 1) {
      return false;
    }
  }

  // Micro-defensive: configure requires minimum operator
  if (toolType === 'micro_defensive' && action === 'configure') {
    if (roleIndex > 1) {
      return false;
    }
  }

  // Sensor management: create/delete requires minimum operator
  if (toolType === 'sensor' && (action === 'deploy' || action === 'undeploy')) {
    if (roleIndex > 1) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// User Management Permission Checks
// ============================================================================

/**
 * Check if a role can manage (create, edit, delete, change roles for) users.
 *
 * Only admin can manage users.
 *
 * @param role - The user's role
 * @returns `true` if the role can manage users
 */
export function canManageUser(role: string): boolean {
  return hasAllPermissions(role, [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
  ]);
}

/**
 * Check if a role can change another user's role assignment.
 *
 * @param role - The acting user's role
 * @returns `true` if the role can assign roles
 */
export function canChangeUserRole(role: string): boolean {
  return hasPermission(role, 'users:manage_roles');
}

/**
 * Check if a role can manage API tokens.
 *
 * @param role - The user's role
 * @returns `true` if the role can manage tokens
 */
export function canManageTokens(role: string): boolean {
  return hasPermission(role, 'users:manage_tokens');
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * React hook that checks if the current authenticated user has a specific permission.
 *
 * @param permission - The permission to check
 * @returns `true` if the current user has the permission, `false` otherwise
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();
  return useCallback(() => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user, permission])();
}

/**
 * React hook that checks if the current authenticated user has a specific role.
 *
 * @param requiredRole - The required role
 * @returns `true` if the current user has the role, `false` otherwise
 */
export function useRequireRole(requiredRole: Role): boolean {
  const { user } = useAuth();
  return useCallback(() => {
    if (!user) return false;
    if (user.role === requiredRole) return true;

    // Higher roles inherit lower role access
    const userIndex = ROLE_HIERARCHY.indexOf(user.role as Role);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userIndex >= 0 && requiredIndex >= 0 && userIndex <= requiredIndex;
  }, [user, requiredRole])();
}

/**
 * React hook for tool-specific permission checks.
 *
 * @param toolType - The type of tool
 * @param action   - The action to check
 * @returns `true` if the current user can access the tool
 */
export function useCanAccessTool(toolType: ToolType, action: ToolAction): boolean {
  const { user } = useAuth();
  return useCallback(() => {
    if (!user) return false;
    return canAccessToolWithRestrictions(user.role, toolType, action);
  }, [user, toolType, action])();
}

/**
 * React hook for user management permission check.
 *
 * @returns `true` if the current user can manage users
 */
export function useCanManageUser(): boolean {
  const { user } = useAuth();
  return useCallback(() => {
    if (!user) return false;
    return canManageUser(user.role);
  }, [user])();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the display label for a role.
 *
 * @param role - The role name
 * @returns Human-readable role label
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrator',
    operator: 'Operator',
    analyst: 'Analyst',
    viewer: 'Viewer',
  };
  return labels[role] ?? role;
}

/**
 * Get the display label for a permission.
 *
 * @param permission - The permission string
 * @returns Human-readable permission label or the raw permission string
 */
export function getPermissionLabel(permission: string): string {
  const capability = PERMISSION_CATALOG[permission as Permission];
  return capability?.description ?? permission;
}

/**
 * Group permissions by their category for display purposes.
 *
 * @param permissions - Array of permissions to group
 * @returns Record mapping category names to arrays of capabilities
 */
export function groupPermissionsByCategory(
  permissions: Permission[]
): Record<PermissionCategory, Capability[]> {
  const groups = {} as Record<PermissionCategory, Capability[]>;

  for (const perm of permissions) {
    const cap = PERMISSION_CATALOG[perm];
    if (cap) {
      if (!groups[cap.category]) {
        groups[cap.category] = [];
      }
      groups[cap.category].push(cap);
    }
  }

  return groups;
}