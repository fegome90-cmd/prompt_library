/**
 * E2E Tests: Library Browse Flow
 *
 * Tests the core functionality of browsing and viewing prompts:
 * - Page loads correctly
 * - Prompts display in grid and list views
 * - Category filtering works
 * - Tab navigation works
 */

import { test, expect } from './fixtures';
import { LibraryPage } from './pages/LibraryPage';

test.describe('Library Browse Flow', () => {
  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();
  });

  test('should load the library page with header', async ({ page }) => {
    // Verify header is visible
    await expect(libraryPage.headerTitle).toBeVisible();

    // Verify breadcrumb shows library path (in header)
    const breadcrumb = page.locator('header p.text-xs.text-muted-foreground');
    await expect(breadcrumb).toContainText(/Biblioteca/);
  });

  test('should display prompt cards in grid view by default', async () => {
    // Wait for prompts to load
    await libraryPage.waitForPrompts();

    // Verify prompt cards are visible
    const cardCount = await libraryPage.getPromptCardCount();
    expect(cardCount).toBeGreaterThan(0);

    // Verify grid layout is active
    const isGrid = await libraryPage.isGridView();
    expect(isGrid).toBe(true);
  });

  test('should switch between grid and list view', async ({ page }) => {
    await libraryPage.waitForPrompts();

    // Switch to list view
    await libraryPage.switchToListView();

    // Verify list layout is active
    const isList = await libraryPage.isListView();
    expect(isList).toBe(true);

    // Switch back to grid view
    await libraryPage.switchToGridView();

    // Verify grid layout is active
    const isGrid = await libraryPage.isGridView();
    expect(isGrid).toBe(true);
  });

  test('should navigate between tabs', async () => {
    // Start on library tab - use mainTabsList to get correct scope
    const activeTabName = await libraryPage.getActiveTabName();
    expect(activeTabName.toLowerCase()).toContain('biblioteca');

    // Click favorites tab
    await libraryPage.clickFavoritesTab();
    const favoritesName = await libraryPage.getActiveTabName();
    expect(favoritesName.toLowerCase()).toContain('favorito');

    // Click stats tab
    await libraryPage.clickStatsTab();
    const statsName = await libraryPage.getActiveTabName();
    expect(statsName.toLowerCase()).toContain('estad');

    // Return to library tab
    await libraryPage.clickLibraryTab();
    const libraryName = await libraryPage.getActiveTabName();
    expect(libraryName.toLowerCase()).toContain('biblioteca');
  });

  test('should display prompt card with correct information', async () => {
    await libraryPage.waitForPrompts();

    // Get content of first prompt card
    const content = await libraryPage.getPromptCardContent(0);

    // Verify card contains essential elements
    expect(content).toMatch(/usos|uses/i); // Use count
    expect(content).toMatch(/v\d+/); // Version badge
  });

  test('should show prompt count in header', async ({ page }) => {
    await libraryPage.waitForPrompts();

    // Verify prompt count is displayed in header breadcrumb
    const headerText = await page.locator('header p.text-xs.text-muted-foreground').textContent();
    expect(headerText).toMatch(/\d+\s*prompts?/i);
  });

  test('should display security banner on page load', async () => {
    // Security banner should be visible (not dismissed)
    const bannerCount = await libraryPage.securityBanner.count();
    expect(bannerCount).toBeGreaterThan(0);
  });

  test('should show New Prompt button', async () => {
    await expect(libraryPage.newPromptButton).toBeVisible();
  });
});

test.describe('Library - Empty State', () => {
  test('should show empty state when no prompts match search', async ({ page }) => {
    const libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();

    // Search for something unlikely to match
    await libraryPage.searchPrompts('zzzznonexistent12345');

    // Verify no results message
    await expect(page.locator('text=No se encontraron prompts')).toBeVisible({ timeout: 10000 });
  });

  test('should show create button in empty state', async ({ page }) => {
    const libraryPage = new LibraryPage(page);
    await libraryPage.goto();
    await libraryPage.waitForPageLoad();

    // Search for something unlikely to match
    await libraryPage.searchPrompts('zzzznonexistent12345');

    // Verify create button is shown
    await expect(page.locator('button:has-text("Crear")')).toBeVisible();
  });
});
