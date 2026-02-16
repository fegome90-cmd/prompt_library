/**
 * Signup API Endpoint
 *
 * Creates a new user with hashed password.
 *
 * WO-0103: Part of password verification implementation
 */

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

// Password hashing configuration
const SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with all required fields
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        email,
        password: hashedPassword,
        name,
        role: 'user', // Default role
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // SECURITY: Log signup (without password)
    logger.info('[AUTH] New user registered', { email });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Error al registrar usuario');
  }
}
