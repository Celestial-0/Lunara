import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { AIPersonality, Message } from '@/types/types';

// Schema for chat message validation
const chatMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  message: z.string().min(1, "Message cannot be empty").max(10000, "Message is too long")
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    }    // Get user preferences for personality
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Ensure the personality is valid using type guard
    const validPersonalities: AIPersonality[] = ['friendly', 'professional', 'creative', 'analytical', 'empathetic'];
    const personality: AIPersonality = preferences?.aiPersonality &&
      validPersonalities.includes(preferences.aiPersonality as AIPersonality) ?
      preferences.aiPersonality as AIPersonality :
      'friendly';// Save user message first
    await prisma.message.create({
      data: {
        conversationId,
        content: message,
        role: 'user',
      },
    });    // Prepare context for AI
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role as Message['role'],
      content: msg.content,
    }));

    // Add the new user message to context
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Generate AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); const personalityPrompts: Record<AIPersonality, string> = {
      friendly: "You are Lunara, a warm, friendly, and supportive AI companion. Be conversational, empathetic, and helpful. Use a casual but respectful tone.",
      professional: "You are Lunara, a professional and efficient AI assistant. Be direct, reliable, and business-focused while remaining helpful and courteous.",
      creative: "You are Lunara, a creative and imaginative AI companion. Be innovative, colorful in your language, and think outside the box while being helpful.",
      analytical: "You are Lunara, a logical and analytical AI assistant. Be precise, data-driven, and provide detailed explanations while being helpful.",
      empathetic: "You are Lunara, an understanding and emotionally aware AI companion. Be compassionate, supportive, and emotionally intelligent while being helpful."
    };

    const systemPrompt = personalityPrompts[personality];

    const contextPrompt = conversationHistory.length > 1
      ? `\n\nConversation history:\n${conversationHistory.slice(0, -1).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
      : `User: ${message}`;

    const fullPrompt = `${systemPrompt}${contextPrompt}\n\nLunara:`;

    const result = await model.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    // Save AI response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        content: aiResponse,
        role: 'assistant',
      },
    });    // Generate conversation title if this is the first exchange or title is still "New Conversation"
    let conversationTitle = conversation.title;
    const shouldGenerateTitle = !conversationTitle ||
      conversationTitle === "New Conversation" ||
      conversation.messages.length === 0;

    if (shouldGenerateTitle) {
      try {
        const titlePrompt = `Based on this conversation starter: "${message}", generate a short, descriptive title (max 50 characters) for this conversation. Only return the title, nothing else.`;
        const titleResult = await model.generateContent(titlePrompt);
        conversationTitle = titleResult.response.text().trim().replace(/['"]/g, '');

        // Limit title length and ensure it's not empty
        if (conversationTitle.length > 50) {
          conversationTitle = conversationTitle.substring(0, 50).trim();
        }
        if (!conversationTitle) {
          conversationTitle = "Chat Conversation";
        }

        // Update conversation with generated title
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: conversationTitle },
        });
      } catch (error) {
        console.error('Failed to generate title:', error);
        conversationTitle = conversation.title || "Chat Conversation";
      }
    }

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      content: aiResponse,
      title: conversationTitle,
      messageId: assistantMessage.id,
    });

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