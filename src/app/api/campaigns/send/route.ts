import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractUserFromRequest } from '@/lib/auth';
import { canSendCampaign } from '@/lib/limits';
import { sendBulkEmails } from '@/lib/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST: Send a campaign
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
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find campaign and verify ownership
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (campaign.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to send this campaign' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if campaign is already sent or sending
    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `Campaign is already in ${campaign.status} status` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse receivers from JSON string
    let receivers: Array<{ name: string; email: string }>;
    try {
      receivers = JSON.parse(campaign.receivers);
    } catch {
      return NextResponse.json(
        { error: 'Invalid receivers data in campaign' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!receivers || receivers.length === 0) {
      return NextResponse.json(
        { error: 'No receivers found for this campaign' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check limits
    const canSend = await canSendCampaign(currentUser.id, receivers.length);
    if (!canSend.allowed) {
      return NextResponse.json(
        { error: canSend.reason },
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse attachments
    let attachments: Array<{ filename: string; path: string }> = [];
    try {
      attachments = JSON.parse(campaign.attachments);
    } catch {
      attachments = [];
    }

    // Update status to SENDING
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    // Send bulk emails synchronously
    const result = await sendBulkEmails(receivers, campaign.subject, campaign.content, {
      logoUrl: campaign.logoUrl || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // Create email logs for each result
    const emailLogData = result.results.map((r) => ({
      campaignId,
      receiver: r.receiver,
      receiverName: r.receiverName,
      status: r.status,
      errorMessage: r.errorMessage,
    }));

    // Batch create email logs
    if (emailLogData.length > 0) {
      await db.emailLog.createMany({ data: emailLogData });
    }

    // Update campaign with counts and status
    const finalStatus = result.failedCount === 0 ? 'COMPLETED' : result.sentCount === 0 ? 'FAILED' : 'COMPLETED';
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        status: finalStatus,
      },
    });

    return NextResponse.json(
      {
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        status: finalStatus,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Send campaign error:', error);

    // Try to update campaign status to FAILED
    try {
      const body = await new Response(request.body).json().catch(() => null);
      if (body?.campaignId) {
        await db.campaign.update({
          where: { id: body.campaignId },
          data: { status: 'FAILED' },
        });
      }
    } catch {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: 'Internal server error while sending campaign' },
      { status: 500, headers: corsHeaders }
    );
  }
}
