/**
 * BABIRYE v10.0.0 — System Settings API
 *
 * GET    /api/settings          — List all settings (secrets masked). ?category= filter.
 * PUT    /api/settings          — Update a setting value. Admin-only for security category.
 * POST   /api/settings          — Create a new setting (admin only).
 * DELETE /api/settings          — Delete a setting (admin only, not for security category).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Mask secret values — show only the last 4 characters.
// ---------------------------------------------------------------------------
function maskValue(value: string): string {
  if (value.length <= 4) return '****';
  return '*'.repeat(value.length - 4) + value.slice(-4);
}

// ---------------------------------------------------------------------------
// GET — List settings
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const settings = await db.systemSetting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // Mask secret values for non-admins, and always mask for response
    const safe = settings.map((s) => ({
      ...s,
      value: s.isSecret ? maskValue(s.value) : s.value,
    }));

    return NextResponse.json(safe);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create setting (admin only)
// ---------------------------------------------------------------------------
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
    const { key, value, category, isSecret, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const validCategories = ['general', 'security', 'network', 'api', 'notification', 'database'];
    const finalCategory = category || 'general';
    if (!validCategories.includes(finalCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 },
      );
    }

    // Check for duplicate key
    const existing = await db.systemSetting.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: 'Setting key already exists. Use PUT to update.' }, { status: 409 });
    }

    const setting = await db.systemSetting.create({
      data: {
        key,
        value: String(value),
        category: finalCategory,
        isSecret: Boolean(isSecret),
        description: description || null,
      },
    });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'create_setting',
        resource: 'system_setting',
        details: JSON.stringify({ key, category: finalCategory, isSecret: setting.isSecret }),
        statusCode: 201,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update setting
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const existing = await db.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Security-category settings require admin
    if (existing.category === 'security' && auth.payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required to update security-category settings' },
        { status: 403 },
      );
    }

    const updated = await db.systemSetting.update({
      where: { key },
      data: {
        value: String(value),
        ...(description !== undefined ? { description } : {}),
      },
    });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'update_setting',
        resource: 'system_setting',
        details: JSON.stringify({ key, category: existing.category }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Delete setting (admin only, not for security category)
// ---------------------------------------------------------------------------
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
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required (query param)' }, { status: 400 });
    }

    const existing = await db.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    if (existing.category === 'security') {
      return NextResponse.json(
        { error: 'Cannot delete security-category settings' },
        { status: 403 },
      );
    }

    await db.systemSetting.delete({ where: { key } });

    // Audit
    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'delete_setting',
        resource: 'system_setting',
        details: JSON.stringify({ key, category: existing.category }),
        statusCode: 200,
      },
    });

    return NextResponse.json({ success: true, deleted: key });
  } catch (error) {
    console.error('Settings DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}