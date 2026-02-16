/**
 * Page Object Model for the Prompt Composer modal
 *
 * Encapsulates interactions with:
 * - Variable inputs
 * - Preview panel
 * - Copy functionality
 * - Security/PII warnings
 * - Risk level badge
 */

import { Page, Locator, expect } from '@playwright/test';

export class PromptComposerPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly variablesPanel: Locator;
  readonly previewPanel: Locator;
  readonly copyButton: Locator;
  readonly closeButton: Locator;
  readonly favoriteButton: Locator;
  readonly riskBadge: Locator;
  readonly securityWarning: Locator;
  readonly highRiskWarning: Locator;
  readonly previewContent: Locator;
  readonly characterCount: Locator;
  readonly variableInputs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('[data-testid="composer-dialog"], [role="dialog"]');
    this.title = this.dialog.locator('h2');
    this.description = this.dialog.locator('p').first();

    // Panels - use data-testid for stable selectors
    this.variablesPanel = this.dialog.locator('text=Variables').locator('..');
    this.previewPanel = this.dialog.locator('[data-testid="preview-panel"]');

    // Actions - use data-testid for stable selectors
    this.copyButton = this.dialog.locator('[data-testid="copy-button"]');
    this.closeButton = this.dialog.locator('[data-testid="close-button"]');
    this.favoriteButton = this.dialog.locator('[data-testid="favorite-button"]');

    // Risk indicators - use data-testid
    this.riskBadge = this.dialog.locator('[data-testid="risk-badge"]');
    this.securityWarning = this.dialog.locator('[class*="destructive"], [class*="warning"]');
    this.highRiskWarning = this.dialog.locator('text=Atencion, text=alto riesgo, text=high risk');

    // Preview
    this.previewContent = this.dialog.locator('pre.whitespace-pre-wrap, pre');
    this.characterCount = this.dialog.locator('text=/\\d+ caracteres/');

    // Variable inputs - dynamic based on prompt schema
    this.variableInputs = this.dialog.locator('input, textarea, button[role="combobox"]');
  }

  /**
   * Wait for the composer dialog to be visible
   */
  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if the composer is open
   */
  async isOpen(): Promise<boolean> {
    try {
      await this.dialog.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the composer dialog
   */
  async close() {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Fill a text variable by label
   */
  async fillVariable(label: string, value: string) {
    const input = this.dialog.locator(`label:has-text("${label}")`).locator('..').locator('input, textarea');
    await input.fill(value);
  }

  /**
   * Fill a variable by input ID or name
   */
  async fillVariableByName(name: string, value: string) {
    const input = this.dialog.locator(`#${name}, [name="${name}"]`);
    await input.fill(value);
  }

  /**
   * Fill all available text inputs with values
   */
  async fillAllVariables(values: string[]) {
    const inputs = await this.variableInputs.elementHandles();
    for (let i = 0; i < Math.min(inputs.length, values.length); i++) {
      const input = inputs[i];
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'input' || tagName === 'textarea') {
        await input.fill(values[i]);
      }
    }
  }

  /**
   * Select an option from a dropdown variable
   */
  async selectOption(variableLabel: string, option: string) {
    const select = this.dialog.locator(`label:has-text("${variableLabel}")`).locator('..').locator('button[role="combobox"]');
    await select.click();
    await this.page.locator(`[role="option"]:has-text("${option}")`).click();
  }

  /**
   * Get the preview text content
   */
  async getPreviewText(): Promise<string> {
    return await this.previewContent.textContent() || '';
  }

  /**
   * Get the character count
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.characterCount.textContent() || '0';
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Click the copy button
   */
  async clickCopy() {
    await this.copyButton.click();
  }

  /**
   * Check if copy was successful (shows "¡Copiado!" text)
   */
  async isCopySuccessful(): Promise<boolean> {
    try {
      // Wait for the button text to change to "¡Copiado!"
      await this.copyButton.locator('text=/Copiado|Copied/i').waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite() {
    await this.favoriteButton.click();
  }

  /**
   * Get the risk level from the badge
   */
  async getRiskLevel(): Promise<'low' | 'medium' | 'high' | null> {
    // Wait for risk badge to be visible first (async state update)
    await this.riskBadge.waitFor({ state: 'visible', timeout: 5000 });

    const text = await this.riskBadge.textContent() || '';
    if (text.toLowerCase().includes('alto') || text.toLowerCase().includes('high')) {
      return 'high';
    }
    if (text.toLowerCase().includes('medio') || text.toLowerCase().includes('medium')) {
      return 'medium';
    }
    if (text.toLowerCase().includes('bajo') || text.toLowerCase().includes('low')) {
      return 'low';
    }
    return null;
  }

  /**
   * Check if high risk warning is visible
   */
  async isHighRiskWarningVisible(): Promise<boolean> {
    try {
      // Use data-testid for reliable targeting of the high risk warning
      const warning = this.dialog.locator('[data-testid="high-risk-warning"]');
      await warning.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dismiss high risk warning
   */
  async dismissHighRiskWarning() {
    // Button text is "Entendido, continuar" or "Ignorar y copiar"
    const dismissButton = this.dialog.locator('button:has-text("Entendido"), button:has-text("Ignorar"), button:has-text("Continue")');
    if (await dismissButton.count() > 0) {
      await dismissButton.first().click();
      // Wait for the warning to disappear
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Confirm copy despite high risk
   */
  async confirmCopyWithHighRisk() {
    const confirmButton = this.dialog.locator('button:has-text("Ignorar"), button:has-text("Ignore")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }
  }

  /**
   * Verify the composer shows expected title
   */
  async verifyTitle(expectedTitle: string) {
    await expect(this.title).toContainText(expectedTitle);
  }

  /**
   * Get number of variable inputs
   */
  async getVariableCount(): Promise<number> {
    return await this.variableInputs.count();
  }

  /**
   * Check if security warning is visible
   */
  async isSecurityWarningVisible(): Promise<boolean> {
    try {
      await this.securityWarning.first().waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
