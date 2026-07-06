/**
 * BABIRYE v10.0.0 — Notifications API
 *
 * GET    /api/notifications               — List notifications for current user. ?type=, ?isRead= filters.
 * GET    /api/notifications?view=count    — Return unread count.
 * PUT    /api/notifications?action=mark_read&id=xxx  — Mark one as read.
 * PUT    /api/notifications?action=mark_all_read     — Mark all as read.
 * DELETE /api/notifications               — Delete a notification.
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

    // ── Unread count view ──────────────────────────────────────────────
    if (searchParams.get('view') === 'count') {
      const typeParam = searchParams.get('type');
      const where: { userId: string; isRead: boolean; type?: string } = {
        userId: auth.payload.userId,
        isRead: false,
      };
      if (typeParam) where.type = typeParam;
      const count = await db.notification.count({ where });
      return NextResponse.json({ unread: count });
    }

    // ── List view ──────────────────────────────────────────────────────
    const where: { userId: string; type?: string; isRead?: boolean } = { userId: auth.payload.userId };

    const typeParam = searchParams.get('type');
    if (typeParam) where.type = typeParam;

    const isReadParam = searchParams.get('isRead');
    if (isReadParam) {
      where.isRead = isReadParam === 'true';
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Mark read / Mark all read
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'mark_all_read') {
      const result = await db.notification.updateMany({
        where: { userId: auth.payload.userId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, marked: result.count });
    }

    if (action === 'mark_read') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
      }

      const existing = await db.notification.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      // Users can only mark their own notifications (or null-user broadcasts)
      if (existing.userId && existing.userId !== auth.payload.userId && auth.payload.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const updated = await db.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unknown action. Use ?action=mark_read&id=xxx or ?action=mark_all_read' }, { status: 400 });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification id is required (query param)' }, { status: 400 });
    }

    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Users can only delete their own notifications (or null-user broadcasts)
    if (existing.userId && existing.userId !== auth.payload.userId && auth.payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.notification.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}