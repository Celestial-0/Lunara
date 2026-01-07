import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from 'zod';

// Schema for voice chat message validation
const voiceChatSchema = z.object({
    message: z.string().min(1, "Message cannot be empty").max(500, "Message is too long")
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
        const validationResult = voiceChatSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid input',
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const { message } = validationResult.data;

        // Get user preferences for API key
        let preferences = await prisma.userPreferences.findUnique({
            where: { userId },
        });

        // Initialize preferences if they don't exist
        if (!preferences) {
            preferences = await prisma.userPreferences.create({
                data: {
                    userId,
                    aiPersonality: 'friendly',
                    voiceEnabled: true,
                    voiceSpeed: 1.0,
                    voicePitch: 1.0,
                    theme: 'system',
                    messageCount: 0,
                },
            });
        }

        // Determine which API key to use
        const hasPersonalApiKey = preferences.geminiApiKey && preferences.geminiApiKey.trim() !== '';
        const apiKeyToUse = hasPersonalApiKey ? preferences.geminiApiKey! : process.env.GEMINI_API_KEY!;

        // Set the API key for the Google AI SDK
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKeyToUse;

        // Create the AI model
        const model = google('gemma-3-27b-it');

        // Voice-optimized system prompt
        const systemPrompt = "You are Lunara, a friendly AI voice assistant. The user is speaking to you via voice, and your response will be read aloud. Keep responses conversational, concise (under 100 words), and natural for speech. Add personality and warmth to your responses.";

        // Generate response (non-streaming for voice)
        const result = await generateText({
            model,
            system: systemPrompt,
            prompt: message,
            maxRetries: 2,
        });

        const aiResponse = result.text;

        // Return the response for text-to-speech
        return NextResponse.json({
            content: aiResponse,
        });

    } catch (error) {
        console.error('Voice chat API error:', error);

        return NextResponse.json({
            content: "I'm sorry, I'm having trouble responding right now. Please try again.",
            error: 'AI service temporarily unavailable'
        }, { status: 500 });
    }
}
