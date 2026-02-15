/**
 * Vitest Setup File
 * 
 * Configures test environment for Next.js, Prisma, and other modules
 */

import { vi } from 'vitest';

// Set test database URL before any imports
process.env.DATABASE_URL = 'file:./test.db';

// Mock Next.js modules
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
  authOptions: {},
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'loading' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
  cookies: vi.fn(() => ({})),
}));

vi.mock('next/cookies', () => ({
  cookies: vi.fn(() => ({})),
}));

// Mock Prisma Client with test data
vi.mock('@prisma/client', () => {
  // Mock categories data
  const mockCategories = [
    { id: '1', name: 'General', description: '', order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'RRHH', description: '', order: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'Compras', description: '', order: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: '4', name: 'Legal', description: '', order: 4, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Mock prompts data
  const mockPrompts = [
    {
      id: '1',
      title: 'Test Prompt',
      description: 'Description',
      body: 'Body',
      category: 'General',
      tags: '["test"]',
      variablesSchema: '[]',
      examples: '[]',
      status: 'published',
      riskLevel: 'low',
      version: '1',
      useCount: 10,
      thumbsUp: 5,
      thumbsDown: 1,
      isFavorite: false,
      authorId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Create mock instance
  const mockPrismaInstance = {
    category: {
      findMany: vi.fn().mockResolvedValue(mockCategories),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    prompt: {
      findUnique: vi.fn().mockImplementation((args: { where: { id: string } }) => {
        if (args?.where?.id === '1') return Promise.resolve(mockPrompts[0]);
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockResolvedValue(mockPrompts),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(mockPrompts.length),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    promptVersion: {
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
  };

  // Use a proper class constructor for PrismaClient
  class MockPrismaClient {
    category = mockPrismaInstance.category;
    prompt = mockPrismaInstance.prompt;
    user = mockPrismaInstance.user;
    promptVersion = mockPrismaInstance.promptVersion;
  }

  return {
    PrismaClient: MockPrismaClient,
  };
});
