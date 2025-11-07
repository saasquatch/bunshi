import { expect, type Page, type FrameLocator } from '@playwright/test';

/**
 * Helper class for interacting with Sandpack examples
 */
export class SandpackHelper {
  constructor(private page: Page) {}

  /**
   * Wait for Sandpack iframe to load and return the iframe locator
   * Sandpack iframes are on domains like *-sandpack.codesandbox.io
   */
  async waitForSandpackIframe(timeout = 30000): Promise<FrameLocator> {
    // Wait for the main sandpack container
    await this.page.waitForSelector('[class*="sp-"]', { timeout });

    // Wait a bit for Sandpack to initialize
    await this.page.waitForTimeout(2000);

    // Find the iframe with sandpack in the src
    const iframeElement = this.page.frameLocator('iframe[src*="sandpack"]');
    
    // Wait for content to load in iframe
    await this.page.waitForTimeout(2000);

    return iframeElement;
  }

  /**
   * Get text content from the Sandpack preview iframe
   */
  async getPreviewText(selector: string, timeout = 10000): Promise<string> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const element = iframe.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    return await element.textContent() || '';
  }

  /**
   * Click a button in the Sandpack preview iframe
   */
  async clickInPreview(selector: string, timeout = 10000): Promise<void> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const element = iframe.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    await element.click();
  }

  /**
   * Check if element exists in preview
   */
  async hasElement(selector: string, timeout = 10000): Promise<boolean> {
    try {
      const iframe = await this.waitForSandpackIframe(timeout);
      const element = iframe.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Count elements in preview
   */
  async countElements(selector: string, timeout = 10000): Promise<number> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const elements = iframe.locator(selector);
    return await elements.count();
  }

  /**
   * Get all text contents for elements matching selector
   */
  async getAllTexts(selector: string, timeout = 10000): Promise<string[]> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const elements = iframe.locator(selector);
    const count = await elements.count();
    const texts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text) texts.push(text);
    }
    
    return texts;
  }

  /**
   * Wait for text to appear in preview
   */
  async waitForText(selector: string, expectedText: string | RegExp, timeout = 10000): Promise<void> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const element = iframe.locator(selector).first();
    
    if (typeof expectedText === 'string') {
      await expect(element).toContainText(expectedText, { timeout });
    } else {
      await expect(element).toContainText(expectedText, { timeout });
    }
  }

  /**
   * Get the value of an input element
   */
  async getInputValue(selector: string, timeout = 10000): Promise<string> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const element = iframe.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    return await element.inputValue();
  }

  /**
   * Type into an input element
   */
  async typeInInput(selector: string, text: string, timeout = 10000): Promise<void> {
    const iframe = await this.waitForSandpackIframe(timeout);
    const element = iframe.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    await element.fill(text);
  }
}

/**
 * Create a SandpackHelper instance for a page
 */
export function createSandpackHelper(page: Page): SandpackHelper {
  return new SandpackHelper(page);
}
