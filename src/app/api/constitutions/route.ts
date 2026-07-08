/**
 * BABIRYE v10.0.0 — Constitutions API
 *
 * GET  /api/constitutions         — List constitutions. ?subsystem= filter.
 * PUT  /api/constitutions         — Update constitution content (admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subsystem = searchParams.get("subsystem");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (subsystem) where.subsystem = subsystem;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } },
        { subsystem: { contains: search } },
      ];
    }

    const constitutions = await db.constitution.findMany({
      where,
      orderBy: { subsystem: "asc" },
    });

    return NextResponse.json(constitutions);
  } catch (error) {
    console.error("Constitutions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (auth.payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, content, name, version, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Constitution id is required" }, { status: 400 });
    }

    const existing = await db.constitution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Constitution not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (content !== undefined) data.content = content;
    if (name !== undefined) data.name = name;
    if (version !== undefined) data.version = version;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await db.constitution.update({
      where: { id },
      data,
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: "update_constitution",
        resource: "constitution",
        details: JSON.stringify({ id, name: existing.name, changes: Object.keys(data) }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Constitutions PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}