import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters"),
  type: z.enum(['all', 'conversations', 'messages']).default('all')
});

// GET /api/search - Search conversations and messages
export async function GET(request: NextRequest) {
  try {
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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    
    // Validate search parameters
    const validationResult = searchParamsSchema.safeParse({
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || 'all'
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid search parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    
    const { q: searchTerm, type } = validationResult.data;
    
    const results: {
      conversations: Array<{
        id: string;
        title: string | null;
        messageCount: number;
        updatedAt: Date;
        type: 'conversation';
      }>;
      messages: Array<{
        id: string;
        content: string;
        role: 'user' | 'assistant';
        createdAt: Date;
        conversationId: string;
        conversationTitle: string | null;
        type: 'message';
      }>;
    } = {
      conversations: [],
      messages: [],
    };

    // Search conversations
    if (type === 'all' || type === 'conversations') {
      const conversations = await prisma.conversation.findMany({
        where: {
          userId,
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });

      results.conversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messageCount: conv._count.messages,
        updatedAt: conv.updatedAt,
        type: 'conversation',
      }));
    }

    // Search messages
    if (type === 'all' || type === 'messages') {
      const messages = await prisma.message.findMany({
        where: {
          conversation: {
            userId,
          },
          content: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      results.messages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant', // Type assertion based on schema constraints
        createdAt: msg.createdAt,
        conversationId: msg.conversationId,
        conversationTitle: msg.conversation.title,
        type: 'message',
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}