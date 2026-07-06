/**
 * BABIRYE v10.0.0 — Audit Logs API
 *
 * GET  /api/audit — List audit logs (paginated, filterable).
 *                   No POST/PUT/DELETE — audit logs are system-generated only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admin and operator can view all audit logs; analysts see their own.
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 100));
    const skip = (page - 1) * limit;

    // ── Build where clause ─────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    // Non-admin users can only see their own logs unless an admin explicitly
    // requests a different userId (admins can see everything).
    const userIdParam = searchParams.get('userId');
    if (auth.payload.role !== 'admin' && auth.payload.role !== 'operator') {
      where.userId = auth.payload.userId;
    } else if (userIdParam) {
      where.userId = userIdParam;
    }

    const actionParam = searchParams.get('action');
    if (actionParam) where.action = actionParam;

    const resourceParam = searchParams.get('resource');
    if (resourceParam) where.resource = resourceParam;

    // Date range
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (fromParam || toParam) {
      const createdAtFilter: Record<string, unknown> = {};
      if (fromParam) createdAtFilter.gte = new Date(fromParam);
      if (toParam) createdAtFilter.lte = new Date(toParam);
      where.createdAt = createdAtFilter;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Audit GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Explicitly disallow mutation methods — audit logs are system-generated.
export async function POST() {
  return NextResponse.json(
    { error: 'Audit logs are system-generated. POST is not allowed.' },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Audit logs are immutable. PUT is not allowed.' },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Audit logs are immutable. DELETE is not allowed.' },
    { status: 405 },
  );
}