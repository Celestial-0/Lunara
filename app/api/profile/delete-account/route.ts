import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Extend the session type to include the id
interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// DELETE /api/profile/delete-account - Permanently delete user account and all related data
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete the user and all related data in a transaction
    // Due to onDelete: Cascade in the schema, this will automatically delete:
    // - UserProfile
    // - UserPreferences  
    // - Conversations and their Messages
    // - Notifications
    // - Sessions
    // - Accounts (OAuth connections)
    await prisma.$transaction(async (tx) => {
      // First, delete the user - this will cascade to all related data
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}
