import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Extend the session user type to include id
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Validation schema for user preferences
const preferencesSchema = z.object({
  aiPersonality: z.enum(['friendly', 'professional', 'creative', 'analytical', 'empathetic']).optional(),
  voiceEnabled: z.boolean().optional(),
  voiceSpeed: z.number().min(0.5).max(2.0).optional(),
  voicePitch: z.number().min(0.5).max(2.0).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// GET /api/preferences - Get user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        aiPersonality: 'friendly',
        voiceEnabled: true,
        voiceSpeed: 1.0,
        voicePitch: 1.0,
        theme: 'system',
        messageCount: 0,
        hasApiKey: false,
      };
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json({
      aiPersonality: preferences.aiPersonality,
      voiceEnabled: preferences.voiceEnabled,
      voiceSpeed: preferences.voiceSpeed,
      voicePitch: preferences.voicePitch,
      theme: preferences.theme,
      messageCount: preferences.messageCount,
      hasApiKey: Boolean(preferences.geminiApiKey),
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionUser = session.user as SessionUser;
    if (!sessionUser.id) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = preferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: sessionUser.id },
      update: validationResult.data,
      create: {
        userId: sessionUser.id,
        ...validationResult.data,
      },
    });

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: {
        aiPersonality: preferences.aiPersonality,
        voiceEnabled: preferences.voiceEnabled,
        voiceSpeed: preferences.voiceSpeed,
        voicePitch: preferences.voicePitch,
        theme: preferences.theme,
      },
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/preferences - Reset preferences to defaults
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionUser = session.user as SessionUser;
    if (!sessionUser.id) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    await prisma.userPreferences.deleteMany({
      where: { userId: sessionUser.id },
    });

    return NextResponse.json({
      message: 'Preferences reset to defaults',
    });
  } catch (error) {
    console.error('Preferences reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}