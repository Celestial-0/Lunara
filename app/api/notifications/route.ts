import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
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

    // Generate dynamic notifications based on user activity
    await generateDynamicNotifications(userId);

    // Fetch all notifications after potentially creating new ones
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 30 // Limit to most recent 30 notifications
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Helper function to generate dynamic notifications based on user activity
async function generateDynamicNotifications(userId: string) {
  try {
    const now = new Date();

    // Get user activity data
    const [user, conversationCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.conversation.count({
        where: { userId },
      }),
    ]);

    // Generate milestone notifications
    if (conversationCount === 1) {
      await createNotificationIfNotExists({
        id: `milestone-first-conversation-${userId}`,
        userId,
        type: 'feature',
        title: 'First conversation started! 🎉',
        description: 'Welcome to Lunara! You\'ve started your first conversation.',
        priority: 'high',
      });
    } else if (conversationCount === 5) {
      await createNotificationIfNotExists({
        id: `milestone-5-conversations-${userId}`,
        userId,
        type: 'feature',
        title: 'Great progress! 🚀',
        description: `You've started ${conversationCount} conversations. Keep exploring!`,
        priority: 'medium',
      });
    } else if (conversationCount === 10) {
      await createNotificationIfNotExists({
        id: `milestone-10-conversations-${userId}`,
        userId,
        type: 'feature',
        title: 'Power user! 🔥',
        description: 'You\'ve reached 10 conversations! You\'re really getting the hang of this.',
        priority: 'medium',
      });
    }

    // Welcome notification for new users
    if (user && now.getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000) {
      await createNotificationIfNotExists({
        id: `welcome-${userId}`,
        userId,
        type: 'system',
        title: 'Welcome to Lunara! 👋',
        description: 'Thanks for joining! Explore our features and start a conversation.',
        priority: 'high',
      });
    }

  } catch (error) {
    console.error('Error generating dynamic notifications:', error);
  }
}

// Helper function to create a notification if it doesn't already exist
async function createNotificationIfNotExists(data: {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  priority: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: { id: data.id }
  });

  if (!existing) {
    await prisma.notification.create({
      data: {
        id: data.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        read: false
      }
    });
  }
}