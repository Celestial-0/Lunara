import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ExportData } from '@/types/types';

// Validation schema for export parameters
const exportParamsSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  type: z.enum(['all', 'conversations', 'profile']).default('all'),
});

// GET /api/export - Export user data
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
    
    // Validate and process query parameters
    const validationResult = exportParamsSchema.safeParse({
      format: searchParams.get('format') || 'json',
      type: searchParams.get('type') || 'all'
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    
    const { format, type } = validationResult.data;
    
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      userId,
    };

    // Export user profile
    if (type === 'all' || type === 'profile') {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          preferences: true,
        },
      });

      if (userData) {
        exportData.profile = {
          name: userData.name,
          email: userData.email,
          createdAt: userData.createdAt,
          profile: userData.profile,
          preferences: userData.preferences,
        };
      }
    }

    // Export conversations and messages
    if (type === 'all' || type === 'conversations') {
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      exportData.conversations = conversations;
    }

    if (format === 'json') {
      return NextResponse.json(exportData);
    } else    if (format === 'csv') {
      // For CSV format, we'll focus on conversations and messages
      let csvContent = 'Conversation ID,Conversation Title,Message ID,Role,Content,Created At\n';
      
      if (exportData.conversations) {
        exportData.conversations.forEach((conv) => {
          conv.messages.forEach((msg) => {
            const row = [
              conv.id,
              conv.title || 'Untitled',
              msg.id,
              msg.role,
              `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes
              msg.createdAt,
            ].join(',');
            csvContent += row + '\n';
          });
        });
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="Lunara-export.csv"',
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}