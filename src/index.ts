import { Browser, BrowserContextOptions, Page } from 'playwright-core';
import { PROXY, SHOW_BROWSER } from './env';
import {
  disableRtc,
  generateFingerprint,
  initMouse,
  installMouseHelper,
  proxyTest,
} from './utils';
import { chromium } from 'playwright-extra';
import { getFastestProxy } from './proxy';

async function launchPlaywright(args: { proxy: boolean, config: BrowserContextOptions, loginUrl: string }) {
  let proxy: BrowserContextOptions['proxy'] = undefined;
  let tz: string | undefined;

  if (args.proxy) {
    const fastProxy = await getFastestProxy('de', 5);
    if (!fastProxy) throw new Error('No proxy found');
    console.log('Creating browser using proxy');
    const parsed = new URL(fastProxy?.proxy);
    proxy = {
      server: `${parsed.protocol || 'http:'}//${parsed.hostname}:${
        parsed.port
      }`,
      username: parsed.username,
      password: parsed.password,
    };
    tz = fastProxy?.response.geo.tz;
    console.log('Proxy:', proxy);
  }
  const browser: Browser = await chromium.launch({
    headless: !SHOW_BROWSER,
    proxy,
  });
  const { attach, fingerprint } = generateFingerprint('de-DE');
  console.log(fingerprint)
  const context = await browser.newContext({
    userAgent: fingerprint.userAgent,
    locale: `${fingerprint.navigator.language}`,
    proxy,
    deviceScaleFactor: 1,
    timezoneId: tz,
    ...args.config,
    /*
    viewport: {
      width: 1600,
      height: 1280,
    },*/
  });

  await attach(context);

  const page = await context.newPage();

  page.addInitScript(disableRtc);

  await initMouse(page);

  const proxyInfo = await proxyTest(page);

  await page.goto(args.loginUrl, { timeout: 0 });

  installMouseHelper(page);

  return { proxyInfo, page: page };
}

launchPlaywright({
  proxy: !!PROXY?.uri,
  loginUrl: 'https://www.airbnb.com/login',
  config: {},
});
