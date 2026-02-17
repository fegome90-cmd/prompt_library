import { test, expect } from './fixtures';
import { LibraryPage } from './pages/LibraryPage';

test.describe('Library UI behaviors', () => {
  test('reveals skip link on keyboard navigation', async ({ page }) => {
    const libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' });
    await expect(skipLink).toBeVisible();
  });

  test('supports mobile filters drawer flow', async ({ page }) => {
    const libraryPage = new LibraryPage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();

    const openFilters = page.getByRole('button', { name: 'Abrir filtros' });
    await expect(openFilters).toBeVisible();
    await openFilters.click();

    const drawerTitle = page.getByText('Filtros de biblioteca');
    await expect(drawerTitle).toBeVisible();

    await page.getByRole('button', { name: 'Lista' }).click();
    await page.getByRole('button', { name: 'Aplicar' }).click();

    await expect(page.locator('[data-testid="prompts-list"]')).toBeVisible();
  });

  test('clicking card favorite action does not open composer dialog', async ({ page }) => {
    const libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
    await libraryPage.waitForPrompts();

    await libraryPage.promptCards.first().locator('button[aria-label*="favoritos"]').click();

    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
