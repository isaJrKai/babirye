/**
 * BABIRYE v10.0.0 — Reports API
 *
 * GET    /api/reports              — List reports. ?type=, ?classification= filters.
 * GET    /api/reports?id=xxx       — Download (retrieve) a specific report.
 * POST   /api/reports?type=xxx    — Auto-generate a report from real DB data.
 * DELETE /api/reports              — Delete a report.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Report generators — each pulls real data from the DB and builds content.
// ---------------------------------------------------------------------------

async function generateIncidentReport(): Promise<{ content: string; summary: string }> {
  const [recentAlerts, recentTasks, recentBlocks] = await Promise.all([
    db.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { tool: { select: { name: true } } },
    }),
    db.task.findMany({
      where: { status: { in: ['completed', 'failed'] } },
      orderBy: { completedAt: 'desc' },
      take: 30,
    }),
    db.wallBlock.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { guard: { select: { name: true, category: true } } },
    }),
  ]);

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const a of recentAlerts) {
    if (a.severity in severityCounts) severityCounts[a.severity as keyof typeof severityCounts]++;
  }

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'incident',
    period: { from: recentAlerts[recentAlerts.length - 1]?.createdAt, to: recentAlerts[0]?.createdAt },
    alerts: {
      total: recentAlerts.length,
      bySeverity: severityCounts,
      items: recentAlerts.map((a) => ({
        id: a.id,
        title: a.title,
        severity: a.severity,
        type: a.type,
        status: a.status,
        source: a.source,
        toolName: a.tool?.name || null,
        createdAt: a.createdAt,
      })),
    },
    tasks: {
      total: recentTasks.length,
      completed: recentTasks.filter((t) => t.status === 'completed').length,
      failed: recentTasks.filter((t) => t.status === 'failed').length,
      items: recentTasks.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
    },
    wallBlocks: {
      total: recentBlocks.length,
      byGuard: recentBlocks.reduce<Record<string, number>>((acc, b) => {
        acc[b.guard.name] = (acc[b.guard.name] || 0) + 1;
        return acc;
      }, {}),
      recent: recentBlocks.slice(0, 20).map((b) => ({
        action: b.action,
        guardName: b.guard.name,
        reason: b.reason,
        createdAt: b.createdAt,
      })),
    },
  }, null, 2);

  const summary = `Incident Report: ${recentAlerts.length} alerts (${severityCounts.critical} critical, ${severityCounts.high} high), ${recentTasks.length} recent tasks, ${recentBlocks.length} wall blocks.`;

  return { content, summary };
}

async function generateForensicReport(): Promise<{ content: string; summary: string }> {
  const [cases, tools] = await Promise.all([
    db.forensicCase.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    db.forensicTool.findMany({ include: { _count: { select: { cases: true } } } }),
  ]);

  const statusCounts = { open: 0, in_progress: 0, closed: 0, archived: 0 };
  for (const c of cases) {
    if (c.status in statusCounts) statusCounts[c.status as keyof typeof statusCounts]++;
  }

  const toolStatusCounts = { dormant: 0, active: 0, error: 0 };
  for (const t of tools) {
    if (t.status in toolStatusCounts) toolStatusCounts[t.status as keyof typeof toolStatusCounts]++;
  }

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'forensic',
    cases: {
      total: cases.length,
      byStatus: statusCounts,
      items: cases.map((c) => ({
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        priority: c.priority,
        assignedTo: c.assignedTo,
        createdAt: c.createdAt,
      })),
    },
    tools: {
      total: tools.length,
      byStatus: toolStatusCounts,
      byCategory: tools.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
      items: tools.map((t) => ({
        name: t.name,
        category: t.category,
        status: t.status,
        version: t.version,
        casesCount: t._count.cases,
      })),
    },
  }, null, 2);

  const summary = `Forensic Report: ${cases.length} cases (${statusCounts.open} open, ${statusCounts.in_progress} in progress), ${tools.length} forensic tools (${toolStatusCounts.active} active).`;

  return { content, summary };
}

async function generateVulnerabilityReport(): Promise<{ content: string; summary: string }> {
  const [defensiveTools, microTools, recentAlerts] = await Promise.all([
    db.defensiveTool.findMany(),
    db.microDefensiveTool.findMany(),
    db.securityAlert.findMany({ where: { type: { in: ['intrusion', 'anomaly', 'policy_violation'] } }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  const defStatusCounts = { dormant: 0, active: 0, error: 0 };
  for (const t of defensiveTools) {
    if (t.status in defStatusCounts) defStatusCounts[t.status as keyof typeof defStatusCounts]++;
  }

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'vulnerability',
    defensiveTools: {
      total: defensiveTools.length,
      byStatus: defStatusCounts,
      byCategory: defensiveTools.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
      autoDeployCount: defensiveTools.filter((t) => t.autoDeploy).length,
    },
    microDefensiveTools: {
      total: microTools.length,
      active: microTools.filter((t) => t.isActive).length,
      byCategory: microTools.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
    },
    relatedAlerts: {
      total: recentAlerts.length,
      bySeverity: recentAlerts.reduce<Record<string, number>>((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {}),
    },
  }, null, 2);

  const summary = `Vulnerability Report: ${defensiveTools.length} defensive tools (${defStatusCounts.active} active), ${microTools.length} micro-defensive tools, ${recentAlerts.length} related alerts.`;

  return { content, summary };
}

async function generateComplianceReport(): Promise<{ content: string; summary: string }> {
  const [recentAuditLogs, userCount, settings, activeAlerts] = await Promise.all([
    db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    db.user.count({ where: { isActive: true } }),
    db.systemSetting.findMany({ where: { category: 'security' } }),
    db.securityAlert.count({ where: { status: 'new' } }),
  ]);

  const actionCounts = recentAuditLogs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'compliance',
    userActivity: {
      activeUsers: userCount,
      recentAuditEntries: recentAuditLogs.length,
      actionBreakdown: actionCounts,
      dateRange: {
        from: recentAuditLogs[recentAuditLogs.length - 1]?.createdAt,
        to: recentAuditLogs[0]?.createdAt,
      },
    },
    securityPosture: {
      securitySettings: settings.map((s) => ({ key: s.key, description: s.description })),
      unresolvedAlerts: activeAlerts,
    },
  }, null, 2);

  const summary = `Compliance Report: ${userCount} active users, ${recentAuditLogs.length} recent audit entries, ${activeAlerts} unresolved alerts, ${settings.length} security settings configured.`;

  return { content, summary };
}

async function generateIntelligenceReport(): Promise<{ content: string; summary: string }> {
  const [feeds, recentItems] = await Promise.all([
    db.intelligenceFeed.findMany(),
    db.intelItem.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  const feedStatusCounts = { active: 0, inactive: 0 };
  for (const f of feeds) {
    if (f.isActive) feedStatusCounts.active++;
    else feedStatusCounts.inactive++;
  }

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'intelligence',
    feeds: {
      total: feeds.length,
      active: feedStatusCounts.active,
      inactive: feedStatusCounts.inactive,
      bySource: feeds.reduce<Record<string, number>>((acc, f) => {
        acc[f.source] = (acc[f.source] || 0) + 1;
        return acc;
      }, {}),
      byType: feeds.reduce<Record<string, number>>((acc, f) => {
        acc[f.feedType] = (acc[f.feedType] || 0) + 1;
        return acc;
      }, {}),
      items: feeds.map((f) => ({
        name: f.name,
        source: f.source,
        feedType: f.feedType,
        isActive: f.isActive,
        itemCount: f.itemCount,
        lastFetchedAt: f.lastFetchedAt,
        lastError: f.lastError,
      })),
    },
    recentItems: {
      total: recentItems.length,
      processed: recentItems.filter((i) => i.isProcessed).length,
      unprocessed: recentItems.filter((i) => !i.isProcessed).length,
      bySeverity: recentItems.reduce<Record<string, number>>((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {}),
    },
  }, null, 2);

  const summary = `Intelligence Report: ${feeds.length} feeds (${feedStatusCounts.active} active), ${recentItems.length} recent intel items (${recentItems.filter((i) => !i.isProcessed).length} unprocessed).`;

  return { content, summary };
}

async function generateOperationReport(): Promise<{ content: string; summary: string }> {
  const [operations, recentTasks, offensiveTools] = await Promise.all([
    db.operation.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    db.task.findMany({ where: { type: { in: ['offensive'] } }, orderBy: { createdAt: 'desc' }, take: 30 }),
    db.offensiveTool.findMany(),
  ]);

  const opStatusCounts = { planning: 0, active: 0, completed: 0, failed: 0, cancelled: 0 };
  for (const o of operations) {
    if (o.status in opStatusCounts) opStatusCounts[o.status as keyof typeof opStatusCounts]++;
  }

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'operation',
    operations: {
      total: operations.length,
      byStatus: opStatusCounts,
      byScope: operations.reduce<Record<string, number>>((acc, o) => {
        acc[o.scope] = (acc[o.scope] || 0) + 1;
        return acc;
      }, {}),
      items: operations.map((o) => ({
        id: o.id,
        name: o.name,
        status: o.status,
        scope: o.scope,
        toolName: null, // populated below
        startDate: o.startDate,
        endDate: o.endDate,
        findings: o.findings,
      })),
    },
    relatedTasks: {
      total: recentTasks.length,
      byStatus: recentTasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}),
    },
    offensiveToolStatus: {
      total: offensiveTools.length,
      active: offensiveTools.filter((t) => t.status === 'active').length,
      dormant: offensiveTools.filter((t) => t.status === 'dormant').length,
      error: offensiveTools.filter((t) => t.status === 'error').length,
    },
  }, null, 2);

  const summary = `Operation Report: ${operations.length} operations (${opStatusCounts.active} active, ${opStatusCounts.completed} completed), ${recentTasks.length} related tasks, ${offensiveTools.length} offensive tools.`;

  return { content, summary };
}

async function generateSystemReport(): Promise<{ content: string; summary: string }> {
  const [
    userCount,
    alertCount,
    activeAlerts,
    taskCount,
    runningTasks,
    agentCount,
    runningAgents,
    defensiveToolCount,
    activeDefensiveTools,
    offensiveToolCount,
    forensicToolCount,
    sensorCount,
    activeSensors,
    gatewayCount,
    activeGateways,
    feedCount,
    activeFeeds,
    wallGuardCount,
    totalWallBlocks,
    operationCount,
    potentialCount,
  ] = await Promise.all([
    db.user.count(),
    db.securityAlert.count(),
    db.securityAlert.count({ where: { status: 'new' } }),
    db.task.count(),
    db.task.count({ where: { status: 'running' } }),
    db.agent.count(),
    db.agent.count({ where: { status: 'running' } }),
    db.defensiveTool.count(),
    db.defensiveTool.count({ where: { status: 'active' } }),
    db.offensiveTool.count(),
    db.forensicTool.count(),
    db.sensor.count(),
    db.sensor.count({ where: { status: 'online' } }),
    db.spaGateway.count(),
    db.spaGateway.count({ where: { isActive: true } }),
    db.intelligenceFeed.count(),
    db.intelligenceFeed.count({ where: { isActive: true } }),
    db.wallGuard.count(),
    db.wallBlock.count(),
    db.operation.count(),
    db.potential.count(),
  ]);

  const content = JSON.stringify({
    generatedAt: new Date().toISOString(),
    reportType: 'system',
    systemHealth: {
      users: { total: userCount },
      alerts: { total: alertCount, active: activeAlerts },
      tasks: { total: taskCount, running: runningTasks },
      agents: { total: agentCount, running: runningAgents },
    },
    defensivePosture: {
      defensiveTools: { total: defensiveToolCount, active: activeDefensiveTools },
      wallGuards: { total: wallGuardCount, totalBlocks: totalWallBlocks },
      sensors: { total: sensorCount, online: activeSensors },
    },
    offensiveCapabilities: {
      offensiveTools: offensiveToolCount,
      operations: operationCount,
    },
    intelligence: {
      feeds: { total: feedCount, active: activeFeeds },
    },
    forensics: {
      tools: forensicToolCount,
    },
    infrastructure: {
      gateways: { total: gatewayCount, active: activeGateways },
      potentials: potentialCount,
    },
  }, null, 2);

  const summary = `System Health Report: ${userCount} users, ${alertCount} alerts (${activeAlerts} active), ${taskCount} tasks (${runningTasks} running), ${agentCount} agents (${runningAgents} running), ${defensiveToolCount} defensive tools (${activeDefensiveTools} active), ${sensorCount} sensors (${activeSensors} online), ${gatewayCount} gateways (${activeGateways} active).`;

  return { content, summary };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
const GENERATORS: Record<string, () => Promise<{ content: string; summary: string }>> = {
  incident: generateIncidentReport,
  forensic: generateForensicReport,
  vulnerability: generateVulnerabilityReport,
  compliance: generateComplianceReport,
  intelligence: generateIntelligenceReport,
  operation: generateOperationReport,
  system: generateSystemReport,
};

// ---------------------------------------------------------------------------
// GET — List reports or download specific report
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    // ── Download specific report ───────────────────────────────────────
    if (reportId) {
      const report = await db.report.findUnique({ where: { id: reportId } });
      if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      return NextResponse.json(report);
    }

    // ── List reports with optional filters ─────────────────────────────
    const where: Record<string, unknown> = {};
    const typeParam = searchParams.get('type');
    if (typeParam) where.type = typeParam;
    const classParam = searchParams.get('classification');
    if (classParam) where.classification = classParam;

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        format: true,
        summary: true,
        classification: true,
        generatedBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Generate a report
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'system';

    const generator = GENERATORS[reportType];
    if (!generator) {
      return NextResponse.json(
        { error: `Unknown report type: ${reportType}. Valid types: ${Object.keys(GENERATORS).join(', ')}` },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const classification = body.classification || 'internal';
    const format = body.format || 'json';

    const validClassifications = ['internal', 'confidential', 'secret', 'top_secret'];
    if (!validClassifications.includes(classification)) {
      return NextResponse.json(
        { error: `classification must be one of: ${validClassifications.join(', ')}` },
        { status: 400 },
      );
    }

    const { content, summary } = await generator();

    const report = await db.report.create({
      data: {
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${new Date().toISOString()}`,
        type: reportType,
        format,
        content,
        summary,
        classification,
        generatedBy: auth.payload.userId,
      },
    });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'generate_report',
        resource: 'report',
        details: JSON.stringify({ reportId: report.id, type: reportType, classification }),
        statusCode: 201,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Reports POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Delete a report
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report id is required (query param)' }, { status: 400 });
    }

    const existing = await db.report.findUnique({ where: { id: reportId } });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Only the generator or an admin can delete
    if (existing.generatedBy !== auth.payload.userId && auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only the report generator or an admin can delete this report' }, { status: 403 });
    }

    await db.report.delete({ where: { id: reportId } });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'delete_report',
        resource: 'report',
        details: JSON.stringify({ reportId, type: existing.type }),
        statusCode: 200,
      },
    });

    return NextResponse.json({ success: true, deleted: reportId });
  } catch (error) {
    console.error('Reports DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}