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

// GET: List user's email templates
export async function GET(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const templates = await db.emailTemplate.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates }, { headers: corsHeaders });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create template
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
    const { name, subject, content } = body;

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Name, subject, and content are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const template = await db.emailTemplate.create({
      data: {
        userId: currentUser.id,
        name,
        subject,
        content,
      },
    });

    return NextResponse.json(
      { template },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT: Update template
export async function PUT(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { id, name, subject, content } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify template ownership
    const existingTemplate = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existingTemplate.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this template' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Build update data
    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (content) updateData.content = content;

    const template = await db.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template }, { headers: corsHeaders });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE: Delete template
export async function DELETE(request: Request) {
  try {
    const currentUser = await extractUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify template ownership
    const existingTemplate = await db.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existingTemplate.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this template' },
        { status: 403, headers: corsHeaders }
      );
    }

    await db.emailTemplate.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
