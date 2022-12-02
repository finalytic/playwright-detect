import { Page } from 'playwright-core';
import { move } from './move';
import { random, waitFor } from '@finalytic/utils';

export async function click(
  page: Page,
  target: string | { x: number; y: number },
  clickCount = 1
) {
  console.log(`Clicking ${target}`);
  const { x, y } = await move(page, target);
  await waitFor(200, 1000);
  await page.mouse.click(x, y, { clickCount, delay: random(90, 150) });
  console.log(`Clicking success x=${x},y=${y}`);
}
