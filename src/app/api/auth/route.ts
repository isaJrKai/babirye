/**
 * BABIRYE v10.0.0 — Authentication API Routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { createUser, verifyCredentials, createSessionToken, authenticateRequest, listUserTokens, revokeToken, createApiToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      const result = await verifyCredentials(email, password);
      if (!result.success || !result.user) return NextResponse.json({ error: result.error, remainingAttempts: result.remainingAttempts }, { status: 401 });
      const token = await createSessionToken({ id: result.user.id, email: result.user.email, role: result.user.role });
      const { passwordHash, ...safeUser } = result.user;
      await db.auditLog.create({ data: { userId: result.user.id, action: 'login', resource: 'auth', details: '{"method":"password"}', ipAddress: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent'), statusCode: 200 } });
      return NextResponse.json({ user: safeUser, token });
    }
    if (action === 'logout') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (auth.authenticated && auth.payload) await db.auditLog.create({ data: { userId: auth.payload.userId, action: 'logout', resource: 'auth', details: '{}', statusCode: 200 } });
      return NextResponse.json({ success: true });
    }
    if (action === 'refresh') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      const user = await db.user.findUnique({ where: { id: auth.payload.userId }, select: { id: true, email: true, role: true, isActive: true } });
      if (!user || !user.isActive) return NextResponse.json({ error: 'User not found or disabled' }, { status: 401 });
      return NextResponse.json({ token: await createSessionToken(user) });
    }
    if (action === 'create_token') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const { name, purpose, ttl } = body;
      if (!name) return NextResponse.json({ error: 'Token name required' }, { status: 400 });
      const rawToken = await createApiToken(auth.payload.userId, name, purpose, ttl || 28800);
      await db.auditLog.create({ data: { userId: auth.payload.userId, action: 'create_api_token', resource: 'api_token', details: JSON.stringify({ name, purpose }), statusCode: 200 } });
      return NextResponse.json({ token: rawToken, message: 'Save this token - it will not be shown again' });
    }
    if (action === 'setup') {
      const userCount = await db.user.count();
      if (userCount > 0) return NextResponse.json({ error: 'System already initialized' }, { status: 400 });
      const { email, password, name } = body;
      if (!email || !password || !name) return NextResponse.json({ error: 'Email, password, and name required' }, { status: 400 });
      if (password.length < 12) return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
      const user = await createUser(email, password, name, 'admin');
      const token = await createSessionToken({ id: user.id, email: user.email, role: user.role });
      const { passwordHash, ...safeUser } = user;
      return NextResponse.json({ user: safeUser, token });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) { console.error('Auth POST error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'me';
    if (view === 'me') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      const user = await db.user.findUnique({ where: { id: auth.payload.userId }, select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, mfaEnabled: true } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json(user);
    }
    if (view === 'tokens') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      return NextResponse.json(await listUserTokens(auth.payload.userId));
    }
    if (view === 'users') {
      const auth = await authenticateRequest(request.headers.get('Authorization'));
      if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      if (auth.payload.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      return NextResponse.json(await db.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, failedAttempts: true, lockedUntil: true }, orderBy: { createdAt: 'desc' } }));
    }
    if (view === 'setup_required') return NextResponse.json({ setupRequired: (await db.user.count()) === 0 });
    return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  } catch (error) { console.error('Auth GET error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('token_id');
    if (!tokenId) return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    return NextResponse.json({ success: await revokeToken(tokenId, auth.payload.userId) });
  } catch (error) { console.error('Auth DELETE error:', error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}