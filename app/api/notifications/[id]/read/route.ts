import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/notifications/:id/read - Mark a notification as read
export async function PUT(
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

    // Check if notification exists, belongs to the user, and isn't deleted
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

    // Only update if not already read (optimization)
    if (notification.read) {
      return NextResponse.json({
        success: true,
        data: notification,
        message: 'Notification already marked as read'
      });
    }

    // Update notification to mark as read with timestamp
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        read: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}