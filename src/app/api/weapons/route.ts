/**
 * BABIRYE v10.0.0 — Weapons Database API
 *
 * GET    /api/weapons                      — List weapons. ?category= filter.
 * GET    /api/weapons?view=martial_arts    — List martial arts. ?style= filter.
 * POST   /api/weapons                      — Create weapon or martial art (admin).
 * PUT    /api/weapons                      — Update weapon/martial art (admin).
 * DELETE /api/weapons?id=xxx               — Archive weapon (admin).
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
    const view = searchParams.get("view");

    if (view === "martial_arts") {
      const where: Record<string, unknown> = {};
      const style = searchParams.get("style");
      if (style) where.style = style;
      const arts = await db.martialArt.findMany({ where, orderBy: { name: "asc" } });
      return NextResponse.json(arts);
    }

    // Default: list weapons
    const where: Record<string, unknown> = {};
    const category = searchParams.get("category");
    if (category) where.category = category;

    const weapons = await db.weapon.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(weapons);
  } catch (error) {
    console.error("Weapons GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (auth.payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { view, ...data } = body;

    if (view === "martial_arts") {
      const { name, style, origin, description, techniques, difficulty, effectiveness } = data;
      if (!name || !style) {
        return NextResponse.json({ error: "name and style are required" }, { status: 400 });
      }
      const validStyles = ["striking", "grappling", "traditional", "weapons", "hybrid"];
      if (!validStyles.includes(style)) {
        return NextResponse.json({ error: `style must be one of: ${validStyles.join(", ")}` }, { status: 400 });
      }

      const art = await db.martialArt.create({
        data: {
          name,
          style,
          origin: origin || "",
          description: description || "",
          techniques: techniques ? JSON.stringify(techniques) : "[]",
          difficulty: difficulty || "intermediate",
          effectiveness: effectiveness ? JSON.stringify(effectiveness) : "[]",
        },
      });

      await db.auditLog.create({
        data: {
          userId: auth.payload.userId,
          action: "create_martial_art",
          resource: "martial_art",
          details: JSON.stringify({ name, style }),
          statusCode: 201,
        },
      });

      return NextResponse.json(art, { status: 201 });
    }

    // Create weapon
    const { name, category, caliber, range, rateOfFire, magazineCapacity, serialNumber } = data;
    if (!name || !category) {
      return NextResponse.json({ error: "name and category are required" }, { status: 400 });
    }
    const validCategories = [
      "handgun", "rifle", "shotgun", "smg", "lmg", "sniper",
      "explosive", "directed_energy", "missile", "non_lethal", "cyber_kinetic",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${validCategories.join(", ")}` }, { status: 400 });
    }

    const weapon = await db.weapon.create({
      data: {
        name,
        category,
        caliber: caliber || null,
        range: range ? parseFloat(range) : null,
        rateOfFire: rateOfFire || null,
        magazineCapacity: magazineCapacity ? parseInt(magazineCapacity, 10) : null,
        serialNumber: serialNumber || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: "create_weapon",
        resource: "weapon",
        details: JSON.stringify({ name, category }),
        statusCode: 201,
      },
    });

    return NextResponse.json(weapon, { status: 201 });
  } catch (error) {
    console.error("Weapons POST error:", error);
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
    const { id, status, view, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (view === "martial_arts") {
      const data: Record<string, unknown> = {};
      if (updateData.name) data.name = updateData.name;
      if (updateData.style) data.style = updateData.style;
      if (updateData.origin !== undefined) data.origin = updateData.origin;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.techniques) data.techniques = JSON.stringify(updateData.techniques);
      if (updateData.difficulty) data.difficulty = updateData.difficulty;
      if (updateData.effectiveness) data.effectiveness = JSON.stringify(updateData.effectiveness);

      const existing = await db.martialArt.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Martial art not found" }, { status: 404 });

      const updated = await db.martialArt.update({ where: { id }, data });
      return NextResponse.json(updated);
    }

    // Update weapon
    const existing = await db.weapon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) {
      const validStatuses = ["armory", "deployed", "maintenance", "decommissioned"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
      }
      data.status = status;
    }
    if (updateData.lastInspectionAt === true) {
      data.lastInspectionAt = new Date();
    }

    const updated = await db.weapon.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: "update_weapon",
        resource: "weapon",
        details: JSON.stringify({ id, changes: Object.keys(data) }),
        statusCode: 200,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Weapons PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (auth.payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Weapon id is required" }, { status: 400 });
    }

    const existing = await db.weapon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Weapon not found" }, { status: 404 });
    }

    await db.weapon.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: "delete_weapon",
        resource: "weapon",
        details: JSON.stringify({ id, name: existing.name }),
        statusCode: 200,
      },
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Weapons DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}