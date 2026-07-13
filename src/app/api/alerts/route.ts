/**
 * BABIRYE v10.0.0 — Security Alerts API
 *
 * GET    /api/alerts              — List alerts (paginated, filterable)
 * GET    /api/alerts?view=summary — Alert counts by severity & type
 * POST   /api/alerts              — Create a new alert
 * PUT    /api/alerts              — Update alert (status, assignee, resolution)
 * PUT    /api/alerts?action=escalate — Escalate alert severity
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Severity escalation map
// ---------------------------------------------------------------------------
const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'];

function escalateSeverity(current: string): string {
  const idx = SEVERITY_ORDER.indexOf(current);
  if (idx === -1 || idx === SEVERITY_ORDER.length - 1) return current;
  return SEVERITY_ORDER[idx + 1];
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // ── Summary view ──────────────────────────────────────────────────
    if (searchParams.get('view') === 'summary') {
      const [bySeverity, byType, byStatus] = await Promise.all([
        db.securityAlert.groupBy({ by: ['severity'], _count: { id: true } }),
        db.securityAlert.groupBy({ by: ['type'], _count: { id: true } }),
        db.securityAlert.groupBy({ by: ['status'], _count: { id: true } }),
      ]);

      return NextResponse.json({
        bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count.id])),
        byType: Object.fromEntries(byType.map((t) => [t.type, t._count.id])),
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
        total: await db.securityAlert.count(),
      });
    }

    // ── List view with pagination & filters ───────────────────────────
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    const severity = searchParams.get('severity');
    if (severity) where.severity = severity;
    const type = searchParams.get('type');
    if (type) where.type = type;
    const status = searchParams.get('status');
    if (status) where.status = status;
    const search = searchParams.get('search');
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { source: { contains: search } },
      ];
    }

    const [alerts, total] = await Promise.all([
      db.securityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { tool: { select: { id: true, name: true, category: true } } },
      }),
      db.securityAlert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Alerts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create alert
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { source, severity, type, title, description, toolId, ioc } = body;

    if (!source || !type || !title || !description) {
      return NextResponse.json(
        { error: 'source, type, title, and description are required' },
        { status: 400 },
      );
    }

    const validSeverities = ['info', 'low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(', ')}` },
        { status: 400 },
      );
    }

    const alert = await db.securityAlert.create({
      data: {
        source,
        severity: severity || 'medium',
        type,
        title,
        description,
        toolId: toolId || null,
        ioc: ioc ? JSON.stringify(ioc) : null,
      },
    });

    // Create notification for the alert
    await db.notification.create({
      data: {
        userId: auth.payload.userId,
        type: 'alert',
        title: `Security Alert: ${alert.title}`,
        message: alert.description,
        severity: alert.severity,
        actionUrl: `/alerts?id=${alert.id}`,
        metadata: JSON.stringify({ alertId: alert.id }),
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Alerts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update alert / Escalate
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // ── Escalate action ────────────────────────────────────────────────
    if (searchParams.get('action') === 'escalate') {
      const { id } = await request.json();
      if (!id) return NextResponse.json({ error: 'Alert id is required' }, { status: 400 });

      const existing = await db.securityAlert.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

      const newSeverity = escalateSeverity(existing.severity);
      if (newSeverity === existing.severity) {
        return NextResponse.json({ error: 'Alert already at maximum severity (critical)' }, { status: 400 });
      }

      const updated = await db.securityAlert.update({
        where: { id },
        data: { severity: newSeverity, status: 'escalated' },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: auth.payload.userId,
          action: 'escalate_alert',
          resource: 'security_alert',
          details: JSON.stringify({ alertId: id, from: existing.severity, to: newSeverity }),
          statusCode: 200,
        },
      });

      return NextResponse.json(updated);
    }

    // ── Standard update ────────────────────────────────────────────────
    const body = await request.json();
    const { id, status, assignedTo, resolution } = body;

    if (!id) return NextResponse.json({ error: 'Alert id is required' }, { status: 400 });

    const existing = await db.securityAlert.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    if (resolution !== undefined) data.resolution = resolution;

    const updated = await db.securityAlert.update({
      where: { id },
      data,
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'update_alert',
        resource: 'security_alert',
        details: JSON.stringify({ alertId: id, changes: Object.keys(data) }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Alerts PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}