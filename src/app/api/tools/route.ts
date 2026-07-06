/**
 * BABIRYE v10.0.0 — Tools API
 * Manage forensic, offensive, defensive, and micro-defensive tools.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// Valid tool types
const VALID_TOOL_TYPES = ['forensic', 'offensive', 'defensive', 'micro_defensive'] as const;
type ToolType = (typeof VALID_TOOL_TYPES)[number];

// Category sub-filters per tool type
const FORENSIC_CATEGORIES = ['android', 'ios', 'computer', 'network', 'memory', 'advanced'];
const OFFENSIVE_CATEGORIES = ['recon', 'exploitation', 'post_exploitation', 'c2', 'persistence', 'lateral', 'payload', 'social_engineering', 'wireless', 'hardware'];
const DEFENSIVE_CATEGORIES = ['network', 'endpoint', 'application', 'identity', 'data', 'cloud', 'micro'];
const MICRO_DEFENSIVE_CATEGORIES = ['input_validation', 'output_encoding', 'sanitization', 'integrity', 'rate_limiting', 'cors', 'header_security', 'cookie_security'];

const CATEGORY_MAP: Record<ToolType, string[]> = {
  forensic: FORENSIC_CATEGORIES,
  offensive: OFFENSIVE_CATEGORIES,
  defensive: DEFENSIVE_CATEGORIES,
  micro_defensive: MICRO_DEFENSIVE_CATEGORIES,
};

// ============================================================================
// GET — List tools by type with optional category filter
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ToolType | null;
    const category = searchParams.get('category');

    // Validate type param
    if (type && !VALID_TOOL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid tool type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate category param
    if (category && type) {
      const validCategories = CATEGORY_MAP[type];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category for type '${type}'. Valid categories: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // If no type specified, return counts per type
    if (!type) {
      const [forensicCount, offensiveCount, defensiveCount, microDefensiveCount] = await Promise.all([
        db.forensicTool.count(),
        db.offensiveTool.count(),
        db.defensiveTool.count(),
        db.microDefensiveTool.count(),
      ]);

      return NextResponse.json({
        summary: {
          forensic: forensicCount,
          offensive: offensiveCount,
          defensive: defensiveCount,
          micro_defensive: microDefensiveCount,
          total: forensicCount + offensiveCount + defensiveCount + microDefensiveCount,
        },
      });
    }

    // Query the appropriate table based on type
    let tools;
    switch (type) {
      case 'forensic': {
        const where: Record<string, unknown> = {};
        if (category) where.category = category;

        tools = await db.forensicTool.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            version: true,
            status: true,
            containerImage: true,
            port: true,
            config: true,
            lastDeployedAt: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { cases: true } },
          },
          orderBy: [{ status: 'asc' }, { name: 'asc' }],
        });
        break;
      }

      case 'offensive': {
        const where: Record<string, unknown> = {};
        if (category) where.category = category;

        tools = await db.offensiveTool.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            subcategory: true,
            description: true,
            version: true,
            status: true,
            containerImage: true,
            port: true,
            config: true,
            riskLevel: true,
            requiresAuth: true,
            lastDeployedAt: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { operations: true } },
          },
          orderBy: [{ status: 'asc' }, { riskLevel: 'desc' }, { name: 'asc' }],
        });
        break;
      }

      case 'defensive': {
        const where: Record<string, unknown> = {};
        if (category) where.category = category;

        tools = await db.defensiveTool.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            subcategory: true,
            description: true,
            version: true,
            status: true,
            containerImage: true,
            port: true,
            config: true,
            autoDeploy: true,
            lastDeployedAt: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { alerts: true } },
          },
          orderBy: [{ status: 'asc' }, { name: 'asc' }],
        });
        break;
      }

      case 'micro_defensive': {
        const where: Record<string, unknown> = {};
        if (category) where.category = category;

        tools = await db.microDefensiveTool.findMany({
          where,
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            status: true,
            config: true,
            isActive: true,
            blockCount: true,
            lastTriggeredAt: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ status: 'asc' }, { blockCount: 'desc' }, { name: 'asc' }],
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Unsupported tool type' }, { status: 400 });
    }

    return NextResponse.json({ type, tools, total: (tools as unknown[]).length });
  } catch (error) {
    console.error('[API /tools GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST — Deploy/activate a tool (admin only)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'Tool type and id are required' }, { status: 400 });
    }
    if (!VALID_TOOL_TYPES.includes(type as ToolType)) {
      return NextResponse.json(
        { error: `Invalid tool type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find and activate the tool in the appropriate table
    switch (type) {
      case 'forensic': {
        const tool = await db.forensicTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Forensic tool not found' }, { status: 404 });
        if (tool.status === 'active') return NextResponse.json({ error: 'Tool is already active' }, { status: 400 });

        const updated = await db.forensicTool.update({
          where: { id },
          data: { status: 'active', lastDeployedAt: now },
        });

        await logAudit(auth.payload.userId, request, 'tool_deploy', 'forensic_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Forensic tool '${tool.name}' deployed successfully` });
      }

      case 'offensive': {
        const tool = await db.offensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Offensive tool not found' }, { status: 404 });
        if (tool.status === 'active') return NextResponse.json({ error: 'Tool is already active' }, { status: 400 });

        const updated = await db.offensiveTool.update({
          where: { id },
          data: { status: 'active', lastDeployedAt: now },
        });

        await logAudit(auth.payload.userId, request, 'tool_deploy', 'offensive_tool', { id, name: tool.name, riskLevel: tool.riskLevel });
        return NextResponse.json({ tool: updated, message: `Offensive tool '${tool.name}' deployed successfully` });
      }

      case 'defensive': {
        const tool = await db.defensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Defensive tool not found' }, { status: 404 });
        if (tool.status === 'active') return NextResponse.json({ error: 'Tool is already active' }, { status: 400 });

        const updated = await db.defensiveTool.update({
          where: { id },
          data: { status: 'active', lastDeployedAt: now },
        });

        await logAudit(auth.payload.userId, request, 'tool_deploy', 'defensive_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Defensive tool '${tool.name}' deployed successfully` });
      }

      case 'micro_defensive': {
        const tool = await db.microDefensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Micro-defensive tool not found' }, { status: 404 });
        if (tool.status === 'active') return NextResponse.json({ error: 'Tool is already active' }, { status: 400 });

        const updated = await db.microDefensiveTool.update({
          where: { id },
          data: { status: 'active' },
        });

        await logAudit(auth.payload.userId, request, 'tool_deploy', 'micro_defensive_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Micro-defensive tool '${tool.name}' activated successfully` });
      }

      default:
        return NextResponse.json({ error: 'Unsupported tool type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API /tools POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PUT — Update tool config (admin only)
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, config, name, description, autoDeploy, riskLevel } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'Tool type and id are required' }, { status: 400 });
    }
    if (!VALID_TOOL_TYPES.includes(type as ToolType)) {
      return NextResponse.json(
        { error: `Invalid tool type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (config !== undefined) {
      data.config = typeof config === 'object' ? JSON.stringify(config) : config;
    }
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (autoDeploy !== undefined) data.autoDeploy = autoDeploy;
    if (riskLevel !== undefined) data.riskLevel = riskLevel;

    switch (type) {
      case 'forensic': {
        const existing = await db.forensicTool.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Forensic tool not found' }, { status: 404 });
        const updated = await db.forensicTool.update({ where: { id }, data });
        await logAudit(auth.payload.userId, request, 'tool_update', 'forensic_tool', { id, name: existing.name, changes: Object.keys(data) });
        return NextResponse.json({ tool: updated });
      }

      case 'offensive': {
        const existing = await db.offensiveTool.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Offensive tool not found' }, { status: 404 });
        const updated = await db.offensiveTool.update({ where: { id }, data });
        await logAudit(auth.payload.userId, request, 'tool_update', 'offensive_tool', { id, name: existing.name, changes: Object.keys(data) });
        return NextResponse.json({ tool: updated });
      }

      case 'defensive': {
        const existing = await db.defensiveTool.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Defensive tool not found' }, { status: 404 });
        const updated = await db.defensiveTool.update({ where: { id }, data });
        await logAudit(auth.payload.userId, request, 'tool_update', 'defensive_tool', { id, name: existing.name, changes: Object.keys(data) });
        return NextResponse.json({ tool: updated });
      }

      case 'micro_defensive': {
        const existing = await db.microDefensiveTool.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Micro-defensive tool not found' }, { status: 404 });
        const updated = await db.microDefensiveTool.update({ where: { id }, data });
        await logAudit(auth.payload.userId, request, 'tool_update', 'micro_defensive_tool', { id, name: existing.name, changes: Object.keys(data) });
        return NextResponse.json({ tool: updated });
      }

      default:
        return NextResponse.json({ error: 'Unsupported tool type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API /tools PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE — Deactivate a tool (sets status back to dormant)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ToolType | null;
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Tool type and id are required (query params)' }, { status: 400 });
    }
    if (!VALID_TOOL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid tool type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    switch (type) {
      case 'forensic': {
        const tool = await db.forensicTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Forensic tool not found' }, { status: 404 });
        if (tool.status === 'dormant') return NextResponse.json({ error: 'Tool is already dormant' }, { status: 400 });

        const updated = await db.forensicTool.update({ where: { id }, data: { status: 'dormant' } });
        await logAudit(auth.payload.userId, request, 'tool_deactivate', 'forensic_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Forensic tool '${tool.name}' deactivated` });
      }

      case 'offensive': {
        const tool = await db.offensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Offensive tool not found' }, { status: 404 });
        if (tool.status === 'dormant') return NextResponse.json({ error: 'Tool is already dormant' }, { status: 400 });

        const updated = await db.offensiveTool.update({ where: { id }, data: { status: 'dormant' } });
        await logAudit(auth.payload.userId, request, 'tool_deactivate', 'offensive_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Offensive tool '${tool.name}' deactivated` });
      }

      case 'defensive': {
        const tool = await db.defensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Defensive tool not found' }, { status: 404 });
        if (tool.status === 'dormant') return NextResponse.json({ error: 'Tool is already dormant' }, { status: 400 });

        const updated = await db.defensiveTool.update({ where: { id }, data: { status: 'dormant' } });
        await logAudit(auth.payload.userId, request, 'tool_deactivate', 'defensive_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Defensive tool '${tool.name}' deactivated` });
      }

      case 'micro_defensive': {
        const tool = await db.microDefensiveTool.findUnique({ where: { id } });
        if (!tool) return NextResponse.json({ error: 'Micro-defensive tool not found' }, { status: 404 });
        if (tool.status === 'dormant') return NextResponse.json({ error: 'Tool is already dormant' }, { status: 400 });

        const updated = await db.microDefensiveTool.update({ where: { id }, data: { status: 'dormant' } });
        await logAudit(auth.payload.userId, request, 'tool_deactivate', 'micro_defensive_tool', { id, name: tool.name });
        return NextResponse.json({ tool: updated, message: `Micro-defensive tool '${tool.name}' deactivated` });
      }

      default:
        return NextResponse.json({ error: 'Unsupported tool type' }, { status: 400 });
    }
  } catch (error) {
    console.error('[API /tools DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HELPER: Audit log helper
// ============================================================================

async function logAudit(
  userId: string,
  request: NextRequest,
  action: string,
  resource: string,
  details: Record<string, unknown>
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      resource,
      details: JSON.stringify(details),
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      statusCode: 200,
    },
  });
}