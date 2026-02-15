/**
 * PII Detector Tests
 * 
 * Tests for PII detection functionality
 */

import { describe, it, expect } from 'vitest';
import { 
  detectPII, 
  hasHighRiskPII, 
  getPIIWarning,
  getRiskLevel 
} from '@/lib/pii-detector';

describe('detectPII', () => {
  it('should detect email', () => {
    const text = 'Contact me at john.doe@example.com';
    const results = detectPII(text);
    const emailResult = results.find(r => r.type === 'email');
    expect(emailResult?.found).toBe(true);
    expect(emailResult?.matches).toContain('john.doe@example.com');
  });

  it('should detect Chilean phone', () => {
    const text = 'Llama al +56912345678';
    const results = detectPII(text);
    const phoneResult = results.find(r => r.type === 'phone');
    expect(phoneResult?.found).toBe(true);
  });

  it('should detect RUT', () => {
    const text = 'Mi RUT es 12.345.678-5';
    const results = detectPII(text);
    const rutResult = results.find(r => r.type === 'rut');
    expect(rutResult?.found).toBe(true);
  });

  it('should detect credit card', () => {
    const text = 'Tarjeta: 4532-1234-5678-9012';
    const results = detectPII(text);
    const ccResult = results.find(r => r.type === 'credit_card');
    expect(ccResult?.found).toBe(true);
  });

  it('should detect IP address', () => {
    const text = 'Server IP: 192.168.1.100';
    const results = detectPII(text);
    const ipResult = results.find(r => r.type === 'ip_address');
    expect(ipResult?.found).toBe(true);
  });

  it('should detect date patterns', () => {
    const text = 'Fecha: 15-05-2024';
    const results = detectPII(text);
    const dateResult = results.find(r => r.type === 'date_of_birth');
    expect(dateResult?.found).toBe(true);
  });

  it('should detect salary', () => {
    const text = 'Salario: $1.500.000 pesos';
    const results = detectPII(text);
    const salaryResult = results.find(r => r.type === 'salary');
    expect(salaryResult?.found).toBe(true);
  });

  it('should deduplicate matches', () => {
    const text = 'Email: test@test.com and another test@test.com';
    const results = detectPII(text);
    const emailResult = results.find(r => r.type === 'email');
    expect(emailResult?.matches).toHaveLength(1);
  });

  it('should return empty for clean text', () => {
    const text = 'This is a clean text without any sensitive data';
    const results = detectPII(text);
    const found = results.filter(r => r.found);
    expect(found).toHaveLength(0);
  });

  it('should detect multiple PII types', () => {
    const text = 'Contact: john@test.com, RUT: 12.345.678-9, Phone: +56912345678';
    const results = detectPII(text);
    const found = results.filter(r => r.found);
    expect(found.length).toBeGreaterThanOrEqual(3);
  });
});

describe('hasHighRiskPII', () => {
  it('should return true for RUT', () => {
    expect(hasHighRiskPII('Mi RUT es 12.345.678-5')).toBe(true);
  });

  it('should return true for credit card', () => {
    expect(hasHighRiskPII('Tarjeta: 4532123456789012')).toBe(true);
  });

  it('should return true for salary', () => {
    expect(hasHighRiskPII('Salario: $1.500.000')).toBe(true);
  });

  it('should return false for low risk', () => {
    expect(hasHighRiskPII('Email: test@test.com')).toBe(false);
  });

  it('should return false for clean text', () => {
    expect(hasHighRiskPII('No sensitive data here')).toBe(false);
  });
});

describe('getPIIWarning', () => {
  it('should return null for clean text', () => {
    const results = detectPII('Clean text');
    expect(getPIIWarning(results)).toBeNull();
  });

  it('should return warning message', () => {
    const results = detectPII('Email: test@test.com');
    const warning = getPIIWarning(results);
    expect(warning).not.toBeNull();
    expect(warning).toContain('datos sensibles');
  });

  it('should limit matches in message', () => {
    const text = 'a@a.com, b@b.com, c@c.com, d@d.com, e@e.com';
    const results = detectPII(text);
    const warning = getPIIWarning(results);
    expect(warning).not.toBeNull();
    expect(warning).toContain('...');
  });
});

describe('getRiskLevel', () => {
  it('should return high for RUT', () => {
    expect(getRiskLevel('RUT: 12.345.678-5')).toBe('high');
  });

  it('should return high for credit card', () => {
    expect(getRiskLevel('Card: 4532123456789012')).toBe('high');
  });

  it('should return high for salary', () => {
    expect(getRiskLevel('Salary: $1.500.000')).toBe('high');
  });

  it('should return medium for email', () => {
    expect(getRiskLevel('Email: test@test.com')).toBe('medium');
  });

  it('should return medium for phone', () => {
    expect(getRiskLevel('Phone: +56912345678')).toBe('medium');
  });

  it('should return low for clean text', () => {
    expect(getRiskLevel('Clean text')).toBe('low');
  });
});
