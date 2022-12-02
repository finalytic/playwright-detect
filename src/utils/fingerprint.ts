import { BrowserContext } from 'playwright-core';
import { Fingerprint, FingerprintInjector } from 'fingerprint-injector';
import FingerprintGenerator from 'fingerprint-generator';
export type { Fingerprint };

export function generateFingerprint(s?: string | Fingerprint) {
  let fingerprint: Fingerprint = undefined as any;

  if (typeof s === 'string' || !s) {
    if (!s) s = 'en-US';
    const fingerprintGenerator = new FingerprintGenerator({
      devices: ['desktop'],
      browsers: [{ name: 'chrome' }],
      locales: [s, s?.split('-')[0]],
    });
    const finger = fingerprintGenerator.getFingerprint();
    fingerprint = finger.fingerprint as Fingerprint;
  } else {
    fingerprint = s;
  }
  return {
    async attach(context: BrowserContext) {
      const fingerprintInjector = new FingerprintInjector();
      await fingerprintInjector.attachFingerprintToPlaywright(
        context,
        fingerprint
      );
    },
    fingerprint,
  };
}
