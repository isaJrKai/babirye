/**
 * BABIRYE v10.0.0 — Seed API
 * Trigger database seeding and check seeding status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    const auth = await authenticateRequest(null);
    if (!auth.authenticated) {
      const userCount = await db.user.count();
      if (userCount > 0) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const [userCount, agentCount, sensorCount, forensicCount, offensiveCount, defensiveCount, microDefCount, taskCount, alertCount, wallGuardCount, potentialCount, weaponCount, councilCount] =
      await Promise.all([db.user.count(), db.agent.count(), db.sensor.count(), db.forensicTool.count(), db.offensiveTool.count(), db.defensiveTool.count(), db.microDefensiveTool.count(), db.task.count(), db.securityAlert.count(), db.wallGuard.count(), db.potential.count(), db.weapon.count(), db.councilDomain.count()]);
    return NextResponse.json({
      seeded: userCount > 0 && agentCount > 0,
      counts: { users: userCount, agents: agentCount, sensors: sensorCount, forensicTools: forensicCount, offensiveTools: offensiveCount, defensiveTools: defensiveCount, microDefensiveTools: microDefCount, tasks: taskCount, alerts: alertCount, wallGuards: wallGuardCount, potentials: potentialCount, weapons: weaponCount, councilDomains: councilCount },
    });
  } catch (error) {
    console.error('[API /seed GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      const userCount = await db.user.count();
      if (userCount > 0) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    } else if (auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const result = await seedDatabase();
    if (auth.authenticated && auth.payload) {
      await db.auditLog.create({ data: { userId: auth.payload.userId, action: 'seed_database', resource: 'system', details: JSON.stringify(result), statusCode: 200 } });
    }
    return NextResponse.json({ success: true, counts: result });
  } catch (error) {
    console.error('[API /seed POST] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}