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

  // No fixed fallback. NextAuth v4 rejects a missing secret in production.
  // Generate and configure a unique NEXTAUTH_SECRET before deployment.
  secret: process.env.NEXTAUTH_SECRET || undefined,
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
