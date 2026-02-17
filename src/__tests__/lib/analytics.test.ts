import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

describe('analytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to logger when no analytics provider is configured', () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

    trackEvent('landing_cta_click', { location: 'hero', cta_text: 'Comenzar gratis' });

    expect(infoSpy).toHaveBeenCalledWith('[analytics] landing_cta_click', {
      location: 'hero',
      cta_text: 'Comenzar gratis',
    });
  });

  it('uses gtag provider when available', () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = gtag;

    trackEvent('app_opened', { referrer: 'direct' });

    expect(gtag).toHaveBeenCalledWith('event', 'app_opened', { referrer: 'direct' });
  });

  it('never throws when provider throws', () => {
    (window as unknown as { gtag: () => void }).gtag = () => {
      throw new Error('provider failed');
    };

    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    expect(() => trackEvent('prompt_created', { prompt_id: '1' })).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
