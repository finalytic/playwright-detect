import { Page } from 'playwright-core';

export type BlockTypes = ('image' | 'font' | 'stylesheet' | 'websocket')[];
export async function block(page: Page, types: BlockTypes = ['image', 'font']) {
  await page.route('**/*', (route) =>
    types.includes(route.request().resourceType() as any)
      ? route.abort()
      : route.continue()
  );
}
