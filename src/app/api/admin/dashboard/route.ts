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

// GET: Get admin dashboard stats
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

    // Run all queries in parallel for performance
    const [
      totalUsers,
      totalCampaigns,
      totalEmailsSent,
      premiumUsersCount,
      recentCampaigns,
      draftCampaigns,
      sendingCampaigns,
      completedCampaigns,
      failedCampaigns,
      scheduledCampaigns,
      pendingUpgradeRequests,
    ] = await Promise.all([
      // Total users
      db.user.count(),
      // Total campaigns
      db.campaign.count(),
      // Total emails sent (sum of sentCount)
      db.campaign.aggregate({
        _sum: { sentCount: true },
      }),
      // Premium users count
      db.user.count({ where: { isPremium: true } }),
      // Recent 5 campaigns with user info
      db.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          status: true,
          sentCount: true,
          failedCount: true,
          totalCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      // Draft campaigns
      db.campaign.count({ where: { status: 'DRAFT' } }),
      // Sending campaigns
      db.campaign.count({ where: { status: 'SENDING' } }),
      // Completed campaigns
      db.campaign.count({ where: { status: 'COMPLETED' } }),
      // Failed campaigns
      db.campaign.count({ where: { status: 'FAILED' } }),
      // Scheduled campaigns
      db.campaign.count({ where: { status: 'SCHEDULED' } }),
      // Pending upgrade requests
      db.upgradeRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const stats = {
      totalUsers,
      totalCampaigns,
      totalEmailsSent: totalEmailsSent._sum.sentCount || 0,
      premiumUsersCount,
      pendingUpgradeRequests,
      campaignStatsByStatus: {
        DRAFT: draftCampaigns,
        SENDING: sendingCampaigns,
        COMPLETED: completedCampaigns,
        FAILED: failedCampaigns,
        SCHEDULED: scheduledCampaigns,
      },
      recentCampaigns,
    };

    return NextResponse.json({ stats }, { headers: corsHeaders });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
