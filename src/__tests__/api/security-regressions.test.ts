import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  currentUser: vi.fn(),
  findPrompt: vi.fn(),
  updatePrompt: vi.fn(),
  findUsage: vi.fn(),
  listUsage: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/auth-utils', () => ({
  getCurrentUser: state.currentUser,
  getUserWithDevFallback: state.currentUser,
  hasRole: (user: { role: string } | null, roles: string[]) =>
    Boolean(user && roles.includes(user.role)),
  canDeletePrompt: (user: { role: string } | null) =>
    Boolean(user && ['owner', 'editor'].includes(user.role)),
  canModifyPrompt: (user: { id: string; role: string } | null, authorId: string, reviewerId?: string) =>
    Boolean(user && (['owner', 'editor'].includes(user.role) ||
      user.id === authorId || (user.role === 'reviewer' && user.id === reviewerId))),
}));

vi.mock('@/services/rate-limit.service', () => ({
  applyRateLimit: vi.fn(() => null),
}));

vi.mock('@/services/audit.service', () => ({
  AuditService: { log: state.audit, logInTransaction: vi.fn() },
}));

vi.mock('@/lib/db', () => ({
  db: {
    prompt: {
      findUnique: state.findPrompt,
      update: state.updatePrompt,
      findMany: vi.fn(),
      count: vi.fn(),
    },
    promptUsage: {
      findFirst: state.findUsage,
      findMany: state.listUsage,
    },
    promptVersion: { findMany: vi.fn() },
    category: { findFirst: vi.fn() },
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { GET as getUser } from '@/app/api/user/route';
import { POST as publish } from '@/app/api/prompts/[id]/publish/route';
import { POST as deprecate } from '@/app/api/prompts/[id]/deprecate/route';
import { POST as submitFeedback, GET as listFeedback } from '@/app/api/prompts/[id]/feedback/route';
import { GET as listVersions } from '@/app/api/prompts/[id]/versions/route';
import { GET as listPrompts } from '@/app/api/prompts/route';
import { GET as readPrompt } from '@/app/api/prompts/[id]/route';
import { POST as signup } from '@/app/api/auth/signup/route';

const ctx = { params: Promise.resolve({ id: 'prompt-123' }) };
const request = (path: string, method = 'GET', body?: unknown) =>
  new NextRequest('http://localhost:3000' + path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { 'Content-Type': 'application/json' },
  });

describe('security regression: unauthenticated requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.currentUser.mockResolvedValue(null);
  });

  it('does not create or reveal an owner through GET /api/user', async () => {
    const response = await getUser();
    expect(response.status).toBe(401);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });

  it('rejects anonymous prompt publishing before database access', async () => {
    const response = await publish(request('/api/prompts/prompt-123/publish', 'POST', { reviewerId: 'forged' }), ctx);
    expect(response.status).toBe(401);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });

  it('rejects anonymous deprecation before database access', async () => {
    const response = await deprecate(request('/api/prompts/prompt-123/deprecate', 'POST', { userId: 'forged' }), ctx);
    expect(response.status).toBe(401);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });

  it('rejects anonymous feedback and usage history', async () => {
    const post = await submitFeedback(request('/api/prompts/prompt-123/feedback', 'POST', { feedback: 'thumbs_up' }), ctx);
    const get = await listFeedback(request('/api/prompts/prompt-123/feedback'), ctx);
    expect(post.status).toBe(401);
    expect(get.status).toBe(401);
  });

  it('rejects anonymous access to historical versions', async () => {
    const response = await listVersions(request('/api/prompts/prompt-123/versions'), ctx);
    expect(response.status).toBe(401);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });

  it('rejects anonymous enumeration of drafts', async () => {
    const response = await listPrompts(request('/api/prompts?status=draft'));
    expect(response.status).toBe(401);
  });

  it('does not expose a draft through a direct GET by id', async () => {
    state.findPrompt.mockResolvedValue({
      id: 'prompt-123', status: 'draft', deletedAt: null, authorId: 'owner', reviewerId: null,
    });
    const response = await readPrompt(request('/api/prompts/prompt-123'), ctx);
    expect(response.status).toBe(404);
  });

  it('disables self-registration unless explicitly enabled', async () => {
    const old = process.env.ENABLE_PUBLIC_SIGNUP;
    delete process.env.ENABLE_PUBLIC_SIGNUP;
    try {
      const response = await signup(request('/api/auth/signup', 'POST', {
        email: 'new@example.invalid', password: 'LongRandomPassword01234!', name: 'Test',
      }));
      expect(response.status).toBe(403);
    } finally {
      if (old === undefined) delete process.env.ENABLE_PUBLIC_SIGNUP;
      else process.env.ENABLE_PUBLIC_SIGNUP = old;
    }
  });
});

describe('security regression: authenticated identity and roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.currentUser.mockResolvedValue({
      id: 'owner-123', role: 'owner', email: 'owner@example.invalid', name: 'Owner',
    });
  });

  it('never discloses a password property from the session profile', async () => {
    state.currentUser.mockResolvedValue({
      id: 'owner-123', role: 'owner', email: 'owner@example.invalid',
      name: 'Owner', password: 'must-not-be-returned',
    });
    const response = await getUser();
    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty('password');
  });

  it('ignores caller-supplied reviewerId during publishing', async () => {
    state.findPrompt.mockResolvedValue({
      id: 'prompt-123', status: 'draft', deletedAt: null,
      authorId: 'other', reviewerId: null, version: '1.0',
    });
    state.updatePrompt.mockResolvedValue({ id: 'prompt-123', status: 'published' });
    const response = await publish(request('/api/prompts/prompt-123/publish', 'POST', {
      reviewerId: 'spoofed-reviewer',
    }), ctx);
    expect(response.status).toBe(200);
    expect(state.updatePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewerId: 'owner-123' }),
      }),
    );
    expect(state.audit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner-123' }),
    );
  });

  it('blocks deprecation by an ordinary user', async () => {
    state.currentUser.mockResolvedValue({ id: 'user-1', role: 'user' });
    const response = await deprecate(request('/api/prompts/prompt-123/deprecate', 'POST', {
      userId: 'owner-123',
    }), ctx);
    expect(response.status).toBe(403);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });

  it('rejects a caller-provided feedback userId', async () => {
    const response = await submitFeedback(request('/api/prompts/prompt-123/feedback', 'POST', {
      feedback: 'thumbs_up', userId: 'victim',
    }), ctx);
    expect(response.status).toBe(400);
    expect(state.findPrompt).not.toHaveBeenCalled();
  });
});
