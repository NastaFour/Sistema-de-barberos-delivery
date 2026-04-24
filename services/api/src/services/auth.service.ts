import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/apiResponse';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'CLIENT' | 'BARBER' | 'ADMIN';
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterInput) {
  // Sanitize email
  const sanitizedEmail = data.email.trim().toLowerCase();

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: sanitizedEmail },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user in transaction
  const user = await prisma.$transaction(async (tx: any) => {
    const newUser = await tx.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role || 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Create barber profile if role is BARBER
    if (data.role === 'BARBER') {
      await tx.barberProfile.create({
        data: {
          userId: newUser.id,
        },
      });
    }

    return newUser;
  });

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user,
    accessToken,
    refreshToken,
  };
}

export async function loginUser(data: LoginInput) {
  const sanitizedEmail = data.email.trim().toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: sanitizedEmail },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.password);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: newAccessToken,
      refreshToken, // Return same refresh token or generate new one
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
      barberProfile: {
        select: {
          id: true,
          bio: true,
          specialty: true,
          yearsExperience: true,
          isVerified: true,
          rating: true,
          totalReviews: true,
          latitude: true,
          longitude: true,
          serviceRadius: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
