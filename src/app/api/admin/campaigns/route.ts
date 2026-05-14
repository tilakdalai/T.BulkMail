import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: List all campaigns across all users (admin only) with search and pagination
export async function GET(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { subject: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
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
          userId: true,
          logoUrl: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    console.error('Admin list campaigns error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
