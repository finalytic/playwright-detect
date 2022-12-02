import { Page } from 'playwright-core';

export async function navigate(page: Page, url: string, timeout?: number) {
  console.log(`Navigating to ${url}`);
  await Promise.all([
    page.goto(url, { timeout }),
    page.waitForNavigation({ timeout }),
  ]);
  console.log(`Navigation success, got to "${page.url()}"`);
}
