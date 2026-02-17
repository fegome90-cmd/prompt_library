import { logger } from '@/lib/logger';

export type AnalyticsProps = Record<string, unknown>;

type GtagFn = (command: 'event', eventName: string, params?: AnalyticsProps) => void;

function getGtag(): GtagFn | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const maybeGtag = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof maybeGtag === 'function' ? maybeGtag : null;
}

export function trackEvent(eventName: string, props: AnalyticsProps = {}): void {
  try {
    const gtag = getGtag();

    if (gtag) {
      gtag('event', eventName, props);
      return;
    }

    logger.info(`[analytics] ${eventName}`, props);
  } catch (error) {
    logger.warn('[analytics] tracking failed', {
      eventName,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
