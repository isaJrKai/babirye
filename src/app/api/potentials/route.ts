/**
 * BABIRYE v10.0.0 — Potentials Engine API Routes
 * CRUD for potentials with scenarios, category counts, and keyword exploration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Helper: Score a potential against a query using keyword relevance
// ---------------------------------------------------------------------------
function scorePotential(
  potential: {
    name: string;
    description: string;
    tags: string;
    subcategory: string | null;
    category: string;
  },
  query: string
): number {
  const queryLower = query.toLowerCase().trim();
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

  if (queryTokens.length === 0) return 0;

  const nameLower = potential.name.toLowerCase();
  const descLower = potential.description.toLowerCase();
  const tagsLower = potential.tags.toLowerCase();
  const subcatLower = (potential.subcategory || '').toLowerCase();
  const catLower = potential.category.toLowerCase();

  let score = 0;

  // Name exact match — highest weight
  if (nameLower.includes(queryLower)) {
    score += 10;
  }

  // Token-based matching with weighted fields
  for (const token of queryTokens) {
    if (nameLower.includes(token)) score += 5;
    if (catLower.includes(token)) score += 4;
    if (subcatLower.includes(token)) score += 4;
    if (tagsLower.includes(token)) score += 3;
    if (descLower.includes(token)) score += 2;
  }

  // Normalize by number of tokens to avoid bias toward longer queries
  score /= Math.sqrt(queryTokens.length);

  return score;
}

// ---------------------------------------------------------------------------
// GET — List potentials with filters + special views
//   Default: list with ?category=, ?difficulty=, ?impact=, ?search= filters
//   ?view=categories: return category counts
//   ?view=explore: keyword search with ?query=, scored and sorted
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    // ---- Category counts ----------------------------------------------------
    if (view === 'categories') {
      const categories = await db.potential.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      return NextResponse.json({
        categories: categories.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
        total: categories.reduce((sum, c) => sum + c._count.id, 0),
      });
    }

    // ---- Explore: keyword search across name, description, tags, subcategory
    if (view === 'explore') {
      const query = searchParams.get('query');
      if (!query || query.trim().length === 0) {
        return NextResponse.json({ error: '?query= param is required for explore view' }, { status: 400 });
      }

      const limit = parseInt(searchParams.get('limit') || '20', 10);

      // Fetch all active potentials (SQLite is fast enough for in-memory scoring)
      const allPotentials = await db.potential.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { scenarios: true } },
        },
      });

      // Score each potential
      const scored = allPotentials.map((p) => ({
        ...p,
        scenarioCount: p._count.scenarios,
        relevanceScore: scorePotential(
          {
            name: p.name,
            description: p.description,
            tags: p.tags,
            subcategory: p.subcategory,
            category: p.category,
          },
          query.trim()
        ),
      }));

      // Filter out zero-score results
      const filtered = scored.filter((p) => p.relevanceScore > 0);

      // Sort by relevance descending
      filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Take top N
      const results = filtered.slice(0, limit).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description,
        difficulty: p.difficulty,
        impact: p.impact,
        tags: p.tags,
        scenarioCount: p.scenarioCount,
        relevanceScore: Math.round(p.relevanceScore * 100) / 100,
        createdAt: p.createdAt,
      }));

      return NextResponse.json({
        query: query.trim(),
        results,
        totalMatched: filtered.length,
        returned: results.length,
      });
    }

    // ---- Default: list potentials with filters and scenario counts ----------
    const where: Record<string, unknown> = { isActive: true };

    const categoryFilter = searchParams.get('category');
    const difficultyFilter = searchParams.get('difficulty');
    const impactFilter = searchParams.get('impact');
    const search = searchParams.get('search');

    if (categoryFilter) where.category = categoryFilter;
    if (difficultyFilter) where.difficulty = difficultyFilter;
    if (impactFilter) where.impact = impactFilter;

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
      // Fallback for SQLite which may not support mode:'insensitive' consistently
      // Prisma SQLite uses LIKE which is case-insensitive on some collations
      if (searchLower) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { tags: { contains: search } },
        ];
      }
    }

    const potentials = await db.potential.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { scenarios: true } },
      },
    });

    const result = potentials.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      description: p.description,
      requirements: p.requirements,
      difficulty: p.difficulty,
      impact: p.impact,
      tags: p.tags,
      isActive: p.isActive,
      scenarioCount: p._count.scenarios,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ potentials: result, total: result.length });
  } catch (error) {
    console.error('Potentials GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create potential with scenarios (admin only)
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
    const {
      name,
      category,
      subcategory,
      description,
      requirements,
      difficulty,
      impact,
      tags,
      scenarios,
    } = body;

    if (!name || !category || !description) {
      return NextResponse.json(
        { error: 'name, category, and description are required' },
        { status: 400 }
      );
    }

    const validCategories = [
      'offensive', 'defensive', 'forensic', 'intelligence',
      'vip', 'cyber_kinetic', 'electronic_warfare',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    const validImpacts = ['low', 'medium', 'high', 'critical'];

    const potential = await db.potential.create({
      data: {
        name,
        category,
        subcategory: subcategory || null,
        description,
        requirements: requirements ? JSON.stringify(requirements) : '[]',
        difficulty: validDifficulties.includes(difficulty) ? difficulty : 'intermediate',
        impact: validImpacts.includes(impact) ? impact : 'medium',
        tags: tags ? JSON.stringify(tags) : '[]',
        scenarios: Array.isArray(scenarios)
          ? {
              create: scenarios.map(
                (s: {
                  name: string;
                  description: string;
                  preconditions?: unknown;
                  steps?: unknown;
                  expectedOutcome?: string;
                  riskAssessment?: unknown;
                }) => ({
                  name: s.name,
                  description: s.description || '',
                  preconditions: s.preconditions ? JSON.stringify(s.preconditions) : '[]',
                  steps: s.steps ? JSON.stringify(s.steps) : '[]',
                  expectedOutcome: s.expectedOutcome || null,
                  riskAssessment: s.riskAssessment ? JSON.stringify(s.riskAssessment) : null,
                })
              ),
            }
          : undefined,
      },
      include: { scenarios: true },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'create_potential',
        resource: 'potential',
        details: JSON.stringify({
          potentialId: potential.id,
          name,
          category,
          scenarioCount: potential.scenarios.length,
        }),
        statusCode: 201,
      },
    });

    return NextResponse.json({ potential }, { status: 201 });
  } catch (error) {
    console.error('Potentials POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update potential. Can add scenarios via scenarios array.
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, scenarios, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Potential id is required' }, { status: 400 });
    }

    const existing = await db.potential.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Potential not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (fields.name !== undefined) data.name = fields.name;
    if (fields.category !== undefined) data.category = fields.category;
    if (fields.subcategory !== undefined) data.subcategory = fields.subcategory;
    if (fields.description !== undefined) data.description = fields.description;
    if (fields.requirements !== undefined) data.requirements = JSON.stringify(fields.requirements);
    if (fields.difficulty !== undefined) data.difficulty = fields.difficulty;
    if (fields.impact !== undefined) data.impact = fields.impact;
    if (fields.tags !== undefined) data.tags = JSON.stringify(fields.tags);

    const updated = await db.potential.update({
      where: { id },
      data,
    });

    // Add new scenarios if provided
    let createdScenarios: { count: number } | null = null;
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      createdScenarios = await db.scenario.createMany({
        data: scenarios.map(
          (s: {
            name: string;
            description: string;
            preconditions?: unknown;
            steps?: unknown;
            expectedOutcome?: string;
            riskAssessment?: unknown;
          }) => ({
            potentialId: id,
            name: s.name,
            description: s.description || '',
            preconditions: s.preconditions ? JSON.stringify(s.preconditions) : '[]',
            steps: s.steps ? JSON.stringify(s.steps) : '[]',
            expectedOutcome: s.expectedOutcome || null,
            riskAssessment: s.riskAssessment ? JSON.stringify(s.riskAssessment) : null,
          })
        ),
      });
    }

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'update_potential',
        resource: 'potential',
        details: JSON.stringify({
          id,
          fields: Object.keys(data),
          scenariosAdded: createdScenarios ? createdScenarios.count : 0,
        }),
        statusCode: 200,
      },
    });

    return NextResponse.json({
      potential: updated,
      scenariosAdded: createdScenarios ? createdScenarios.count : 0,
    });
  } catch (error) {
    console.error('Potentials PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Archive potential (sets isActive=false). ?id= in query.
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
      return NextResponse.json({ error: 'Potential id is required' }, { status: 400 });
    }

    const existing = await db.potential.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Potential not found' }, { status: 404 });
    }

    if (!existing.isActive) {
      return NextResponse.json({ error: 'Potential is already archived' }, { status: 400 });
    }

    const archived = await db.potential.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'archive_potential',
        resource: 'potential',
        details: JSON.stringify({ id, name: existing.name }),
        statusCode: 200,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Potential archived',
      potential: archived,
    });
  } catch (error) {
    console.error('Potentials DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}