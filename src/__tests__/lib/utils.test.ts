/**
 * Utils Tests
 * 
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('should handle falsy values', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
    expect(cn('foo', null, 'bar')).toBe('foo bar');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    expect(cn('foo', 0, 'bar')).toBe('foo bar');
  });

  it('should handle tailwind classes', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
    expect(cn('base-class', false && 'active-class')).toBe('base-class');
  });

  it('should merge tailwind classes with conflicting styles', () => {
    // twMerge should handle this - last class wins
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });
});
