import { Page } from 'playwright-core';
import { PlaywrightBlocker } from '@cliqz/adblocker-playwright';
import fetch from 'node-fetch'; // required 'fetch'

export async function adBlock(page: Page) {
  PlaywrightBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInPage(page);
  });
}
