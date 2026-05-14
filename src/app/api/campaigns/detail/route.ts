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

// GET: Get campaign detail with email logs
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
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        emailLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check ownership (unless admin)
    if (currentUser.role !== 'ADMIN' && campaign.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json({ campaign }, { headers: corsHeaders });
  } catch (error) {
    console.error('Get campaign detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
