import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT() {
  try {
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

    // Update all unread, non-deleted notifications for the user
    const { count } = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        deleted: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to mark all notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}