/**
 * BABIRYE v10.0.0 — Self-Attack Wall API Routes
 * Guards, blocks, testing, and aggregate statistics.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Guard evaluation logic — deterministic keyword-based simulation.
// Each guard category has a set of trigger keywords. If the action string
// or service string contains a keyword, the guard triggers (blocks).
// ---------------------------------------------------------------------------

const GUARD_RULES: Record<string, { keywords: string[]; blockReason: string }> = {
  injection: {
    keywords: ['sql', 'inject', 'union', 'select', 'drop', 'exec', 'eval', 'script', 'expression', 'nosql', 'ldap', 'xpath', 'template', 'ssti', 'command', 'shell', 'os.system', 'popen', 'execSync', 'child_process'],
    blockReason: 'Injection pattern detected — potential code / query injection',
  },
  exfiltration: {
    keywords: ['exfil', 'extract', 'dump', 'export', 'download', 'backup', 'scp', 'ftp', 'sftp', 'upload', 'send', 'transmit', 'leak', 'steal', 'bulk', 'mass_select', 'copy_table', 'data_export'],
    blockReason: 'Data exfiltration pattern detected',
  },
  privilege: {
    keywords: ['sudo', 'root', 'admin', 'privilege', 'escalate', 'chmod', 'chown', 'setuid', 'setgid', 'kernel', 'insmod', 'rmmod', 'capab', 'namespace', 'pivot', 'lateral', 'token', 'impersonate', 'kerberoast', 'golden_ticket'],
    blockReason: 'Privilege escalation / lateral movement pattern detected',
  },
  integrity: {
    keywords: ['tamper', 'modify', 'alter', 'overwrite', 'delete', 'remove', 'truncate', 'drop_table', 'patch', 'replace', 'spoof', 'mitm', 'dns_poison', 'bgp_hijack', '篡改', '修改'],
    blockReason: 'Integrity violation pattern detected',
  },
  crypto: {
    keywords: ['encrypt', 'decrypt', 'hash', 'key', 'certificate', 'ssl', 'tls', 'rsa', 'aes', 'des', 'pbkdf', 'bcrypt', 'scrypt', 'argon', 'hmac', 'sign', 'verify', 'ciphertext', 'plaintext'],
    blockReason: 'Cryptographic operation pattern detected — potential key extraction',
  },
  supply_chain: {
    keywords: ['npm', 'pip', 'gem', 'cargo', 'maven', 'gradle', 'composer', 'nuget', 'docker', 'container', 'image', 'helm', 'kustomize', 'terraform', 'dependency', 'package', 'install', 'brew', 'choco', 'apt', 'yum'],
    blockReason: 'Supply-chain operation pattern detected — potential dependency attack',
  },
  input_validation: {
    keywords: ['<script', 'onerror', 'onload', 'onclick', 'javascript:', 'vbscript:', 'data:', 'blob:', 'file:', '<iframe', '<embed', '<object', '<svg', ' onload', 'onfocus', 'onblur', 'onmouseover', 'alert(', 'confirm(', 'prompt(', 'innerhtml', 'document.cookie', 'location.href', 'window.open'],
    blockReason: 'Input validation failure — potential XSS or unsafe content',
  },
};

function evaluateGuard(
  guard: { category: string; name: string; config: string; isActive: boolean },
  action: string,
  service: string,
  params: Record<string, unknown>
): { blocked: boolean; reason: string; score: number } {
  if (!guard.isActive) {
    return { blocked: false, reason: 'Guard is inactive', score: 0 };
  }

  const rules = GUARD_RULES[guard.category];
  if (!rules) {
    return { blocked: false, reason: 'No rules for category', score: 0 };
  }

  // Build a combined text from action + service + stringified params
  const combinedText = `${action} ${service} ${JSON.stringify(params)}`.toLowerCase();

  let matchCount = 0;
  const matchedKeywords: string[] = [];

  for (const kw of rules.keywords) {
    if (combinedText.includes(kw.toLowerCase())) {
      matchCount++;
      matchedKeywords.push(kw);
    }
  }

  if (matchCount === 0) {
    return { blocked: false, reason: 'No triggers matched', score: 0 };
  }

  const score = Math.min(matchCount / 3, 1); // Normalize: 3+ matches = 1.0
  return {
    blocked: score >= 0.33,
    reason: `${rules.blockReason} (matched: ${matchedKeywords.join(', ')})`,
    score,
  };
}

// ---------------------------------------------------------------------------
// GET — ?view=guards|blocks|stats
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'guards';

    switch (view) {
      // ---- List all guards with stats ----------------------------------------
      case 'guards': {
        const guards = await db.wallGuard.findMany({
          orderBy: { createdAt: 'asc' },
          include: {
            _count: { select: { blocks: true } },
          },
        });

        const result = guards.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          category: g.category,
          isActive: g.isActive,
          blockCount: g.blockCount,
          actualBlockCount: g._count.blocks,
          lastBlockedAt: g.lastBlockedAt,
          severity: g.severity,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        }));

        return NextResponse.json({ guards: result, total: result.length });
      }

      // ---- List blocks with optional ?guardId= and date range -----------------
      case 'blocks': {
        const guardId = searchParams.get('guardId');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const where: Record<string, unknown> = {};
        if (guardId) where.guardId = guardId;
        if (from || to) {
          where.createdAt = {};
          if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
          if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
        }

        const blocks = await db.wallBlock.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            guard: {
              select: { id: true, name: true, category: true, severity: true },
            },
          },
        });

        return NextResponse.json({ blocks, total: blocks.length });
      }

      // ---- Aggregate statistics ----------------------------------------------
      case 'stats': {
        const totalGuards = await db.wallGuard.count();
        const activeGuards = await db.wallGuard.count({ where: { isActive: true } });
        const inactiveGuards = totalGuards - activeGuards;
        const totalBlocks = await db.wallBlock.count();

        // Blocks by category
        const guardsByCategory = await db.wallGuard.groupBy({
          by: ['category'],
          _count: { id: true },
          _sum: { blockCount: true },
        });

        // Blocks over last 24h, 7d, 30d
        const now = new Date();
        const last24h = await db.wallBlock.count({
          where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        });
        const last7d = await db.wallBlock.count({
          where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        });
        const last30d = await db.wallBlock.count({
          where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        });

        // Most recent blocks
        const recentBlocks = await db.wallBlock.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            guard: { select: { name: true, category: true, severity: true } },
          },
        });

        // Top blocking guards
        const topGuards = await db.wallGuard.findMany({
          orderBy: { blockCount: 'desc' },
          take: 5,
          select: { id: true, name: true, category: true, blockCount: true },
        });

        return NextResponse.json({
          summary: {
            totalGuards,
            activeGuards,
            inactiveGuards,
            totalBlocks,
            last24h,
            last7d,
            last30d,
          },
          byCategory: guardsByCategory,
          topGuards,
          recentBlocks,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid view. Use: guards, blocks, stats' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Wall GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Test a guard against given action/service/params.
// Evaluates all guards (or a specific one via ?guardId=) and creates a
// WallBlock record if any guard triggers.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guardId = searchParams.get('guardId');

    const body = await request.json();
    const { action, service, params } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const safeParams = (params || {}) as Record<string, unknown>;

    // If a specific guard is given, test only that one
    if (guardId) {
      const guard = await db.wallGuard.findUnique({ where: { id: guardId } });
      if (!guard) {
        return NextResponse.json({ error: 'Guard not found' }, { status: 404 });
      }

      const result = evaluateGuard(guard, action, service || '', safeParams);

      if (result.blocked) {
        const block = await db.wallBlock.create({
          data: {
            guardId: guard.id,
            action,
            service: service || null,
            params: JSON.stringify(safeParams),
            clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
            reason: result.reason,
          },
        });

        await db.wallGuard.update({
          where: { id: guard.id },
          data: {
            blockCount: { increment: 1 },
            lastBlockedAt: new Date(),
          },
        });

        await db.auditLog.create({
          data: {
            userId: auth.payload.userId,
            action: 'wall_block',
            resource: 'wall_guard',
            details: JSON.stringify({ guardId: guard.id, guardName: guard.name, action, reason: result.reason }),
            statusCode: 200,
          },
        });

        return NextResponse.json({
          blocked: true,
          guard: { id: guard.id, name: guard.name, category: guard.category },
          reason: result.reason,
          score: result.score,
          blockId: block.id,
        });
      }

      return NextResponse.json({
        blocked: false,
        guard: { id: guard.id, name: guard.name, category: guard.category },
        reason: result.reason,
        score: result.score,
      });
    }

    // Test against ALL active guards
    const guards = await db.wallGuard.findMany({
      where: { isActive: true },
    });

    const results: Array<{
      guardId: string;
      guardName: string;
      category: string;
      blocked: boolean;
      reason: string;
      score: number;
    }> = [];

    const triggeredBlocks: Array<{
      guardId: string;
      blockId: string;
      reason: string;
    }> = [];

    for (const guard of guards) {
      const result = evaluateGuard(guard, action, service || '', safeParams);
      results.push({
        guardId: guard.id,
        guardName: guard.name,
        category: guard.category,
        blocked: result.blocked,
        reason: result.reason,
        score: result.score,
      });

      if (result.blocked) {
        const block = await db.wallBlock.create({
          data: {
            guardId: guard.id,
            action,
            service: service || null,
            params: JSON.stringify(safeParams),
            clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
            reason: result.reason,
          },
        });

        await db.wallGuard.update({
          where: { id: guard.id },
          data: {
            blockCount: { increment: 1 },
            lastBlockedAt: new Date(),
          },
        });

        triggeredBlocks.push({
          guardId: guard.id,
          blockId: block.id,
          reason: result.reason,
        });
      }
    }

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'wall_test_all',
        resource: 'wall_guard',
        details: JSON.stringify({
          action,
          service,
          guardsTested: guards.length,
          guardsTriggered: triggeredBlocks.length,
        }),
        statusCode: 200,
      },
    });

    return NextResponse.json({
      action,
      service,
      guardsTested: results.length,
      guardsTriggered: triggeredBlocks.length,
      results,
      triggeredBlocks,
    });
  } catch (error) {
    console.error('Wall POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Toggle guard active/inactive (admin only). Pass ?id= in query.
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Guard id is required' }, { status: 400 });
    }

    const existing = await db.wallGuard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Guard not found' }, { status: 404 });
    }

    const updated = await db.wallGuard.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'toggle_wall_guard',
        resource: 'wall_guard',
        details: JSON.stringify({ id, name: existing.name, previousState: existing.isActive, newState: updated.isActive }),
        statusCode: 200,
      },
    });

    return NextResponse.json({
      guard: updated,
      message: updated.isActive ? 'Guard activated' : 'Guard deactivated',
    });
  } catch (error) {
    console.error('Wall PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}