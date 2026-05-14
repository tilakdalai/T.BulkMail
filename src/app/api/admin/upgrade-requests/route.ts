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

// GET: List all upgrade requests (admin only)
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
    const status = searchParams.get('status') || '';

    const where = status ? { status } : {};

    const requests = await db.upgradeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isPremium: true,
          },
        },
      },
    });

    return NextResponse.json({ requests }, { headers: corsHeaders });
  } catch (error) {
    console.error('List upgrade requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create upgrade request (any authenticated user)
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
    const { userId } = body;

    // Use the current user's ID if not provided or different
    const targetUserId = userId || currentUser.id;

    // Only admin can create requests for other users
    if (targetUserId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only create upgrade requests for yourself' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check user exists
    const user = await db.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already premium
    if (user.isPremium) {
      return NextResponse.json(
        { error: 'User is already a premium member' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for existing pending request
    const existingRequest = await db.upgradeRequest.findFirst({
      where: {
        userId: targetUserId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending upgrade request' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create upgrade request
    const upgradeRequest = await db.upgradeRequest.create({
      data: {
        userId: targetUserId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { request: upgradeRequest },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Create upgrade request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT: Handle upgrade request (admin only) - approve or reject
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the upgrade request
    const upgradeRequest = await db.upgradeRequest.findUnique({
      where: { id: requestId },
    });

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: 'Upgrade request not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (upgradeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request has already been ${upgradeRequest.status.toLowerCase()}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update request status
    const updatedRequest = await db.upgradeRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isPremium: true,
          },
        },
      },
    });

    // If approved, set user isPremium to true
    if (status === 'APPROVED') {
      await db.user.update({
        where: { id: upgradeRequest.userId },
        data: { isPremium: true },
      });
    }

    return NextResponse.json(
      { request: updatedRequest },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Handle upgrade request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
