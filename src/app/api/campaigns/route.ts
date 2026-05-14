import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';
import { canSendCampaign } from '@/lib/limits';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: List user's campaigns with search and pagination
export async function GET(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where = {
      userId: currentUser.id,
      ...(search
        ? {
            OR: [
              { subject: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
    };

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          content: true,
          sentCount: true,
          failedCount: true,
          totalCount: true,
          status: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
          receivers: true,
          attachments: true,
          logoUrl: true,
          userId: true,
        },
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json(
      {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('List campaigns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create a new campaign
export async function POST(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { subject, content, receivers, attachments, logoUrl, scheduledAt } = body;

    // Validate required fields
    if (!subject || !content || !receivers || !Array.isArray(receivers)) {
      return NextResponse.json(
        { error: 'Subject, content, and receivers array are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate receivers format
    for (const receiver of receivers) {
      if (!receiver.email) {
        return NextResponse.json(
          { error: 'Each receiver must have an email address' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Check if user can send this campaign
    const canSend = await canSendCampaign(currentUser.id, receivers.length);
    if (!canSend.allowed) {
      return NextResponse.json(
        { error: canSend.reason },
        { status: 403, headers: corsHeaders }
      );
    }

    // Determine status
    const status = scheduledAt ? 'SCHEDULED' : 'DRAFT';

    // Create campaign
    const campaign = await db.campaign.create({
      data: {
        userId: currentUser.id,
        subject,
        content,
        receivers: JSON.stringify(receivers),
        attachments: JSON.stringify(attachments || []),
        logoUrl: logoUrl || '',
        totalCount: receivers.length,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status,
      },
    });

    return NextResponse.json({ campaign }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
