import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/:id - Get a specific notification
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Find notification with ownership check and exclude deleted
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        deleted: false
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/:id - Soft delete a specific notification
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Check if notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        deleted: false
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Soft delete the notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        deleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification soft deleted successfully'
    });
  } catch (error) {
    console.error('Error soft deleting notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
