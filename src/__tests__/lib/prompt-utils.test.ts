/**
 * Prompt Utils Tests
 * 
 * Tests for prompt utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseJsonField,
  parseTags,
  parseVariablesSchema,
  parseExamples,
  normalizePrompt,
  normalizePrompts,
  filterBySearch,
  filterByCategory,
  filterByTags,
  filterByFavorites,
  filterPrompts,
  extractAllTags,
  CATEGORY_STYLE,
  getCategoryStyle,
} from '@/lib/prompt-utils';
import type { Prompt } from '@/types';

describe('parseJsonField', () => {
  it('should return default for null', () => {
    expect(parseJsonField(null, [])).toEqual([]);
  });

  it('should return default for undefined', () => {
    expect(parseJsonField(undefined, ['default'])).toEqual(['default']);
  });

  it('should return default for empty string', () => {
    expect(parseJsonField('', [])).toEqual([]);
  });

  it('should parse valid JSON string', () => {
    expect(parseJsonField('["tag1", "tag2"]', [])).toEqual(['tag1', 'tag2']);
  });

  it('should return default for invalid JSON', () => {
    expect(parseJsonField('not-json', [])).toEqual([]);
  });

  it('should return value if already parsed', () => {
    const arr = ['tag1', 'tag2'];
    expect(parseJsonField(arr, [])).toBe(arr);
  });

  it('should return non-string values as-is', () => {
    const num = 42;
    expect(parseJsonField(num, 0)).toBe(num);
  });
});

describe('parseTags', () => {
  it('should parse JSON string array', () => {
    expect(parseTags('["ai", "chat"]')).toEqual(['ai', 'chat']);
  });

  it('should return empty array for null', () => {
    expect(parseTags(null)).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    expect(parseTags(undefined)).toEqual([]);
  });

  it('should return empty array for invalid JSON', () => {
    expect(parseTags('invalid')).toEqual([]);
  });

  it('should return array as-is', () => {
    expect(parseTags(['tag1', 'tag2'])).toEqual(['tag1', 'tag2']);
  });
});

describe('parseVariablesSchema', () => {
  it('should parse JSON string', () => {
    const schema = '[{"name": "topic", "type": "text"}]';
    const result = parseVariablesSchema(schema);
    expect(result).toEqual([{ name: 'topic', type: 'text' }]);
  });

  it('should return empty array for null', () => {
    expect(parseVariablesSchema(null)).toEqual([]);
  });
});

describe('parseExamples', () => {
  it('should parse JSON string', () => {
    const examples = '[{"input": {}, "output": "result"}]';
    const result = parseExamples(examples);
    expect(result).toEqual([{ input: {}, output: 'result' }]);
  });

  it('should return empty array for null', () => {
    expect(parseExamples(null)).toEqual([]);
  });
});

describe('normalizePrompt', () => {
  it('should map author relation', () => {
    const prompt = {
      id: '1',
      title: 'Test',
      description: '',
      body: 'Body',
      category: 'General',
      tags: [],
      variablesSchema: [],
      examples: [],
      status: 'draft' as const,
      riskLevel: 'low' as const,
      version: '1',
      useCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      isFavorite: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      User_Prompt_authorIdToUser: { id: '1', name: 'Author', email: 'a@t.com' },
    };
    const result = normalizePrompt(prompt);
    expect(result.author).toEqual({ id: '1', name: 'Author', email: 'a@t.com' });
  });

  it('should parse tags from string', () => {
    const prompt = {
      id: '1',
      title: 'Test',
      description: '',
      body: 'Body',
      category: 'General',
      tags: '["tag1", "tag2"]',
      variablesSchema: [],
      examples: [],
      status: 'draft' as const,
      riskLevel: 'low' as const,
      version: '1',
      useCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      isFavorite: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const result = normalizePrompt(prompt);
    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should parse variablesSchema from string', () => {
    const prompt = {
      id: '1',
      title: 'Test',
      description: '',
      body: 'Body',
      category: 'General',
      tags: [],
      variablesSchema: '[{"name": "topic", "type": "text"}]',
      examples: [],
      status: 'draft' as const,
      riskLevel: 'low' as const,
      version: '1',
      useCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      isFavorite: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const result = normalizePrompt(prompt);
    expect(result.variablesSchema).toEqual([{ name: 'topic', type: 'text' }]);
  });
});

describe('normalizePrompts', () => {
  it('should return empty array for non-array input', () => {
    expect(normalizePrompts(null as any)).toEqual([]);
    expect(normalizePrompts(undefined as any)).toEqual([]);
  });

  it('should normalize all prompts', () => {
    const prompts = [
      { id: '1', title: 'Test 1', description: '', body: 'Body', category: 'General', tags: '["tag1"]', variablesSchema: [], examples: [], status: 'draft' as const, riskLevel: 'low' as const, version: '1', useCount: 0, thumbsUp: 0, thumbsDown: 0, isFavorite: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', title: 'Test 2', description: '', body: 'Body', category: 'General', tags: '["tag2"]', variablesSchema: [], examples: [], status: 'draft' as const, riskLevel: 'low' as const, version: '1', useCount: 0, thumbsUp: 0, thumbsDown: 0, isFavorite: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    const result = normalizePrompts(prompts);
    expect(result).toHaveLength(2);
    expect(result[0].tags).toEqual(['tag1']);
    expect(result[1].tags).toEqual(['tag2']);
  });
});

describe('filterBySearch', () => {
  const prompt: Prompt = {
    id: '1',
    title: 'Test Prompt Title',
    description: 'A test description',
    body: 'Body text',
    category: 'General',
    tags: ['searchable', 'tag'],
    variablesSchema: [],
    examples: [],
    status: 'published',
    riskLevel: 'low',
    version: '1',
    useCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    isFavorite: false,
    author: { id: '1', name: 'Author', email: 'a@t.com' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('should match title', () => {
    expect(filterBySearch(prompt, 'Title')).toBe(true);
  });

  it('should match description', () => {
    expect(filterBySearch(prompt, 'description')).toBe(true);
  });

  it('should match tags', () => {
    expect(filterBySearch(prompt, 'searchable')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(filterBySearch(prompt, 'TEST')).toBe(true);
  });

  it('should return true for empty search', () => {
    expect(filterBySearch(prompt, '')).toBe(true);
    expect(filterBySearch(prompt, '   ')).toBe(true);
  });

  it('should return false for non-matching search', () => {
    expect(filterBySearch(prompt, 'nonexistent')).toBe(false);
  });
});

describe('filterByCategory', () => {
  const prompt: Prompt = {
    id: '1',
    title: 'Test',
    description: '',
    body: 'Body',
    category: 'General',
    tags: [],
    variablesSchema: [],
    examples: [],
    status: 'published',
    riskLevel: 'low',
    version: '1',
    useCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    isFavorite: false,
    author: { id: '1', name: 'Author', email: 'a@t.com' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('should filter by category', () => {
    expect(filterByCategory(prompt, 'General')).toBe(true);
    expect(filterByCategory(prompt, 'RRHH')).toBe(false);
  });

  it('should return true for null category', () => {
    expect(filterByCategory(prompt, null)).toBe(true);
  });
});

describe('filterByTags', () => {
  const prompt: Prompt = {
    id: '1',
    title: 'Test',
    description: '',
    body: 'Body',
    category: 'General',
    tags: ['tag1', 'tag2', 'tag3'],
    variablesSchema: [],
    examples: [],
    status: 'published',
    riskLevel: 'low',
    version: '1',
    useCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    isFavorite: false,
    author: { id: '1', name: 'Author', email: 'a@t.com' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('should filter by selected tags', () => {
    expect(filterByTags(prompt, ['tag1'])).toBe(true);
    expect(filterByTags(prompt, ['tag1', 'tag4'])).toBe(true);
    expect(filterByTags(prompt, ['tag4'])).toBe(false);
  });

  it('should return true for empty tags', () => {
    expect(filterByTags(prompt, [])).toBe(true);
  });
});

describe('filterByFavorites', () => {
  const favoritePrompt: Prompt = {
    id: '1',
    title: 'Test',
    description: '',
    body: 'Body',
    category: 'General',
    tags: [],
    variablesSchema: [],
    examples: [],
    status: 'published',
    riskLevel: 'low',
    version: '1',
    useCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    isFavorite: true,
    author: { id: '1', name: 'Author', email: 'a@t.com' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const nonFavoritePrompt: Prompt = {
    id: '2',
    title: 'Test 2',
    description: '',
    body: 'Body',
    category: 'General',
    tags: [],
    variablesSchema: [],
    examples: [],
    status: 'published',
    riskLevel: 'low',
    version: '1',
    useCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    isFavorite: false,
    author: { id: '1', name: 'Author', email: 'a@t.com' },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('should filter favorites', () => {
    expect(filterByFavorites(favoritePrompt, true)).toBe(true);
    expect(filterByFavorites(nonFavoritePrompt, true)).toBe(false);
  });

  it('should return true when not filtering favorites', () => {
    expect(filterByFavorites(favoritePrompt, false)).toBe(true);
    expect(filterByFavorites(nonFavoritePrompt, false)).toBe(true);
  });
});

describe('filterPrompts', () => {
  const prompts: Prompt[] = [
    {
      id: '1',
      title: 'Test Prompt',
      description: 'Description',
      body: 'Body',
      category: 'General',
      tags: ['ai'],
      variablesSchema: [],
      examples: [],
      status: 'published',
      riskLevel: 'low',
      version: '1',
      useCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      isFavorite: true,
      author: { id: '1', name: 'Author', email: 'a@t.com' },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      title: 'Other Prompt',
      description: 'Other description',
      body: 'Body',
      category: 'RRHH',
      tags: ['hr'],
      variablesSchema: [],
      examples: [],
      status: 'draft',
      riskLevel: 'medium',
      version: '1',
      useCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      isFavorite: false,
      author: { id: '2', name: 'Author2', email: 'a2@t.com' },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  it('should apply all filters', () => {
    const result = filterPrompts(prompts, { 
      search: 'Test', 
      category: 'General',
      tags: ['ai'],
      onlyFavorites: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle partial filters', () => {
    const result = filterPrompts(prompts, { search: 'Other' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('extractAllTags', () => {
  it('should extract unique sorted tags', () => {
    const prompts: Prompt[] = [
      { id: '1', title: 'Test', description: '', body: 'Body', category: 'General', tags: ['z-tag', 'a-tag'], variablesSchema: [], examples: [], status: 'published', riskLevel: 'low', version: '1', useCount: 0, thumbsUp: 0, thumbsDown: 0, isFavorite: false, author: { id: '1', name: 'A', email: 'a@t.com' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', title: 'Test', description: '', body: 'Body', category: 'General', tags: ['b-tag', 'a-tag'], variablesSchema: [], examples: [], status: 'published', riskLevel: 'low', version: '1', useCount: 0, thumbsUp: 0, thumbsDown: 0, isFavorite: false, author: { id: '1', name: 'A', email: 'a@t.com' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    const result = extractAllTags(prompts);
    expect(result).toEqual(['a-tag', 'b-tag', 'z-tag']);
  });

  it('should handle prompts without tags', () => {
    const prompts: Prompt[] = [
      { id: '1', title: 'Test', description: '', body: 'Body', category: 'General', tags: [], variablesSchema: [], examples: [], status: 'published', riskLevel: 'low', version: '1', useCount: 0, thumbsUp: 0, thumbsDown: 0, isFavorite: false, author: { id: '1', name: 'A', email: 'a@t.com' }, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];
    const result = extractAllTags(prompts);
    expect(result).toEqual([]);
  });
});

describe('CATEGORY_STYLE', () => {
  it('should have unified muted style', () => {
    expect(CATEGORY_STYLE).toBe('bg-muted text-muted-foreground');
  });
});

describe('getCategoryStyle', () => {
  it('should return unified style for any category', () => {
    expect(getCategoryStyle('General')).toBe(CATEGORY_STYLE);
    expect(getCategoryStyle('RRHH')).toBe(CATEGORY_STYLE);
    expect(getCategoryStyle('Unknown')).toBe(CATEGORY_STYLE);
  });
});
