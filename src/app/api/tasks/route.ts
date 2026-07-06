/**
 * BABIRYE v10.0.0 — Tasks API
 * Manage operational tasks: list, create, update, cancel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// Valid task types and statuses
const VALID_TYPES = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
const VALID_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'];

// Map task types to agent domains for auto-assignment
const TYPE_TO_DOMAIN: Record<string, string> = {
  forensic: 'forensic',
  offensive: 'offensive',
  defensive: 'defensive',
  micro_defensive: 'micro_defensive',
  sensors: 'sensors',
  vip: 'vip',
  potentials: 'potentials',
};

// ============================================================================
// GET — List tasks with filters and agent name
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const agentId = searchParams.get('agentId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (agentId) where.agentId = agentId;

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        select: {
          id: true,
          agentId: true,
          creatorId: true,
          type: true,
          status: true,
          priority: true,
          input: true,
          output: true,
          errorMessage: true,
          progress: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          agent: {
            select: { id: true, name: true, domain: true, status: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API /tasks GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST — Create a new task with optional auto-assignment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, priority, input, agentId } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: 'Task type is required' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid task type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Resolve agent — use provided agentId or auto-assign by type
    let resolvedAgentId = agentId || null;

    if (!resolvedAgentId) {
      const domain = TYPE_TO_DOMAIN[type];
      if (domain) {
        const availableAgent = await db.agent.findFirst({
          where: {
            domain,
            status: { in: ['running', 'idle'] },
          },
          select: { id: true },
          orderBy: { updatedAt: 'asc' }, // least recently used
        });
        resolvedAgentId = availableAgent?.id || null;
      }
    } else {
      // Validate provided agentId exists and is active
      const agent = await db.agent.findUnique({
        where: { id: resolvedAgentId },
        select: { id: true, status: true },
      });
      if (!agent) {
        return NextResponse.json({ error: 'Specified agent not found' }, { status: 404 });
      }
      if (agent.status === 'disabled') {
        return NextResponse.json({ error: 'Specified agent is disabled' }, { status: 400 });
      }
    }

    const task = await db.task.create({
      data: {
        agentId: resolvedAgentId,
        creatorId: auth.payload.userId,
        type,
        status: 'pending',
        priority: Math.min(10, Math.max(1, priority || 5)),
        input: typeof input === 'object' ? JSON.stringify(input) : input || '{}',
      },
      select: {
        id: true,
        agentId: true,
        type: true,
        status: true,
        priority: true,
        createdAt: true,
        agent: {
          select: { id: true, name: true, domain: true },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'task_create',
        resource: 'task',
        details: JSON.stringify({ taskId: task.id, type, agentId: resolvedAgentId, priority }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 201,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('[API /tasks POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PUT — Update task status, progress, output
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, progress, output, errorMessage, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Validate status transition
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate progress range
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json({ error: 'Progress must be between 0 and 100' }, { status: 400 });
    }

    // Build update data with automatic timestamps
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = progress;
    if (output !== undefined) {
      data.output = typeof output === 'object' ? JSON.stringify(output) : output;
    }
    if (errorMessage !== undefined) data.errorMessage = errorMessage;
    if (priority !== undefined) data.priority = Math.min(10, Math.max(1, priority));

    // Set timestamps based on status
    if (status === 'running' && !existing.startedAt) {
      data.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      data.completedAt = new Date();
      if (status === 'completed') data.progress = 100;
    }

    const task = await db.task.update({
      where: { id },
      data,
      select: {
        id: true,
        agentId: true,
        type: true,
        status: true,
        priority: true,
        progress: true,
        output: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
        agent: {
          select: { id: true, name: true, domain: true },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'task_update',
        resource: 'task',
        details: JSON.stringify({
          taskId: id,
          changes: Object.keys(data),
          newStatus: task.status,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 200,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('[API /tasks PUT] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE — Cancel a task
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Task is already cancelled' }, { status: 400 });
    }

    if (existing.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed task' }, { status: 400 });
    }

    const task = await db.task.update({
      where: { id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        status: true,
        completedAt: true,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'task_cancel',
        resource: 'task',
        details: JSON.stringify({ taskId: id, type: existing.type, previousStatus: existing.status }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        statusCode: 200,
      },
    });

    return NextResponse.json({ task, message: 'Task cancelled successfully' });
  } catch (error) {
    console.error('[API /tasks DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}