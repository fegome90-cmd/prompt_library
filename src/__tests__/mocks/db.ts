/**
 * Mock Prisma Client for Tests
 */

import { vi } from 'vitest';

// Mock Prisma client
const mockPrompt = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
};

const mockUser = {
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockCategory = {
  findMany: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
};

const mockPromptVersion = {
  create: vi.fn(),
  delete: vi.fn(),
};

export const db = {
  prompt: mockPrompt,
  user: mockUser,
  category: mockCategory,
  promptVersion: mockPromptVersion,
};
