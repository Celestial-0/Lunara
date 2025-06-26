import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/types/types';

// POST /api/profile/avatar - Upload avatar (placeholder for file upload)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AuthUser;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // TODO: Implement actual file upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll simulate the upload and return a placeholder URL
    const avatarUrl = `https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Lunara%20AI%20Icon.PNG`;

    // Update user profile with new avatar URL
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { avatar: avatarUrl },
      create: {
        userId: user.id,
        avatar: avatarUrl,
      },
    });

    // Also update user image for consistency
    await prisma.user.update({
      where: { id: user.id },
      data: { image: avatarUrl },
    });

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AuthUser;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove avatar from profile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: { avatar: null },
      create: {
        userId: user.id,
        avatar: null,
      },
    });

    // Also remove from user image
    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    });

    return NextResponse.json({
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}