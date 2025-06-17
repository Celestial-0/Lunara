import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { User } from '@/types/types'
import { z } from 'zod';

// Schemas
const paramsSchema = z.object({ id: z.string().min(1) }); 
const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(Number(val), 100) : 50)),
  cursor: z.string().optional(),
});
const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'assistant']),
  audioUrl: z.string().url().optional(),
});

// Uniform error handler
function errorResponse(message: string, status = 500, details: unknown = null) {
  const payload: { error: string; details?: unknown } = { error: message };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}

// GET /api/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await params per Next.js
  const { id: rawId } = await context.params;

  // Validate auth
  const session = await getServerSession(authOptions) as { user: User } | null;
  if (!session?.user?.id) return errorResponse('Unauthorized', 401);

  // Validate conversation ID
  const parsedParams = paramsSchema.safeParse({ id: rawId });
  if (!parsedParams.success) return errorResponse('Invalid conversation ID', 400);
  const { id } = parsedParams.data;

  // Parse pagination
  const { limit, cursor } = paginationSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  // Verify conversation ownership
  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!convo || convo.userId !== session.user.id) {
    return errorResponse('Conversation not found', 404);
  }

  // Fetch messages with cursor-based pagination
  const items = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = items.length > limit;
  const messages = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  // Set caching & pagination headers
  const headers = {
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Has-More': String(hasMore),
    ...(nextCursor && { 'X-Next-Cursor': nextCursor }),
  };

  return NextResponse.json(messages, { status: 200, headers });
}

// POST /api/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await params per Next.js
  const { id: rawId } = await context.params;

  // Validate auth
  const session = await getServerSession(authOptions) as { user: User } | null;
  if (!session?.user?.id) return errorResponse('Unauthorized', 401);

  // Validate conversation ID
  const parsedParams = paramsSchema.safeParse({ id: rawId });
  if (!parsedParams.success) return errorResponse('Invalid conversation ID', 400);
  const { id } = parsedParams.data;

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const validationResult = createMessageSchema.safeParse(body);
  if (!validationResult.success) {
    return errorResponse('Invalid input', 400, validationResult.error.errors as unknown);
  }
  const { content, role, audioUrl } = validationResult.data;

  // Verify conversation ownership
  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!convo || convo.userId !== session.user.id) {
    return errorResponse('Conversation not found', 404);
  }

  // Transaction: create message & bump timestamp
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId: id, content, role, audioUrl },
    });
    await tx.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  // Location header for new resource
  const headers = { Location: `/api/conversations/${id}/messages/${message.id}` };
  return NextResponse.json(message, { status: 201, headers });
}
