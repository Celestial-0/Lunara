import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for API key validation
const apiKeySchema = z.object({
  apiKey: z.string().min(1, "API key is required").max(200, "API key is too long")
});

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate request body
    const validationResult = apiKeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { apiKey } = validationResult.data;

    // Test the API key by making a simple request
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Hello" }]
          }]
        }),
      });

      if (!testResponse.ok) {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      console.error('API key validation error:', error);
      return NextResponse.json(
        { error: 'Invalid Gemini API key. Please check your key and try again.' },
        { status: 400 }
      );
    }

    // Update or create user preferences with the API key
    await prisma.userPreferences.upsert({
      where: { userId },
      update: { geminiApiKey: apiKey },
      create: {
        userId,
        aiPersonality: 'friendly',
        voiceEnabled: true,
        voiceSpeed: 1.0,
        voicePitch: 1.0,
        theme: 'system',
        messageCount: 0,
        geminiApiKey: apiKey,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gemini API key saved successfully. You can now continue chatting without limits!'
    });

  } catch (error) {
    console.error('API key save error:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    // Remove the API key
    await prisma.userPreferences.update({
      where: { userId },
      data: { geminiApiKey: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Gemini API key removed successfully'
    });

  } catch (error) {
    console.error('API key removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
