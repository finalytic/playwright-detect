import { Page } from 'playwright-core';
import { retry, waitFor } from '@finalytic/utils';
import { stringify } from 'qs';

async function innerFetch<T>(
  page: Page,
  url: string,
  params: {
    method?: string;
    query?: any;
    data?: any;
    headers?: any;
  }
) {
  console.log(`Fetching ${url}`);
  const logFetch = (page as any).logFetch;
  if (params.query && Object.keys(params.query).length)
    url = `${url}?${stringify(params.query)}`;
  if (!params.method) params.method = params.data ? 'POST' : 'GET';
  if (params.data && typeof params.data !== 'string')
    params.data = JSON.stringify(params.data);
  if (!params.headers) params.headers = {};
  params.headers = {
    Accept: '*/*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...params.headers,
  };

  console.log(url, {
    method: params.method,
    headers: params.headers,
    body: params.data,
    redirect: 'error',
  });
  const result = await Promise.race([
    page.evaluate(
      async ([url, params]) => {
        try {
          const result = await window.fetch(url, {
            method: params.method,
            headers: params.headers,
            body: params.data,
            redirect: 'error',
          });
          return {
            ok: result.ok,
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            text: await result.text(),
            error: undefined,
          };
        } catch (error: any) {
          return {
            ok: false,
            status: 600,
            statusText: error?.message,
            headers: {},
            text: '',
            error: error?.message,
          };
        }
      },
      [url, params] as const
    ),
    waitFor('30s').then(() => ({
      ok: false,
      status: 600,
      statusText: 'Timeout',
      headers: {},
      text: '',
      error: 'Fetch timeout',
    })),
  ]);
  if (result.error) {
    console.log(`Fetch error`);
    console.error(result.error);
    const error = new Error(result.error);
    (error as any).status = result.status;
    (error as any).statusText = result.statusText;
    (error as any).result = result;
    throw error;
  }
  if (logFetch) logFetch(url, params, result);

  console.log(result);

  if (!result.ok) console.log(`${url}: ${result.status} ${result.statusText}`);
  return {
    ...result,
    json: (() => {
      try {
        return JSON.parse(result.text);
      } catch (err) {
        return undefined;
      }
    })() as T,
  };
}

export async function fetch<T>(
  page: Page,
  url: string,
  params: {
    method?: string;
    query?: any;
    data?: any;
    headers?: any;
  }
) {
  return await retry(async () => await innerFetch<T>(page, url, params), {
    attempts: 2,
    throwError: (err) => err.status !== 600,
  });
}
