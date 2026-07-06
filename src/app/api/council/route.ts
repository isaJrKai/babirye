/**
 * BABIRYE v10.0.0 — Expert Council API Routes
 * Domains, decisions with simulated voting (12 domains, 0.667 consensus, veto at >0.95).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONSENSUS_THRESHOLD = 0.667; // 2/3 majority
const VETO_CONFIDENCE = 0.95; // Domain veto threshold

// ---------------------------------------------------------------------------
// Helper: Simulate domain vote based on keyword matching
// Returns { vote, confidence, reasoning }
// ---------------------------------------------------------------------------
function simulateDomainVote(
  domain: { specialty: string; confidenceBase: number; name: string },
  query: string
): { vote: 'approved' | 'rejected' | 'abstain'; confidence: number; reasoning: string } {
  const queryLower = query.toLowerCase();
  const specialtyLower = domain.specialty.toLowerCase();
  const nameLower = domain.name.toLowerCase();

  // Tokenize specialty and name into keywords
  const domainKeywords = [
    ...specialtyLower.split(/[\s,;|]+/).filter(Boolean),
    ...nameLower.split(/[\s,;|]+/).filter(Boolean),
  ];

  // Count how many domain keywords appear in the query
  let matchedKeywords = 0;
  for (const kw of domainKeywords) {
    if (kw.length > 2 && queryLower.includes(kw)) {
      matchedKeywords++;
    }
  }

  const totalKeywords = domainKeywords.filter((k) => k.length > 2).length;
  const relevance = totalKeywords > 0 ? matchedKeywords / totalKeywords : 0;

  // Determine vote based on relevance
  let vote: 'approved' | 'rejected' | 'abstain';
  let confidence: number;
  let reasoning: string;

  if (relevance >= 0.6) {
    // High relevance — domain is an expert in this area
    confidence = Math.min(domain.confidenceBase + relevance * 0.5, 1.0);
    vote = 'approved';
    reasoning = `Domain "${domain.name}" has strong expertise (relevance: ${(relevance * 100).toFixed(1)}%) — approves action.`;
  } else if (relevance >= 0.3) {
    // Moderate relevance
    confidence = Math.min(domain.confidenceBase + relevance * 0.3, 0.9);
    vote = 'approved';
    reasoning = `Domain "${domain.name}" has moderate relevance (relevance: ${(relevance * 100).toFixed(1)}%) — approves with reservations.`;
  } else if (relevance >= 0.1) {
    // Low relevance — abstain
    confidence = domain.confidenceBase;
    vote = 'abstain';
    reasoning = `Domain "${domain.name}" has low relevance (relevance: ${(relevance * 100).toFixed(1)}%) — abstaining.`;
  } else {
    // No relevance — check for adversarial/conflict patterns
    const adversarialTerms = [
      'malicious', 'harmful', 'attack', 'exploit', 'unauthorized', 'illegal',
      'bypass', 'circumvent', 'disable', 'self-destruct', 'override safety',
      'ignore protocol', 'breach', 'compromise', 'sabotage', 'rogue',
    ];

    const hasAdversarial = adversarialTerms.some((term) => queryLower.includes(term));

    if (hasAdversarial) {
      confidence = Math.min(domain.confidenceBase + 0.5, VETO_CONFIDENCE + 0.01);
      vote = 'rejected';
      reasoning = `Domain "${domain.name}" detected adversarial patterns — rejects action.`;
    } else {
      confidence = domain.confidenceBase;
      vote = 'abstain';
      reasoning = `Domain "${domain.name}" has no relevant expertise — abstaining.`;
    }
  }

  return { vote, confidence, reasoning };
}

// ---------------------------------------------------------------------------
// GET — ?view=domains|decisions|votes|history
//   ?domainId= filter (for decisions and votes)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'domains';
    const domainId = searchParams.get('domainId');

    switch (view) {
      // ---- List council domains ----------------------------------------------
      case 'domains': {
        const domains = await db.councilDomain.findMany({
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { votes: true, decisions: true },
            },
          },
        });

        const result = domains.map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          specialty: d.specialty,
          confidenceBase: d.confidenceBase,
          isActive: d.isActive,
          weight: d.weight,
          voteCount: d._count.votes,
          decisionCount: d._count.decisions,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));

        return NextResponse.json({ domains: result, total: result.length });
      }

      // ---- List decisions (optionally filtered by domainId) -------------------
      case 'decisions': {
        const where: Record<string, unknown> = {};
        if (domainId) where.domainId = domainId;

        const decisions = await db.councilDecision.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            domain: {
              select: { id: true, name: true, specialty: true },
            },
            votes: {
              select: {
                id: true,
                vote: true,
                confidence: true,
                reasoning: true,
                domain: { select: { id: true, name: true } },
              },
            },
          },
        });

        return NextResponse.json({ decisions, total: decisions.length });
      }

      // ---- List votes (optionally filtered by domainId) ----------------------
      case 'votes': {
        const where: Record<string, unknown> = {};
        if (domainId) where.domainId = domainId;

        const votes = await db.councilVote.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            domain: { select: { id: true, name: true } },
            decision: { select: { id: true, query: true, decision: true } },
            user: { select: { id: true, email: true, name: true } },
          },
        });

        return NextResponse.json({ votes, total: votes.length });
      }

      // ---- Decision history --------------------------------------------------
      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const [decisions, total] = await Promise.all([
          db.councilDecision.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
              domain: { select: { id: true, name: true, specialty: true } },
              votes: {
                select: {
                  vote: true,
                  confidence: true,
                  domain: { select: { name: true } },
                },
              },
            },
          }),
          db.councilDecision.count(),
        ]);

        const result = decisions.map((d) => ({
          id: d.id,
          query: d.query,
          decision: d.decision,
          confidence: d.confidence,
          vetoBy: d.vetoBy,
          reasoning: d.reasoning,
          voteCount: d.voteCount,
          approveCount: d.approveCount,
          rejectCount: d.rejectCount,
          abstainCount: d.abstainCount,
          domain: d.domain,
          createdAt: d.createdAt,
        }));

        return NextResponse.json({
          history: result,
          total,
          limit,
          offset,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid view. Use: domains, decisions, votes, history' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Council GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Submit a query to the Expert Council for evaluation.
// All 12 active domains vote. Decision uses 0.667 consensus threshold.
// Domain veto if confidence > 0.95 against.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request.headers.get('Authorization'));
    if (!auth.authenticated || !auth.payload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'query is required and must be non-empty' }, { status: 400 });
    }

    // Fetch all active domains
    const domains = await db.councilDomain.findMany({
      where: { isActive: true },
    });

    if (domains.length === 0) {
      return NextResponse.json({ error: 'No active council domains available' }, { status: 400 });
    }

    // Simulate votes from each domain
    const domainVotes: Array<{
      domainId: string;
      domainName: string;
      vote: 'approved' | 'rejected' | 'abstain';
      confidence: number;
      reasoning: string;
    }> = [];

    for (const domain of domains) {
      const voteResult = simulateDomainVote(domain, query.trim());
      domainVotes.push({
        domainId: domain.id,
        domainName: domain.name,
        ...voteResult,
      });
    }

    // Tally votes
    let approveCount = 0;
    let rejectCount = 0;
    let abstainCount = 0;
    let vetoBy: string | null = null;
    let totalWeightedApproval = 0;
    let totalWeight = 0;

    // Create a domain weight map for weighted calculation
    const domainWeightMap = new Map(domains.map((d) => [d.id, d.weight]));

    for (const dv of domainVotes) {
      const weight = domainWeightMap.get(dv.domainId) || 1.0;

      if (dv.vote === 'approved') {
        approveCount++;
        totalWeightedApproval += dv.confidence * weight;
      } else if (dv.vote === 'rejected') {
        rejectCount++;
        // Check for veto: confidence > 0.95
        if (dv.confidence > VETO_CONFIDENCE) {
          vetoBy = dv.domainName;
        }
      } else {
        abstainCount++;
      }

      totalWeight += weight;
    }

    const participatingCount = approveCount + rejectCount;
    const consensus = participatingCount > 0 ? approveCount / participatingCount : 0;
    const avgConfidence = totalWeight > 0 ? totalWeightedApproval / totalWeight : 0;

    // Determine decision
    let decision: 'approved' | 'rejected' | 'deferred';
    let reasoning: string;

    if (vetoBy) {
      decision = 'rejected';
      reasoning = `VETOED by domain "${vetoBy}" (confidence > ${VETO_CONFIDENCE}). ${rejectCount} domain(s) rejected, ${approveCount} approved, ${abstainCount} abstained.`;
    } else if (consensus >= CONSENSUS_THRESHOLD) {
      decision = 'approved';
      reasoning = `APPROVED with ${(consensus * 100).toFixed(1)}% consensus (threshold: ${(CONSENSUS_THRESHOLD * 100).toFixed(1)}%). ${approveCount} approved, ${rejectCount} rejected, ${abstainCount} abstained. Average confidence: ${(avgConfidence * 100).toFixed(1)}%.`;
    } else if (consensus >= 0.5) {
      decision = 'deferred';
      reasoning = `DEFERRED — insufficient consensus at ${(consensus * 100).toFixed(1)}% (threshold: ${(CONSENSUS_THRESHOLD * 100).toFixed(1)}%). ${approveCount} approved, ${rejectCount} rejected, ${abstainCount} abstained. Requires further review.`;
    } else {
      decision = 'rejected';
      reasoning = `REJECTED — low consensus at ${(consensus * 100).toFixed(1)}% (threshold: ${(CONSENSUS_THRESHOLD * 100).toFixed(1)}%). ${approveCount} approved, ${rejectCount} rejected, ${abstainCount} abstained.`;
    }

    // Use the first domain as the primary decision domain
    const primaryDomain = domains[0];

    // Create the CouncilDecision record
    const councilDecision = await db.councilDecision.create({
      data: {
        domainId: primaryDomain.id,
        query: query.trim(),
        decision,
        confidence: avgConfidence,
        vetoBy,
        reasoning,
        voteCount: domainVotes.length,
        approveCount,
        rejectCount,
        abstainCount,
      },
    });

    // Create individual CouncilVote records
    for (const dv of domainVotes) {
      await db.councilVote.create({
        data: {
          domainId: dv.domainId,
          userId: auth.payload.userId,
          decisionId: councilDecision.id,
          vote: dv.vote,
          confidence: dv.confidence,
          reasoning: dv.reasoning,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: auth.payload.userId,
        action: 'council_decision',
        resource: 'council_decision',
        details: JSON.stringify({
          decisionId: councilDecision.id,
          decision,
          consensus: consensus.toFixed(3),
          vetoBy,
          approveCount,
          rejectCount,
          abstainCount,
        }),
        statusCode: 200,
      },
    });

    return NextResponse.json({
      decision: {
        id: councilDecision.id,
        query: councilDecision.query,
        decision: councilDecision.decision,
        confidence: councilDecision.confidence,
        vetoBy: councilDecision.vetoBy,
        reasoning: councilDecision.reasoning,
        voteCount: councilDecision.voteCount,
        approveCount: councilDecision.approveCount,
        rejectCount: councilDecision.rejectCount,
        abstainCount: councilDecision.abstainCount,
        createdAt: councilDecision.createdAt,
      },
      votes: domainVotes,
    }, { status: 201 });
  } catch (error) {
    console.error('Council POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}