import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('A11y smoke checks', () => {
  it('adds skip links and main landmarks in landing and app pages', () => {
    const landing = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');
    const appPage = readFileSync(resolve(process.cwd(), 'src/app/app/page.tsx'), 'utf8');

    expect(landing).toContain('href="#main-content"');
    expect(landing).toContain('id="main-content"');

    expect(appPage).toContain('href="#main-content"');
    expect(appPage).toContain('id="main-content"');
  });

  it('adds accessible labels to critical icon-only controls in prompt editor', () => {
    const promptEditor = readFileSync(resolve(process.cwd(), 'src/components/prompt-manager/prompt-editor.tsx'), 'utf8');

    expect(promptEditor).toContain('aria-label="Cerrar sugerencias de tags"');
    expect(promptEditor).toContain('aria-label="Añadir tag"');
    expect(promptEditor).toContain('aria-label="Eliminar variable"');
  });

  it('keeps in-page anchor UX with sticky header and avoids fake footer link affordance', () => {
    const landing = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(landing).toContain('section id="features" className="relative z-10 py-24 scroll-mt-24"');
    expect(landing).not.toContain('hover:text-white transition-colors">\n                Privacidad');
    expect(landing).not.toContain('hover:text-white transition-colors">\n                Términos');
  });

  it('suppresses hydration warnings on landing images affected by browser extensions', () => {
    const landing = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');

    const suppressHydrationWarningCount = (landing.match(/suppressHydrationWarning/g) ?? []).length;
    expect(suppressHydrationWarningCount).toBeGreaterThanOrEqual(3);
  });

  it('keeps /app controls accessible for desktop and mobile filters', () => {
    const appPage = readFileSync(resolve(process.cwd(), 'src/app/app/page.tsx'), 'utf8');

    expect(appPage).toContain('data-testid="header-search"');
    expect(appPage).toContain('data-testid="search-input"');
    expect(appPage).toContain('data-testid="view-toggle"');
    expect(appPage).toContain('aria-label="Abrir filtros"');
    expect(appPage).toContain('SheetTitle>Filtros de biblioteca');
    expect(appPage).toContain('aria-label="Vista cuadrícula"');
    expect(appPage).toContain('aria-label="Vista lista"');
    expect(appPage).toContain('data-testid="prompts-grid"');
    expect(appPage).toContain('data-testid="prompts-list"');
    expect(appPage).toContain('data-testid="library-summary"');
    expect(appPage).toContain('aria-live="polite"');
    expect(appPage).toContain('data-testid="library-empty-state"');
    expect(appPage).toContain('data-testid="favorites-empty-state"');
  });
});
