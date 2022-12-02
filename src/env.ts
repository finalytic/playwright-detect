export const NODE_ENV = process.env.SHOW_BROWSER === 'production' ? 'production' : 'development';
export const SHOW_BROWSER = NODE_ENV === 'development' ? 'true' : 'false';

export const FLY_ALLOC_ID = process.env.FLY_ALLOC_ID;
export const IS_FLY = FLY_ALLOC_ID !== undefined;

export const PROXY = {
  uri: process.env.PROXY,
  locale: 'en-US',
  // CHANGE this if no proxy is used to your country code
  country: 'de',
}
