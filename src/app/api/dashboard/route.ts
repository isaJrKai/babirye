/**
 * BABIRYE v10.0.0 — Dashboard API
 * Aggregated platform statistics and metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import os from 'os';

// ============================================================================
// GET — Aggregated dashboard statistics from real DB queries
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const startTime = Date.now();

    // Run all queries in parallel for performance
    const [
      totalAgents,
      activeAgents,
      pendingTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      infoAlerts,
      totalSensors,
      onlineSensors,
      wallGuardStats,
      recentActivity,
      recentAlerts,
      agentLoadPerDomain,
    ] = await Promise.all([
      // Agent stats
      db.agent.count(),
      db.agent.count({ where: { status: 'running' } }),

      // Task stats by status
      db.task.count({ where: { status: 'pending' } }),
      db.task.count({ where: { status: 'running' } }),
      db.task.count({ where: { status: 'completed' } }),
      db.task.count({ where: { status: 'failed' } }),

      // Alert stats by severity
      db.securityAlert.count({ where: { severity: 'critical' } }),
      db.securityAlert.count({ where: { severity: 'high' } }),
      db.securityAlert.count({ where: { severity: 'medium' } }),
      db.securityAlert.count({ where: { severity: 'low' } }),
      db.securityAlert.count({ where: { severity: 'info' } }),

      // Sensor stats
      db.sensor.count(),
      db.sensor.count({ where: { status: 'online' } }),

      // Wall Guard stats
      db.wallGuard.aggregate({
        _count: true,
        _sum: { blockCount: true },
        where: { isActive: true },
      }),

      // Recent activity — last 10 audit logs
      db.auditLog.findMany({
        select: {
          id: true,
          action: true,
          resource: true,
          details: true,
          userId: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent alerts — last 5 security alerts
      db.securityAlert.findMany({
        select: {
          id: true,
          severity: true,
          type: true,
          title: true,
          status: true,
          createdAt: true,
          source: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Agent load — tasks per agent type (domain)
      db.agent.findMany({
        select: {
          domain: true,
          name: true,
          status: true,
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Simulated system metrics from process
    const cpuUsage = await getCpuUsage();
    const memoryUsage = getMemoryUsage();
    const networkInfo = getNetworkInfo();

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
      tasks: {
        pending: pendingTasks,
        running: runningTasks,
        completed: completedTasks,
        failed: failedTasks,
        total: pendingTasks + runningTasks + completedTasks + failedTasks,
      },
      alerts: {
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts,
        info: infoAlerts,
        total: criticalAlerts + highAlerts + mediumAlerts + lowAlerts + infoAlerts,
      },
      sensors: {
        total: totalSensors,
        online: onlineSensors,
        offline: totalSensors - onlineSensors,
        onlinePercent: totalSensors > 0 ? Math.round((onlineSensors / totalSensors) * 100) : 0,
      },
      wallGuard: {
        total: wallGuardStats._count,
        active: wallGuardStats._count,
        totalBlocks: wallGuardStats._sum.blockCount || 0,
      },
      recentActivity,
      recentAlerts,
      systemMetrics: {
        cpu: cpuUsage,
        memory: memoryUsage,
        network: networkInfo,
        uptime: os.uptime(),
        queryTimeMs: queryTime,
      },
      agentLoadPerDomain: agentLoadPerDomain.map((agent) => ({
        domain: agent.domain,
        name: agent.name,
        status: agent.status,
        taskCount: agent._count.tasks,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /dashboard GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// HELPER: Get simulated CPU usage
// ============================================================================

async function getCpuUsage(): Promise<{
  usagePercent: number;
  cores: number;
  model: string;
  loadAvg: number[];
}> {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  // Calculate CPU usage from load average
  const oneMinuteLoad = loadAvg[0];
  const usagePercent = Math.min(100, Math.round((oneMinuteLoad / cpus.length) * 100));

  return {
    usagePercent,
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    loadAvg: [Math.round(loadAvg[0] * 100) / 100, Math.round(loadAvg[1] * 100) / 100, Math.round(loadAvg[2] * 100) / 100],
  };
}

// ============================================================================
// HELPER: Get memory usage
// ============================================================================

function getMemoryUsage(): {
  totalGb: number;
  usedGb: number;
  freeGb: number;
  usagePercent: number;
  processRssMb: number;
  processHeapMb: number;
} {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  const processMemory = process.memoryUsage();

  return {
    totalGb: Math.round((total / (1024 * 1024 * 1024)) * 100) / 100,
    usedGb: Math.round((used / (1024 * 1024 * 1024)) * 100) / 100,
    freeGb: Math.round((free / (1024 * 1024 * 1024)) * 100) / 100,
    usagePercent: Math.round((used / total) * 100),
    processRssMb: Math.round(processMemory.rss / (1024 * 1024)),
    processHeapMb: Math.round(processMemory.heapUsed / (1024 * 1024)),
  };
}

// ============================================================================
// HELPER: Get network info
// ============================================================================

function getNetworkInfo(): {
  interfaces: number;
  hostname: string;
  platform: string;
} {
  const interfaces = os.networkInterfaces();
  const ifaceCount = Object.keys(interfaces).length;

  return {
    interfaces: ifaceCount,
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
  };
}