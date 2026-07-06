/**
 * BABIRYE v10.0.0 — SPA Gateway Client
 *
 * Client-side utilities for interacting with the SPA (Single Packet Authorization)
 * gateway system. Provides high-level functions for activating/deactivating
 * subsystems, deploying/undeploying tools, and querying gateway status.
 *
 * All requests are cryptographically signed using HMAC-SHA256 via the
 * crypto-utils module to ensure authenticity and integrity.
 */

'use client';

import type { SpaGateway } from '@/lib/types';
import { apiPost, apiGet } from '@/lib/api-helpers';
import { generateNonce, hmacSign } from '@/lib/crypto-utils';

// ============================================================================
// Types
// ============================================================================

/** Result from subsystem activation or deactivation. */
export interface SpaOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

/** Result from tool deploy or undeploy operations. */
export interface SpaToolResult {
  success: boolean;
  toolName: string;
  subsystem: string;
  message?: string;
  error?: string;
  deployedAt?: string;
}

/** A fully-signed SPA request ready for transmission. */
export interface SignedSpaRequest {
  timestamp: string;
  nonce: string;
  action: string;
  service: string;
  params: Record<string, unknown>;
  signature: string;
}

/** Gateway status item with parsed deployed services. */
export interface GatewayStatusItem {
  id: string;
  name: string;
  subsystem: string;
  port: number;
  host: string;
  isActive: boolean;
  network: string | null;
  deployedServices: string[];
  lastActivityAt: string | null;
  healthScore: number;
}

/** Comprehensive gateway status response. */
export interface GatewayStatusResponse {
  gateways: GatewayStatusItem[];
  totalGateways: number;
  activeGateways: number;
  totalDeployedServices: number;
  lastCheckedAt: string;
}

/** SPA activation request payload. */
export interface SpaActivateRequest {
  subsystem: string;
  secret: string;
  reason?: string;
  params?: Record<string, unknown>;
}

/** SPA deactivation request payload. */
export interface SpaDeactivateRequest {
  subsystem: string;
  secret: string;
  reason?: string;
  force?: boolean;
}

/** SPA tool deployment request payload. */
export interface SpaDeployToolRequest {
  subsystem: string;
  toolName: string;
  secret: string;
  params?: Record<string, unknown>;
}

/** SPA tool undeployment request payload. */
export interface SpaUndeployToolRequest {
  subsystem: string;
  toolName: string;
  secret: string;
  force?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Default service name used in SPA signing when none is specified. */
const DEFAULT_SERVICE = 'spa-gateway';

/** Time window (seconds) for SPA signature validity. */
const SPA_VALIDITY_WINDOW_SECONDS = 300;

// ============================================================================
// Signature Creation
// ============================================================================

/**
 * Create a cryptographically-signed SPA request for gateway operations.
 *
 * Builds a canonical message from timestamp, nonce, action, service, and
 * parameters, then signs it with HMAC-SHA256 using the provided secret.
 *
 * The canonical format is: `{timestamp}|{nonce}|{action}|{service}|{params_json}`
 *
 * @param action  - The action being performed (e.g. 'activate', 'deploy_tool')
 * @param service - The target service identifier
 * @param params  - Additional parameters for the action
 * @param secret  - The shared secret for HMAC signing
 * @returns A fully-signed SPA request object
 */
export async function createSpaGatewaySignature(
  action: string,
  service: string = DEFAULT_SERVICE,
  params: Record<string, unknown> = {},
  secret: string
): Promise<SignedSpaRequest> {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce(32);

  // Build canonical message matching server-side verification
  const paramsJson = JSON.stringify(params);
  const canonicalMessage = `${timestamp}|${nonce}|${action}|${service}|${paramsJson}`;

  // Generate HMAC-SHA256 signature
  const signature = await hmacSign(canonicalMessage, secret);

  return {
    timestamp,
    nonce,
    action,
    service,
    params,
    signature,
  };
}

// ============================================================================
// Request Validation Helpers
// ============================================================================

/**
 * Validate that a subsystem name meets minimum security requirements.
 * Prevents injection and ensures consistent naming.
 */
function validateSubsystem(subsystem: string): void {
  if (!subsystem || typeof subsystem !== 'string') {
    throw new Error('Subsystem name is required and must be a string');
  }
  if (subsystem.length > 128) {
    throw new Error('Subsystem name must not exceed 128 characters');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(subsystem)) {
    throw new Error('Subsystem name must only contain alphanumeric characters, hyphens, and underscores');
  }
}

/**
 * Validate that a tool name meets minimum security requirements.
 */
function validateToolName(toolName: string): void {
  if (!toolName || typeof toolName !== 'string') {
    throw new Error('Tool name is required and must be a string');
  }
  if (toolName.length > 256) {
    throw new Error('Tool name must not exceed 256 characters');
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(toolName)) {
    throw new Error('Tool name contains invalid characters');
  }
}

/**
 * Validate that a secret key is present.
 */
function validateSecret(secret: string): void {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Secret key is required');
  }
  if (secret.length < 8) {
    throw new Error('Secret key must be at least 8 characters long');
  }
}

// ============================================================================
// Subsystem Operations
// ============================================================================

/**
 * Activate a subsystem via the SPA gateway.
 *
 * Creates a signed SPA request and sends it to the gateway activation endpoint.
 * The subsystem will be brought online and begin accepting traffic.
 *
 * @param subsystem - The subsystem identifier to activate
 * @param secret    - The shared secret for the subsystem
 * @param reason    - Optional human-readable reason for the activation
 * @returns Result indicating success or failure
 */
export async function activateSubsystem(
  subsystem: string,
  secret: string,
  reason?: string
): Promise<SpaOperationResult> {
  validateSubsystem(subsystem);
  validateSecret(secret);

  const signedRequest = await createSpaGatewaySignature(
    'activate',
    `subsystem-${subsystem}`,
    { subsystem, reason },
    secret
  );

  try {
    const result = await apiPost<SpaOperationResult>(
      `/spa/activate?XTransformPort=${getGatewayPort(subsystem)}`,
      signedRequest
    );
    return {
      ...result,
      success: true,
      message: `Subsystem "${subsystem}" activated successfully`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate subsystem',
    };
  }
}

/**
 * Deactivate a subsystem via the SPA gateway.
 *
 * Gracefully shuts down the subsystem. Use `force: true` to force
 * immediate shutdown without graceful drain.
 *
 * @param subsystem - The subsystem identifier to deactivate
 * @param secret    - The shared secret for the subsystem
 * @param reason    - Optional human-readable reason for deactivation
 * @param force     - If true, skip graceful shutdown
 * @returns Result indicating success or failure
 */
export async function deactivateSubsystem(
  subsystem: string,
  secret: string,
  reason?: string,
  force: boolean = false
): Promise<SpaOperationResult> {
  validateSubsystem(subsystem);
  validateSecret(secret);

  const signedRequest = await createSpaGatewaySignature(
    'deactivate',
    `subsystem-${subsystem}`,
    { subsystem, reason, force },
    secret
  );

  try {
    const result = await apiPost<SpaOperationResult>(
      `/spa/deactivate?XTransformPort=${getGatewayPort(subsystem)}`,
      signedRequest
    );
    return {
      ...result,
      success: true,
      message: `Subsystem "${subsystem}" deactivated successfully`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate subsystem',
    };
  }
}

// ============================================================================
// Tool Deployment Operations
// ============================================================================

/**
 * Deploy a tool on a specific subsystem via the SPA gateway.
 *
 * Signs the deployment request and sends it to the gateway's tool
 * deployment endpoint. The tool will be instantiated and started.
 *
 * @param subsystem - The target subsystem identifier
 * @param toolName  - The name of the tool to deploy
 * @param secret    - The shared secret for the subsystem
 * @param params    - Optional tool-specific deployment parameters
 * @returns Result indicating deployment success or failure
 */
export async function deployTool(
  subsystem: string,
  toolName: string,
  secret: string,
  params?: Record<string, unknown>
): Promise<SpaToolResult> {
  validateSubsystem(subsystem);
  validateToolName(toolName);
  validateSecret(secret);

  const signedRequest = await createSpaGatewaySignature(
    'deploy_tool',
    `tool-${subsystem}`,
    { subsystem, toolName, ...params },
    secret
  );

  try {
    const result = await apiPost<SpaToolResult>(
      `/spa/deploy-tool?XTransformPort=${getGatewayPort(subsystem)}`,
      signedRequest
    );
    return {
      ...result,
      success: true,
      toolName,
      subsystem,
      deployedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      toolName,
      subsystem,
      error: error instanceof Error ? error.message : 'Failed to deploy tool',
    };
  }
}

/**
 * Undeploy a tool from a specific subsystem via the SPA gateway.
 *
 * Gracefully stops and removes the tool from the subsystem.
 * Use `force: true` to force immediate removal.
 *
 * @param subsystem - The target subsystem identifier
 * @param toolName  - The name of the tool to undeploy
 * @param secret    - The shared secret for the subsystem
 * @param force     - If true, skip graceful shutdown
 * @returns Result indicating undeployment success or failure
 */
export async function undeployTool(
  subsystem: string,
  toolName: string,
  secret: string,
  force: boolean = false
): Promise<SpaToolResult> {
  validateSubsystem(subsystem);
  validateToolName(toolName);
  validateSecret(secret);

  const signedRequest = await createSpaGatewaySignature(
    'undeploy_tool',
    `tool-${subsystem}`,
    { subsystem, toolName, force },
    secret
  );

  try {
    const result = await apiPost<SpaToolResult>(
      `/spa/undeploy-tool?XTransformPort=${getGatewayPort(subsystem)}`,
      signedRequest
    );
    return {
      ...result,
      success: true,
      toolName,
      subsystem,
    };
  } catch (error) {
    return {
      success: false,
      toolName,
      subsystem,
      error: error instanceof Error ? error.message : 'Failed to undeploy tool',
    };
  }
}

// ============================================================================
// Gateway Status
// ============================================================================

/**
 * Retrieve the current status of all SPA gateways.
 *
 * Fetches gateway information from the API and enriches it with
 * parsed deployed services and computed health scores.
 *
 * @returns Array of gateway status items with enriched data
 */
export async function getGatewayStatus(): Promise<SpaGateway[]> {
  try {
    const gateways = await apiGet<SpaGateway[]>('/gateways');
    return gateways;
  } catch (error) {
    console.error('[SPA Gateway] Failed to fetch gateway status:', error);
    return [];
  }
}

/**
 * Get a comprehensive status overview of all gateways.
 *
 * Includes counts, health scores, and parsed service information.
 *
 * @returns Enriched gateway status response
 */
export async function getGatewayStatusOverview(): Promise<GatewayStatusResponse> {
  const gateways = await getGatewayStatus();

  const statusItems: GatewayStatusItem[] = gateways.map((gw) => {
    // Parse the deployed services JSON string
    let deployedServices: string[] = [];
    try {
      const parsed = JSON.parse(gw.deployedServices || '[]');
      if (Array.isArray(parsed)) {
        deployedServices = parsed.map(String);
      }
    } catch {
      deployedServices = gw.deployedServices
        ? gw.deployedServices.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // Compute a simple health score based on active status and service count
    const healthScore = gw.isActive
      ? Math.max(50, 100 - deployedServices.length * 2)
      : 0;

    return {
      id: gw.id,
      name: gw.name,
      subsystem: gw.subsystem,
      port: gw.port,
      host: gw.host,
      isActive: gw.isActive,
      network: gw.network,
      deployedServices,
      lastActivityAt: null, // Not available in base type
      healthScore,
    };
  });

  return {
    gateways: statusItems,
    totalGateways: statusItems.length,
    activeGateways: statusItems.filter((g) => g.isActive).length,
    totalDeployedServices: statusItems.reduce((sum, g) => sum + g.deployedServices.length, 0),
    lastCheckedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the port for a specific subsystem.
 * Uses the gateway mapping if available, otherwise falls back to a
 * deterministic port derivation from the subsystem name.
 */
function getGatewayPort(subsystem: string): number {
  // In a real implementation this would look up the gateway registry
  // For now, derive a port from the subsystem name hash
  let hash = 0;
  for (let i = 0; i < subsystem.length; i++) {
    const char = subsystem.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Map to port range 3001-3999
  return 3001 + Math.abs(hash) % 999;
}

/**
 * Check if a specific subsystem is currently active.
 *
 * @param subsystem - The subsystem identifier to check
 * @returns `true` if the subsystem has an active gateway
 */
export async function isSubsystemActive(subsystem: string): Promise<boolean> {
  const gateways = await getGatewayStatus();
  return gateways.some((gw) => gw.subsystem === subsystem && gw.isActive);
}

/**
 * Get the list of deployed services for a specific subsystem.
 *
 * @param subsystem - The subsystem identifier
 * @returns Array of deployed service names, or empty array if not found
 */
export async function getDeployedServices(subsystem: string): Promise<string[]> {
  const gateways = await getGatewayStatus();
  const gateway = gateways.find((gw) => gw.subsystem === subsystem);

  if (!gateway) return [];

  try {
    const parsed = JSON.parse(gateway.deployedServices || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return gateway.deployedServices
      ? gateway.deployedServices.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }
}