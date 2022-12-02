import { Page } from 'playwright-core';

export async function proxyTest(page: Page) {
  await page.goto('http://lumtest.com/myip.json');
  const json = await page.evaluate(() => document.body.innerText);
  return JSON.parse(json);
}
