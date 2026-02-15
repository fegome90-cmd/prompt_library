/**
 * Validators Tests
 * 
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import { 
  createPromptSchema, 
  updatePromptSchema, 
  feedbackSchema,
  formatZodError 
} from '@/lib/validators/prompt';

describe('createPromptSchema', () => {
  it('should validate valid prompt', () => {
    const validPrompt = {
      title: 'Test Prompt',
      description: 'Test description',
      body: 'Prompt body content',
      category: 'General',
      tags: ['test', 'ai'],
    };
    const result = createPromptSchema.safeParse(validPrompt);
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const invalidPrompt = {
      title: '',
      body: 'Body',
      category: 'General',
    };
    const result = createPromptSchema.safeParse(invalidPrompt);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title');
    }
  });

  it('should reject title too long', () => {
    const invalidPrompt = {
      title: 'a'.repeat(201),
      body: 'Body',
      category: 'General',
    };
    const result = createPromptSchema.safeParse(invalidPrompt);
    expect(result.success).toBe(false);
  });

  it('should reject empty body', () => {
    const invalidPrompt = {
      title: 'Test',
      body: '',
      category: 'General',
    };
    const result = createPromptSchema.safeParse(invalidPrompt);
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const invalidPrompt = {
      title: 'Test',
      body: 'Body',
      category: '',
    };
    const result = createPromptSchema.safeParse(invalidPrompt);
    expect(result.success).toBe(false);
  });

  it('should reject invalid riskLevel', () => {
    const invalidPrompt = {
      title: 'Test',
      body: 'Body',
      category: 'General',
      riskLevel: 'invalid',
    };
    const result = createPromptSchema.safeParse(invalidPrompt);
    expect(result.success).toBe(false);
  });

  it('should apply defaults', () => {
    const minimalPrompt = {
      title: 'Test',
      body: 'Body',
      category: 'General',
    };
    const result = createPromptSchema.safeParse(minimalPrompt);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.tags).toEqual([]);
      expect(result.data.riskLevel).toBe('low');
    }
  });
});

describe('updatePromptSchema', () => {
  it('should allow partial updates', () => {
    const partialUpdate = {
      title: 'New Title',
    };
    const result = updatePromptSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate partial data', () => {
    const invalidUpdate = {
      title: '',
    };
    const result = updatePromptSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });

  it('should allow all optional fields', () => {
    const fullUpdate = {
      title: 'Updated',
      description: 'New description',
      body: 'New body',
      category: 'RRHH',
      tags: ['updated'],
      riskLevel: 'high',
      isFavorite: true,
    };
    const result = updatePromptSchema.safeParse(fullUpdate);
    expect(result.success).toBe(true);
  });
});

describe('feedbackSchema', () => {
  it('should validate thumbs_up', () => {
    const validFeedback = {
      feedback: 'thumbs_up',
    };
    const result = feedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
  });

  it('should validate thumbs_down', () => {
    const validFeedback = {
      feedback: 'thumbs_down',
    };
    const result = feedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
  });

  it('should allow null feedback', () => {
    const validFeedback = {
      feedback: null,
    };
    const result = feedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
  });

  it('should validate comment length', () => {
    const invalidFeedback = {
      comment: 'a'.repeat(201),
    };
    const result = feedbackSchema.safeParse(invalidFeedback);
    expect(result.success).toBe(false);
  });

  it('should validate dataRiskLevel', () => {
    const validFeedback = {
      dataRiskLevel: 'medium',
    };
    const result = feedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
  });

  it('should reject invalid dataRiskLevel', () => {
    const invalidFeedback = {
      dataRiskLevel: 'critical',
    };
    const result = feedbackSchema.safeParse(invalidFeedback);
    expect(result.success).toBe(false);
  });

  it('should validate variablesUsed', () => {
    const validFeedback = {
      variablesUsed: { topic: 'AI', style: 'formal' },
    };
    const result = feedbackSchema.safeParse(validFeedback);
    expect(result.success).toBe(true);
  });
});

describe('formatZodError', () => {
  it('should format errors correctly', () => {
    const invalidData = { title: '', body: '', category: '' };
    const result = createPromptSchema.safeParse(invalidData);
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.error).toBe('Datos inválidos');
      expect(formatted.details).toBeDefined();
    }
  });

  it('should handle multiple errors', () => {
    const invalidData = { title: '', body: '', category: '' };
    const result = createPromptSchema.safeParse(invalidData);
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(Object.keys(formatted.details || {}).length).toBeGreaterThan(1);
    }
  });
});
