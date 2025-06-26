import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile/stats - Get user statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user statistics
    const [conversationCount, messageCount, user] = await Promise.all([
      prisma.conversation.count({
        where: { userId: session.user.id },
      }),
      prisma.message.count({
        where: {
          conversation: {
            userId: session.user.id,
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { createdAt: true },
      }),
    ]);

    // Calculate days active (days since account creation)
    const daysActive = user?.createdAt 
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate estimated chat time (rough estimate: 2 minutes per message)
    const estimatedChatTimeMinutes = messageCount * 2;
    const chatTimeHours = (estimatedChatTimeMinutes / 60).toFixed(1);

    const stats = {
      conversations: conversationCount,
      messages: messageCount,
      chatTime: `${chatTimeHours}h`,
      daysActive: Math.max(1, daysActive), // At least 1 day
      joinDate: user?.createdAt,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}