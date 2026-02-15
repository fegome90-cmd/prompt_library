/**
 * Page Object Model for the Prompt Library main page
 *
 * Encapsulates interactions with:
 * - Prompt cards display
 * - Search functionality
 * - Category filter
 * - View mode toggle (Grid/List)
 * - Tabs navigation
 */

import { Page, Locator, expect } from '@playwright/test';

export class LibraryPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly gridViewButton: Locator;
  readonly listViewButton: Locator;
  readonly libraryTab: Locator;
  readonly favoritesTab: Locator;
  readonly statsTab: Locator;
  readonly promptCards: Locator;
  readonly promptListItems: Locator;
  readonly noResultsMessage: Locator;
  readonly newPromptButton: Locator;
  readonly headerTitle: Locator;
  readonly securityBanner: Locator;
  readonly errorBanner: Locator;
  readonly mainTabsList: Locator;

  constructor(page: Page) {
    this.page = page;
    // Main tabs list container (for better scoping)
    this.mainTabsList = page.locator('[role="tablist"]').first();

    // Search and filter controls - scoped to main content area
    this.searchInput = page.locator('main input[placeholder*="Buscar prompts"]').first();
    this.categorySelect = page.locator('main button[role="combobox"]').first();

    // View mode toggle - buttons inside the border group
    this.gridViewButton = page.locator('.flex.border button').first();
    this.listViewButton = page.locator('.flex.border button').last();

    // Tabs - scoped to main tablist
    this.libraryTab = this.mainTabsList.getByRole('tab', { name: /Biblioteca/i });
    this.favoritesTab = this.mainTabsList.getByRole('tab', { name: /Favoritos/i });
    this.statsTab = this.mainTabsList.getByRole('tab', { name: /Estad.sticas/i });

    // Prompt display elements
    this.promptCards = page.locator('.group.rounded-lg.border');
    this.promptListItems = page.locator('.flex.items-center.gap-4.p-4.rounded-lg');
    this.noResultsMessage = page.locator('text=No se encontraron prompts');

    // Actions
    this.newPromptButton = page.locator('header button:has-text("Nuevo Prompt")');

    // Header
    this.headerTitle = page.locator('h1:has-text("Prompt Manager")');

    // Banners
    this.securityBanner = page.locator('[class*="warning"]').first();
    this.errorBanner = page.locator('[class*="destructive"]').first();
  }

  /**
   * Navigate to the library page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    // Wait for hydration to complete
    await this.page.waitForSelector('h1:has-text("Prompt Manager")', { timeout: 15000 });
    // Wait for either loading spinner to disappear or prompts to appear
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.animate-spin');
      const prompts = document.querySelectorAll('.group.rounded-lg.border');
      return !spinner || prompts.length > 0;
    }, { timeout: 30000 });
  }

  /**
   * Search for prompts by text
   */
  async searchPrompts(query: string) {
    // Use more specific selector for the main search input
    const mainSearchInput = this.page.locator('main').getByPlaceholder('Buscar prompts...');
    await mainSearchInput.fill(query);
    // Wait for search to process (debounced)
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear the search input
   */
  async clearSearch() {
    const mainSearchInput = this.page.locator('main').getByPlaceholder('Buscar prompts...');
    await mainSearchInput.clear();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a category from the dropdown
   */
  async selectCategory(categoryName: string) {
    await this.categorySelect.click();
    await this.page.locator(`[role="option"]:has-text("${categoryName}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to grid view
   */
  async switchToGridView() {
    // The view toggle is a group of 2 buttons with border
    const viewToggle = this.page.locator('.flex.border');
    const firstButton = viewToggle.locator('button').first();
    await firstButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    // The view toggle is a group of 2 buttons with border
    const viewToggle = this.page.locator('.flex.border');
    const lastButton = viewToggle.locator('button').last();
    await lastButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on the library tab
   */
  async clickLibraryTab() {
    await this.libraryTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on the favorites tab
   */
  async clickFavoritesTab() {
    await this.favoritesTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on the stats tab
   */
  async clickStatsTab() {
    await this.statsTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the count of visible prompt cards
   */
  async getPromptCardCount(): Promise<number> {
    return await this.promptCards.count();
  }

  /**
   * Click on a prompt card by index
   */
  async clickPromptCard(index: number) {
    await this.promptCards.nth(index).click();
  }

  /**
   * Click on a prompt card by title
   */
  async clickPromptByTitle(title: string) {
    await this.promptCards.filter({ hasText: title }).first().click();
  }

  /**
   * Click the "Usar" button on a prompt card
   */
  async clickUsePrompt(index: number) {
    const card = this.promptCards.nth(index);
    await card.hover();
    await card.locator('button:has-text("Usar")').click();
  }

  /**
   * Check if in grid view mode
   */
  async isGridView(): Promise<boolean> {
    const gridContainer = this.page.locator('.grid.grid-cols-1');
    return await gridContainer.count() > 0;
  }

  /**
   * Check if in list view mode
   */
  async isListView(): Promise<boolean> {
    // List view has space-y-2 class on container
    const tabsContent = this.page.locator('[role="tabpanel"]');
    const listContainer = tabsContent.locator('.space-y-2');
    return await listContainer.count() > 0;
  }

  /**
   * Wait for prompts to load
   */
  async waitForPrompts() {
    await this.page.waitForSelector('.group.rounded-lg.border', {
      timeout: 15000,
      state: 'visible'
    });
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded() {
    await expect(this.headerTitle).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get prompt card text content by index
   */
  async getPromptCardContent(index: number): Promise<string> {
    return await this.promptCards.nth(index).textContent() || '';
  }

  /**
   * Check if no results message is visible
   */
  async isNoResultsVisible(): Promise<boolean> {
    try {
      await this.noResultsMessage.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get active tab name
   */
  async getActiveTabName(): Promise<string> {
    const activeTab = this.mainTabsList.locator('[role="tab"][data-state="active"]');
    return await activeTab.textContent() || '';
  }
}
