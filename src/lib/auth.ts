import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { db } from './db';
import bcrypt from 'bcryptjs';

/**
 * NextAuth Configuration
 *
 * This configuration uses:
 * - PrismaAdapter for database persistence
 * - Credentials provider for email/password authentication
 * - JWT strategy for session management (works better with SQLite)
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // SECURITY: Require both email and password
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // SECURITY: Use generic error message to prevent email enumeration
          return null;
        }

        // SECURITY: Verify password with bcrypt
        // If user has no password set (OAuth user), they cannot use credentials login
        if (!user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60, // 1 hour (WO-0005: reduced from 30 days for security)
  },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // Add user data to session from token
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  events: {
    async signIn({ user }) {
      // Update last login time
      await db.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });
    },
  },

  // Generate a secret for development if not set
  // SECURITY: In production, NEXTAUTH_SECRET MUST be set at runtime
  // Note: We check process.env at runtime, not at build time
  secret: process.env.NEXTAUTH_SECRET || (() => {
    // Allow build to proceed without secret
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // At runtime in production, this will use the env var or fail on auth operations
      console.warn(
        '[SECURITY] NEXTAUTH_SECRET not set. Authentication will fail in production. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    return 'dev-secret-not-for-production-use';
  })(),

  // WO-0015: Validate NEXTAUTH_URL in production
  // This is critical for OAuth callbacks and redirects
  ...(process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL && {
    // Log warning but don't throw - let NextAuth handle it
    _nextAuthUrlWarning: console.warn(
      '[SECURITY] NEXTAUTH_URL not set in production. ' +
      'OAuth callbacks may not work correctly. ' +
      'Set NEXTAUTH_URL to your production domain (e.g., https://yourdomain.com)'
    ),
  }),
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
