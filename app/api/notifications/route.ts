import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get user notifications with optimized pagination
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100); // Max 100
    const includeRead = searchParams.get('includeRead') === 'true';
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

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

    // Generate dynamic notifications based on user activity (optimized)
    await generateDynamicNotifications(userId);    // Build optimized query with filters
    const whereClause: {
      userId: string;
      deleted: boolean;
      read?: boolean;
      type?: string;
      priority?: string;
    } = {
      userId,
      deleted: false, // Only non-deleted notifications
    };

    if (!includeRead) {
      whereClause.read = false;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    // Get total count for pagination (optimized with index)
    const totalCount = await prisma.notification.count({
      where: whereClause
    });    // Fetch notifications with optimized query
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: [
        { read: 'asc' },        // Unread first
        { priority: 'desc' },   // High priority first  
        { createdAt: 'desc' }   // Newest first
      ],
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        read: true,
        readAt: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        deleted: true,
        deletedAt: true
      }
    });

    // Get unread count efficiently
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
        deleted: false
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      unreadCount,
      metadata: {
        lastUpdated: new Date().toISOString(),
        filters: { includeRead, type, priority }
      }
    });
  } catch (error) {    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Soft delete all notifications for user
export async function DELETE() {
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

    // Soft delete all user notifications
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        deleted: false
      },
      data: {
        deleted: true,
        deletedAt: new Date()
      }
    });    return NextResponse.json({
      success: true,
      message: `Soft deleted ${result.count} notifications`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Error soft deleting notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optimized helper function to generate dynamic notifications
async function generateDynamicNotifications(userId: string) {
  try {
    const now = new Date();

    // Use parallel queries for better performance
    const [user, conversationCount, existingNotifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.conversation.count({
        where: { userId },
      }),
      // Check existing milestone notifications to avoid duplicates
      prisma.notification.findMany({
        where: {
          userId,
          type: 'feature',
          deleted: false,
          OR: [
            { id: { startsWith: `milestone-first-conversation-${userId}` } },
            { id: { startsWith: `milestone-5-conversations-${userId}` } },
            { id: { startsWith: `milestone-10-conversations-${userId}` } },
            { id: { startsWith: `welcome-${userId}` } }
          ]
        },
        select: { id: true }
      })
    ]);

    const existingIds = new Set(existingNotifications.map(n => n.id));

    // Generate milestone notifications efficiently
    const notificationsToCreate = [];

    if (conversationCount === 1 && !existingIds.has(`milestone-first-conversation-${userId}`)) {
      notificationsToCreate.push({
        id: `milestone-first-conversation-${userId}`,
        userId,
        type: 'feature',
        title: 'First conversation started! 🎉',
        description: 'Welcome to Lunara! You\'ve started your first conversation.',
        priority: 'high',
      });
    } else if (conversationCount === 5 && !existingIds.has(`milestone-5-conversations-${userId}`)) {
      notificationsToCreate.push({
        id: `milestone-5-conversations-${userId}`,
        userId,
        type: 'feature',
        title: 'Great progress! 🚀',
        description: `You've started ${conversationCount} conversations. Keep exploring!`,
        priority: 'medium',
      });
    } else if (conversationCount === 10 && !existingIds.has(`milestone-10-conversations-${userId}`)) {
      notificationsToCreate.push({
        id: `milestone-10-conversations-${userId}`,
        userId,
        type: 'feature',
        title: 'Power user! 🔥',
        description: 'You\'ve reached 10 conversations! You\'re really getting the hang of this.',
        priority: 'medium',
      });
    }

    // Welcome notification for new users
    if (user && now.getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000 && 
        !existingIds.has(`welcome-${userId}`)) {
      notificationsToCreate.push({
        id: `welcome-${userId}`,
        userId,
        type: 'system',
        title: 'Welcome to Lunara! 👋',
        description: 'Thanks for joining! Explore our features and start a conversation.',
        priority: 'high',
      });
    }

    // Batch create notifications if any
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate.map(n => ({
          ...n,
          read: false,
          deleted: false
        })),
        skipDuplicates: true
      });
    }

  } catch (error) {
    console.error('Error generating dynamic notifications:', error);
  }
}