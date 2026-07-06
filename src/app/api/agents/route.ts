/**
 * BABIRYE v10.0.0 — Agents API
 * Manage AI agents: list, create, update config/status, disable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ============================================================================
// GET — List all agents with optional status filter and task count
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const agents = await db.agent.findMany({
      where,
      select: {
        id: true,
        name: true,
        domain: true,
        description: true,
        version: true,
        status: true,
        config: true,
        metrics: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ agents, total: agents.length });
  } catch (error) {
    console.error('[API /agents GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST — Create a new agent (admin only)
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
    const { name, domain, description, version, config, metrics } = body;

    // Validate required fields
    if (!name || !domain || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, description' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.agent.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Agent with this name already exists' }, { status: 409 });
    }

    const agent = await db.agent.create({
      data: {
        name,
        domain,
        description,
        version: version || '1.0.0',
        status: 'idle',
        config: typeof config === 'object' ? JSON.stringify(config) : config || '{}',
        metrics: typeof metrics === 'object' ? JSON.stringify(metrics) : metrics || '{}',
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'agent_create',
        resource: 'agent',
        details: JSON.stringify({ agentId: agent.id, name, domain }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 201,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('[API /agents POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PUT — Update agent config/status (admin only)
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
    const { id, name, domain, description, version, status, config, metrics } = body;

    if (!id) {
      return NextResponse.json({ error: 'Agent id is required' }, { status: 400 });
    }

    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (domain !== undefined) data.domain = domain;
    if (description !== undefined) data.description = description;
    if (version !== undefined) data.version = version;
    if (status !== undefined) data.status = status;
    if (status !== undefined) data.lastActivityAt = new Date();
    if (config !== undefined) {
      data.config = typeof config === 'object' ? JSON.stringify(config) : config;
    }
    if (metrics !== undefined) {
      data.metrics = typeof metrics === 'object' ? JSON.stringify(metrics) : metrics;
    }

    const agent = await db.agent.update({
      where: { id },
      data,
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'agent_update',
        resource: 'agent',
        details: JSON.stringify({ agentId: id, changes: Object.keys(data) }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 200,
      },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('[API /agents PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE — Disable agent (sets status to disabled, admin only)
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Agent id is required' }, { status: 400 });
    }

    const existing = await db.agent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (existing.status === 'disabled') {
      return NextResponse.json({ error: 'Agent is already disabled' }, { status: 400 });
    }

    const agent = await db.agent.update({
      where: { id },
      data: { status: 'disabled' },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'agent_disable',
        resource: 'agent',
        details: JSON.stringify({ agentId: id, name: existing.name }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 200,
      },
    });

    return NextResponse.json({ agent, message: 'Agent disabled successfully' });
  } catch (error) {
    console.error('[API /agents DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}