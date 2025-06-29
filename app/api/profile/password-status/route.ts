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

// GET /api/profile/password-status - Check if user can change password and their current state
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current user with their accounts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        password: true,
        accounts: {
          select: {
            provider: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isGoogleUser = user.accounts.some(account => account.provider === 'google');
    const hasPassword = !!user.password;

    return NextResponse.json({
      canChangePassword: true, // All users can now change/set password
      hasPassword,
      isGoogleUser,
      requiresCurrentPassword: hasPassword,
      message: hasPassword ? 'change_password' : 'set_password'
    });

  } catch (error) {
    console.error('Password status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
