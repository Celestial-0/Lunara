import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  phone: z.string().optional().nullable().refine((val) => {
    if (!val || val === '') return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, 'Invalid phone number'),
  location: z.string().max(100, 'Location must be less than 100 characters').optional().nullable(),
  website: z.string().optional().nullable().refine((val) => {
    if (!val || val === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid website URL'),
  company: z.string().max(100, 'Company must be less than 100 characters').optional().nullable(),
  jobTitle: z.string().max(100, 'Job title must be less than 100 characters').optional().nullable(),
  avatar: z.string().optional().nullable(),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  showLocation: z.boolean().default(true),
});

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data with profile
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile: user.profile ? {
        bio: user.profile.bio,
        phone: user.profile.phone,
        location: user.profile.location,
        website: user.profile.website,
        company: user.profile.company,
        jobTitle: user.profile.jobTitle,
        avatar: user.profile.avatar,
        showEmail: user.profile.showEmail,
        showPhone: user.profile.showPhone,
        showLocation: user.profile.showLocation,
      } : null,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received profile update data:', body);

    // Clean up empty strings to null for optional fields
    const cleanedBody = {
      ...body,
      bio: body.bio === '' ? null : body.bio,
      phone: body.phone === '' ? null : body.phone,
      location: body.location === '' ? null : body.location,
      website: body.website === '' ? null : body.website,
      company: body.company === '' ? null : body.company,
      jobTitle: body.jobTitle === '' ? null : body.jobTitle,
      avatar: body.avatar === '' ? null : body.avatar,
    };

    // Validate the request body
    const validationResult = profileUpdateSchema.safeParse(cleanedBody);
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      bio,
      phone,
      location,
      website,
      company,
      jobTitle,
      avatar,
      showEmail,
      showPhone,
      showLocation,
    } = validationResult.data;

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user and profile in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          name,
          email,
          image: avatar || undefined,
        },
      });

      // Upsert user profile
      const profile = await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          bio,
          phone,
          location,
          website,
          company,
          jobTitle,
          avatar,
          showEmail,
          showPhone,
          showLocation,
        },
        create: {
          userId: session.user.id,
          bio,
          phone,
          location,
          website,
          company,
          jobTitle,
          avatar,
          showEmail,
          showPhone,
          showLocation,
        },
      });

      return { user, profile };
    });

    console.log('Profile updated successfully:', updatedUser);

    // Return updated profile data
    const responseData = {
      id: updatedUser.user.id,
      name: updatedUser.user.name,
      email: updatedUser.user.email,
      image: updatedUser.user.image,
      emailVerified: updatedUser.user.emailVerified,
      profile: {
        bio: updatedUser.profile.bio,
        phone: updatedUser.profile.phone,
        location: updatedUser.profile.location,
        website: updatedUser.profile.website,
        company: updatedUser.profile.company,
        jobTitle: updatedUser.profile.jobTitle,
        avatar: updatedUser.profile.avatar,
        showEmail: updatedUser.profile.showEmail,
        showPhone: updatedUser.profile.showPhone,
        showLocation: updatedUser.profile.showLocation,
      },
    };

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: responseData,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile - Delete user profile (soft delete)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete user profile data (keep user account for auth)
    await prisma.userProfile.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      message: 'Profile data deleted successfully',
    });
  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}