import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for message updates
const updateMessageSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  audioUrl: z.string().url().optional().nullable(),
});

// GET /api/messages/[id] - Get a specific message
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;    const message = await prisma.message.findFirst({
      where: {
        id,
        conversation: {
          userId,
        },
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      role: message.role,
      audioUrl: message.audioUrl,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error('Message fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/messages/[id] - Update a message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;

    const body = await request.json();
    const validationResult = updateMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        conversation: {
          userId,
        },
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Message update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        conversation: {
          userId,
        },
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Message deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}