import { Page } from 'playwright-core';
import { waitFor } from '@finalytic/utils';

export async function type(page: Page, word: string, handle?: string) {
  try {
    console.log(`Typing ${word} on ${handle || '<none>'}`);
    const input = handle ? await page.waitForSelector(handle) : undefined;
    const split = word.split('');
    for (const key of split) {
      await waitFor(Math.floor(Math.random() * 140) + 80);
      await input?.focus();
      await page.keyboard.press(key);
    }
    console.log(`Typing success`);
  } catch (err) {
    console.log(`Typing error`);
    console.error(err);
    /*await page.screenshot({
      path: `${resolve(__dirname, 'screenshot.jpg')}`,
      type: 'jpeg',
    });*/
    throw new Error(`An error occurred with airbnb web typing (${handle})`);
  }
}
