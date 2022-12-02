import { AbortController, AbortSignal } from 'node-abort-controller';
import { PROXY } from './env';
import { URL } from 'url';
import { randomUUID } from 'crypto';
import createAgent from 'https-proxy-agent';
import fetch from 'node-fetch';

// <T extends readonly unknown[] | []>(values: T): Promise<Awaited<T[number]>>;
function raceToSuccess<T = unknown>(
  promises: Promise<T>[]
): Promise<Awaited<T>> {
  let resolved = 0;
  let rejected = 0;
  return new Promise((resolve, reject) =>
    promises.forEach((promise) =>
      promise
        .then((res) => {
          if (resolved === 0) resolve(res as any);
          resolved += 1;
        })
        .catch((err) => {
          rejected += 1;
          if (rejected === promises.length) reject(err);
        })
    )
  );
}
async function ipInfo(proxy?: string, signal?: AbortSignal) {
  const url = proxy ? new URL(proxy) : undefined;
  const agent: any = url
    ? createAgent({
        rejectUnauthorized: false,
        secureProxy: true,
        auth: `${url.username}:${url.password}`,
        hostname: url.hostname,
        port: url.port,
      })
    : undefined;
  const result = await fetch('https://lumtest.com/myip.json', {
    method: 'get',
    agent,
    signal,
  });
  if (!result.ok)
    throw new Error(`Failed to get IP info with ${result.statusText}`);
  const response = await result.text();
  return JSON.parse(response) as ProxyResponse;
}

type CheckResult = {
  success: true;
  message: 'Success';
  fraud_score: number;
  country_code: 'US';
  region: 'New Jersey';
  city: 'East Brunswick';
  ISP: 'Choopa, LLC';
  ASN: 20473;
  organization: 'Choopa, LLC';
  is_crawler: false;
  timezone: 'America/New_York';
  mobile: false;
  host: '152.39.184.12';
  proxy: true;
  vpn: true;
  tor: false;
  active_vpn: true;
  active_tor: false;
  recent_abuse: true;
  bot_status: true;
  connection_type: 'Premium required.';
  abuse_velocity: 'Premium required.';
  zip_code: 'N/A';
  latitude: 40.44;
  longitude: -74.48;
  request_id: '4E5oHQjBAO';
};
async function checkIpQuality(ip: string, signal?: AbortSignal) {
  const clean: CheckResult = await fetch(
    `https://www.ipqualityscore.com/api/json/ip/25RHy5w4OxPnX2cjgwJtgdGnAc51BoR7/${ip}`,
    {
      signal,
    }
  ).then((x) => x.json());

  return clean;
}

export type ProxyResponse = {
  ip: '178.201.115.33';
  country: 'DE';
  asn: { asnum: 3209; org_name: 'Vodafone GmbH' };
  geo: {
    city: 'Kelkheim';
    region: 'HE';
    region_name: 'Hesse';
    postal_code: '65779';
    latitude: 50.1418;
    longitude: 8.4559;
    tz: 'Europe/Berlin';
    lum_city: 'kelkheim';
    lum_region: 'he';
  };
};

export async function getFastestProxy(
  country = PROXY.country,
  count = 10,
  logs = false
) {
  if (!PROXY.uri) return undefined;
  console.log(PROXY.uri);
  const pattern = PROXY.uri
    .replace('@country', country || PROXY.country)
    .replace('@session', `${randomUUID().split('-')[0]}@id`);
  console.log(pattern);
  const controller = new AbortController();

  const start = +new Date();
  const f = async (proxy: string) => {
    const info = await ipInfo(proxy, controller.signal);
    const quality = await checkIpQuality(info.ip, controller.signal);
    console.log(quality);
    if (quality.fraud_score !== 0 || quality.bot_status) {
      throw new Error(`No good proxy found (${quality.fraud_score})`);
    }
    return [proxy, info, quality] as const;
  };

  const proxies = Array.from(Array(count).keys()).map((_, i) => {
    return pattern.replace('@id', `${i}`);
  });
  const r = await raceToSuccess(proxies.map((p) => f(p)));
  controller.abort();
  if (!r) throw new Error('No proxy found');

  const ipQuality = await checkIpQuality(r[1].ip);
  if (ipQuality.fraud_score !== 0 || ipQuality.bot_status) {
    console.log(
      `${r[1].ip} - ${ipQuality.fraud_score} - ${ipQuality.bot_status}`
    );
    throw new Error('No good proxy found');
  }
  return {
    pattern,
    proxies,
    ipQuality,
    proxy: r[0],
    response: r[1],
    speed: +new Date() - start,
  };
}
