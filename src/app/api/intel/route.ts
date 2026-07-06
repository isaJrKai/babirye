/**
 * BABIRYE v10.0.0 — Intelligence Feeds API
 *
 * GET    /api/intel?view=feeds              — List all feeds with item count.
 * GET    /api/intel?view=items&feedId=xxx   — List items for a specific feed.
 * POST   /api/intel                          — Create feed (admin) or intel item.
 * PUT    /api/intel                          — Update feed status or trigger fetch.
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

    if (view === "items") {
      const feedId = searchParams.get("feedId");
      if (!feedId) {
        return NextResponse.json({ error: "feedId is required" }, { status: 400 });
      }
      const items = await db.intelItem.findMany({
        where: { feedId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(items);
    }

    // Default: list feeds with item count
    const feeds = await db.intelligenceFeed.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(feeds);
  } catch (error) {
    console.error("Intel GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { feedId, title, description, severity, confidence, tags, ioc } = body;

    // Create intel item
    if (feedId) {
      const feed = await db.intelligenceFeed.findUnique({ where: { id: feedId } });
      if (!feed) {
        return NextResponse.json({ error: "Feed not found" }, { status: 404 });
      }

      const item = await db.intelItem.create({
        data: {
          feedId,
          title: title || "Manual Entry",
          description: description || "",
          severity: severity || "medium",
          confidence: confidence || 0.5,
          tags: tags ? JSON.stringify(tags) : "[]",
          ioc: ioc ? JSON.stringify(ioc) : null,
        },
      });

      await db.intelligenceFeed.update({
        where: { id: feedId },
        data: { itemCount: { increment: 1 } },
      });

      return NextResponse.json(item, { status: 201 });
    }

    // Create feed (admin only)
    if (auth.payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { name, source, feedType, url, apiKey, frequency } = body;
    if (!name || !source || !feedType) {
      return NextResponse.json({ error: "name, source, and feedType are required" }, { status: 400 });
    }

    const validSources = ["omniroute", "iron_sight", "open_threat", "mini_shodan", "custom"];
    const validTypes = ["ioc", "vulnerability", "malware", "threat_actor", "dark_web", "geo_political"];
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: `source must be one of: ${validSources.join(", ")}` }, { status: 400 });
    }
    if (!validTypes.includes(feedType)) {
      return NextResponse.json({ error: `feedType must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const feed = await db.intelligenceFeed.create({
      data: {
        name,
        source,
        feedType,
        url: url || null,
        apiKey: apiKey || null,
        frequency: frequency || "hourly",
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: "create_intel_feed",
        resource: "intelligence_feed",
        details: JSON.stringify({ name, source, feedType }),
        statusCode: 201,
      },
    });

    return NextResponse.json(feed, { status: 201 });
  } catch (error) {
    console.error("Intel POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get("Authorization"));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Feed id is required" }, { status: 400 });
    }

    const existing = await db.intelligenceFeed.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    // Toggle active status
    if (isActive !== undefined) {
      const updated = await db.intelligenceFeed.update({
        where: { id },
        data: { isActive },
      });
      return NextResponse.json(updated);
    }

    // Simulate fetch action
    if (action === "fetch") {
      const updated = await db.intelligenceFeed.update({
        where: { id },
        data: {
          lastFetchedAt: new Date(),
          lastError: null,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No valid update action specified" }, { status: 400 });
  } catch (error) {
    console.error("Intel PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}