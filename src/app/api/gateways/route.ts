/**
 * BABIRYE v10.0.0 — SPA Gateways API
 *
 * GET    /api/gateways             — List all gateways. ?subsystem= filter.
 * GET    /api/gateways?view=status — All gateway statuses + deployed services.
 * POST   /api/gateways?action=activate|deactivate — Toggle gateway.
 * PUT    /api/gateways             — Update gateway config (admin only).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

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

    // ── Status view ────────────────────────────────────────────────────
    if (searchParams.get('view') === 'status') {
      const gateways = await db.spaGateway.findMany({
        select: {
          id: true,
          name: true,
          subsystem: true,
          isActive: true,
          port: true,
          host: true,
          deployedServices: true,
          network: true,
          updatedAt: true,
        },
        orderBy: { subsystem: 'asc' },
      });

      // Parse deployedServices JSON for each gateway
      const parsed = gateways.map((g) => ({
        ...g,
        deployedServices: JSON.parse(g.deployedServices),
      }));

      return NextResponse.json({
        gateways: parsed,
        summary: {
          total: gateways.length,
          active: gateways.filter((g) => g.isActive).length,
          inactive: gateways.filter((g) => !g.isActive).length,
          bySubsystem: gateways.reduce<Record<string, { total: number; active: number }>>((acc, g) => {
            if (!acc[g.subsystem]) acc[g.subsystem] = { total: 0, active: 0 };
            acc[g.subsystem].total++;
            if (g.isActive) acc[g.subsystem].active++;
            return acc;
          }, {}),
        },
      });
    }

    // ── List view ──────────────────────────────────────────────────────
    const where: Record<string, unknown> = {};
    const subsystem = searchParams.get('subsystem');
    if (subsystem) where.subsystem = subsystem;

    const gateways = await db.spaGateway.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(gateways);
  } catch (error) {
    console.error('Gateways GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Activate / Deactivate gateway
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'activate' && action !== 'deactivate') {
      return NextResponse.json(
        { error: 'action must be "activate" or "deactivate"' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Gateway id is required' }, { status: 400 });
    }

    const existing = await db.spaGateway.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    const newActiveState = action === 'activate';

    if (existing.isActive === newActiveState) {
      return NextResponse.json(
        { error: `Gateway is already ${action === 'activate' ? 'active' : 'inactive'}` },
        { status: 400 },
      );
    }

    const updated = await db.spaGateway.update({
      where: { id },
      data: { isActive: newActiveState },
    });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: `${action}_gateway`,
        resource: 'spa_gateway',
        details: JSON.stringify({ gatewayId: id, name: existing.name, subsystem: existing.subsystem }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gateways POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update gateway config (admin only)
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required to update gateway config' }, { status: 403 });
    }

    const body = await request.json();
    const { id, port, host, network, deployedServices } = body;

    if (!id) {
      return NextResponse.json({ error: 'Gateway id is required' }, { status: 400 });
    }

    const existing = await db.spaGateway.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (port !== undefined) {
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return NextResponse.json({ error: 'port must be an integer between 1 and 65535' }, { status: 400 });
      }
      data.port = port;
    }
    if (host !== undefined) data.host = host;
    if (network !== undefined) data.network = network;
    if (deployedServices !== undefined) {
      if (!Array.isArray(deployedServices)) {
        return NextResponse.json({ error: 'deployedServices must be an array' }, { status: 400 });
      }
      data.deployedServices = JSON.stringify(deployedServices);
    }

    const updated = await db.spaGateway.update({
      where: { id },
      data,
    });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'update_gateway_config',
        resource: 'spa_gateway',
        details: JSON.stringify({ gatewayId: id, name: existing.name, changed: Object.keys(data) }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Gateways PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}