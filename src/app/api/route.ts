/**
 * BABIRYE v10.0.0 — API Root
 * Returns platform overview with real database counts and available endpoints.
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

    const [
      userCount,
      agentCount,
      activeAgentCount,
      taskCount,
      pendingTaskCount,
      runningTaskCount,
      alertCount,
      newAlertCount,
      sensorCount,
      onlineSensorCount,
      wallGuardCount,
      activeWallGuardCount,
      wallBlockCount,
      forensicToolCount,
      offensiveToolCount,
      defensiveToolCount,
      microDefensiveToolCount,
      vipProfileCount,
      potentialCount,
      weaponCount,
      feedCount,
      gatewayCount,
      constitutionCount,
      reportCount,
      councilDomainCount,
      notificationCount,
    ] = await Promise.all([
      db.user.count(),
      db.agent.count(),
      db.agent.count({ where: { status: 'running' } }),
      db.task.count(),
      db.task.count({ where: { status: 'pending' } }),
      db.task.count({ where: { status: 'running' } }),
      db.securityAlert.count(),
      db.securityAlert.count({ where: { status: 'new' } }),
      db.sensor.count(),
      db.sensor.count({ where: { status: 'online' } }),
      db.wallGuard.count(),
      db.wallGuard.count({ where: { isActive: true } }),
      db.wallBlock.count(),
      db.forensicTool.count(),
      db.offensiveTool.count(),
      db.defensiveTool.count(),
      db.microDefensiveTool.count(),
      db.vipProfile.count(),
      db.potential.count(),
      db.weapon.count(),
      db.intelligenceFeed.count(),
      db.spaGateway.count(),
      db.constitution.count(),
      db.report.count(),
      db.councilDomain.count(),
      db.notification.count(),
    ]);

    return NextResponse.json({
      platform: 'BABIRYE v10.0.0',
      description: 'Autonomous AI Security Operations Platform',
      authenticatedAs: {
        userId: auth.payload.userId,
        email: auth.payload.email,
        role: auth.payload.role,
      },
      inventory: {
        users: userCount,
        agents: { total: agentCount, active: activeAgentCount },
        tasks: { total: taskCount, pending: pendingTaskCount, running: runningTaskCount },
        alerts: { total: alertCount, new: newAlertCount },
        sensors: { total: sensorCount, online: onlineSensorCount },
        wallGuards: { total: wallGuardCount, active: activeWallGuardCount },
        wallBlocks: wallBlockCount,
        tools: {
          forensic: forensicToolCount,
          offensive: offensiveToolCount,
          defensive: defensiveToolCount,
          microDefensive: microDefensiveToolCount,
        },
        vipProfiles: vipProfileCount,
        potentials: potentialCount,
        weapons: weaponCount,
        intelFeeds: feedCount,
        gateways: gatewayCount,
        constitutions: constitutionCount,
        reports: reportCount,
        councilDomains: councilDomainCount,
        notifications: notificationCount,
      },
      endpoints: [
        'GET    /api/agents',
        'GET    /api/alerts',
        'GET    /api/audit',
        'GET    /api/council',
        'GET    /api/constitutions',
        'GET    /api/gateways',
        'GET    /api/intel',
        'GET    /api/notifications',
        'GET    /api/potentials',
        'GET    /api/reports',
        'GET    /api/sensors',
        'GET    /api/settings',
        'GET    /api/tasks',
        'GET    /api/tools',
        'GET    /api/vip',
        'GET    /api/wall',
        'GET    /api/weapons',
        'GET    /api/dashboard',
        'GET    /api/auth',
      ],
      totalRecords: userCount + agentCount + taskCount + alertCount + sensorCount + wallGuardCount + wallBlockCount + forensicToolCount + offensiveToolCount + defensiveToolCount + microDefensiveToolCount + vipProfileCount + potentialCount + weaponCount + feedCount + gatewayCount + constitutionCount + reportCount + councilDomainCount + notificationCount,
    });
  } catch (error) {
    console.error('[API / GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}