import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import { AIPersonality, Message } from '@/types/types';

// Schema for chat message validation
const chatMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  message: z.string().min(1, "Message cannot be empty").max(10000, "Message is too long")
});

const FREE_MESSAGE_LIMIT = 15;

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
    const validationResult = chatMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { conversationId, message } = validationResult.data;

    // Get conversation with messages for context
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }    // Get user preferences for personality and API key management
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

    // Check message limit and API key availability
    const hasReachedLimit = preferences.messageCount >= FREE_MESSAGE_LIMIT;
    const hasPersonalApiKey = preferences.geminiApiKey && preferences.geminiApiKey.trim() !== '';

    if (hasReachedLimit && !hasPersonalApiKey) {
      return NextResponse.json({
        error: 'FREE_LIMIT_REACHED',
        message: 'You have reached the limit of 15 free messages. Please provide your own Gemini API key to continue.',
        messageCount: preferences.messageCount,
        limit: FREE_MESSAGE_LIMIT
      }, { status: 402 }); // Payment Required
    }

    // Determine which API key to use
    const apiKeyToUse = hasPersonalApiKey ? preferences.geminiApiKey! : process.env.GEMINI_API_KEY!;

    // Set the API key for the Google AI SDK
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKeyToUse;

    // Ensure the personality is valid using type guard
    const validPersonalities: AIPersonality[] = ['friendly', 'professional', 'creative', 'analytical', 'empathetic'];
    const personality: AIPersonality = preferences?.aiPersonality &&
      validPersonalities.includes(preferences.aiPersonality as AIPersonality) ?
      preferences.aiPersonality as AIPersonality :
      'friendly';

    // Define personality prompts
    const personalityPrompts: Record<AIPersonality, string> = {
      friendly: "You are Lunara, a warm, friendly, and supportive AI companion. Be conversational, empathetic, and helpful. Use a casual but respectful tone.",
      professional: "You are Lunara, a professional and efficient AI assistant. Be direct, reliable, and business-focused while remaining helpful and courteous.",
      creative: "You are Lunara, a creative and imaginative AI companion. Be innovative, colorful in your language, and think outside the box while being helpful.",
      analytical: "You are Lunara, a logical and analytical AI assistant. Be precise, data-driven, and provide detailed explanations while being helpful.",
      empathetic: "You are Lunara, an understanding and emotionally aware AI companion. Be compassionate, supportive, and emotionally intelligent while being helpful."
    };

    const systemPrompt = personalityPrompts[personality];

    // Prepare conversation history for AI
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add the new user message to context
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Create the AI model with streaming
    const model = google('gemma-3-27b-it'); // Instruction-tuned Gemma 3 27B

    // Generate streaming response
    const result = streamText({
      model,
      system: systemPrompt,
      messages: conversationHistory,
      async onFinish({ text }) {
        // Save messages to database after streaming completes
        try {
          await Promise.all([
            // Save user message
            prisma.message.create({
              data: {
                conversationId,
                content: message,
                role: 'user',
              },
            }),
            // Save AI response
            prisma.message.create({
              data: {
                conversationId,
                content: text,
                role: 'assistant',
              },
            }),
            // Update conversation timestamp
            prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            }),
            // Increment message count for users using free tier
            !hasPersonalApiKey ? prisma.userPreferences.update({
              where: { userId },
              data: { messageCount: preferences.messageCount + 1 },
            }) : Promise.resolve(),
          ]);

          // Generate title asynchronously if needed
          const shouldGenerateTitle = !conversation.title ||
            conversation.title === "New Conversation" ||
            conversation.messages.length === 0;

          if (shouldGenerateTitle) {
            // Generate title in background
            const titleModel = google('gemma-3-27b-it');
            const titleResult = await streamText({
              model: titleModel,
              prompt: `Based on this conversation starter: "${message}", generate a short, descriptive title (max 50 characters) for this conversation. Only return the title, nothing else.`,
            });

            try {
              const titleText = await titleResult.text;
              let newTitle = titleText.trim().replace(/['"]/g, '');
              if (newTitle.length > 50) {
                newTitle = newTitle.substring(0, 50).trim();
              }
              if (!newTitle) {
                newTitle = "Chat Conversation";
              }
              await prisma.conversation.update({
                where: { id: conversationId },
                data: { title: newTitle },
              });
            } catch (error) {
              console.error('Failed to generate title:', error);
            }
          }
        } catch (error) {
          console.error('Failed to save messages to database:', error);
        }
      },
    });

    // Return the streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    // Fallback response based on personality
    const fallbackResponses: Record<AIPersonality, string> = {
      friendly: "I'm sorry, I'm having a bit of trouble right now. Could you try asking me again?",
      professional: "I apologize, but I'm experiencing technical difficulties. Please try your request again.",
      creative: "Oops! My creative circuits are a bit tangled right now. Mind giving me another chance?",
      analytical: "Error detected in my processing systems. Please retry your query for optimal results.",
      empathetic: "I'm really sorry, but I'm having some technical issues right now. I understand this might be frustrating - please try again."
    };

    return NextResponse.json({
      content: fallbackResponses.friendly,
      error: 'AI service temporarily unavailable'
    }, { status: 500 });
  }
}