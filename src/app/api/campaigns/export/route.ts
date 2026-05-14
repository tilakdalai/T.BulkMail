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

// GET: Export email logs as CSV
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
    const campaignId = searchParams.get('campaignId');

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

    if (campaign.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to export this campaign' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get all email logs for the campaign
    const emailLogs = await db.emailLog.findMany({
      where: { campaignId },
      orderBy: { sentAt: 'desc' },
    });

    // Generate CSV string
    const csvHeaders = 'Receiver Name,Receiver Email,Status,Error Message,Sent At';
    const csvRows = emailLogs.map((log) => {
      const name = `"${(log.receiverName || '').replace(/"/g, '""')}"`;
      const email = `"${log.receiver.replace(/"/g, '""')}"`;
      const status = log.status;
      const errorMessage = `"${(log.errorMessage || '').replace(/"/g, '""')}"`;
      const sentAt = log.sentAt.toISOString();
      return `${name},${email},${status},${errorMessage},${sentAt}`;
    });

    const csvString = [csvHeaders, ...csvRows].join('\n');

    // Generate filename
    const sanitizedSubject = campaign.subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `campaign_${sanitizedSubject}_logs.csv`;

    return new NextResponse(csvString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
