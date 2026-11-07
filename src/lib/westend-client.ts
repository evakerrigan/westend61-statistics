/**
 * Loads pages of the Westend61 photographer area from inside a tab of the
 * same site: www.westend61.de, or one of the two submission systems.
 *
 * Requests are executed in the page itself (`world: 'MAIN'`), so they carry the
 * user's existing login session exactly like the site's own requests do.
 * Nothing is stored or sent anywhere else.
 */

export const WESTEND_ORIGIN = 'https://www.westend61.de';
/** The old submission system (“Previous Submissions”). */
export const INGESTION_ORIGIN = 'https://ingestion.westend61.de';
/** The current submission system. */
export const INGESTION_NEO_ORIGIN = 'https://ingestionneo.westend61.de';
const WESTEND_TAB_PATH = '/photographers/dashboard?lang=en';
// Requests go strictly one at a time, with a random 1–2 s pause between
// them, to keep the load on Westend61 low.
const REQUEST_DELAY_MIN_MS = 1000;
const REQUEST_DELAY_MAX_MS = 2000;

/** Westend61 returned no data — usually the user is not logged in. */
export class WestendAuthError extends Error {
  constructor() {
    super('Westend61 returned no data: not logged in at westend61.de?');
    this.name = 'WestendAuthError';
  }
}

export class WestendHttpError extends Error {
  readonly status: number;

  constructor(status: number, path: string) {
    super(`Westend61 responded with ${status} to ${path}`);
    this.name = 'WestendHttpError';
    this.status = status;
  }
}

/** A page did not look as expected: Westend61 probably changed it. */
export class WestendFormatError extends Error {
  constructor(what: string) {
    super(`Unexpected Westend61 page: ${what}`);
    this.name = 'WestendFormatError';
  }
}

export const isExtensionContext = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome.scripting;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pause = () =>
  sleep(
    REQUEST_DELAY_MIN_MS +
      Math.random() * (REQUEST_DELAY_MAX_MS - REQUEST_DELAY_MIN_MS)
  );

const waitForTabLoad = (tabId: number) =>
  new Promise<void>((resolve) => {
    const listener = (id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

export type WestendSession = {
  /** Loads an HTML page and parses it. */
  getPage: (path: string) => Promise<Document>;
  getJson: <T>(path: string) => Promise<T>;
  close: () => Promise<void>;
};

/**
 * Turns inline event handlers (`onload="…"`, `onclick="…"`) into harmless
 * `data-on…` attributes. Parsed pages never run them, but the extension's
 * Content Security Policy still logs an error for each one when the page is
 * parsed. A plain text replace, not a tag matcher: attributes before the
 * handler may hold `>` (HTML tooltips like `data-bs-title="<b>…</b>"`), and
 * HTML also allows `/` and quotes right before an attribute name.
 */
const INLINE_HANDLER = /([\s/"'])on([a-z]+\s*=)/gi;

const stripInlineHandlers = (html: string) =>
  html.replace(INLINE_HANDLER, '$1data-on$2');

/** Login pages: Westend61 redirects there when the session has expired. */
const isLoginUrl = (url: string) => /\/login\b|\/auth\b/i.test(url);

/**
 * Finds an open tab of `origin` (or opens `startPath` there in the
 * background) and returns a session for loading pages through it.
 */
export const openSession = async (
  origin: string,
  startPath: string
): Promise<WestendSession> => {
  const existing = await chrome.tabs.query({ url: `${origin}/*` });
  let tabId = existing.find((t) => t.status === 'complete')?.id;
  let createdTab = false;

  if (tabId === undefined) {
    const tab = await chrome.tabs.create({
      url: `${origin}${startPath}`,
      active: false,
    });
    tabId = tab.id!;
    createdTab = true;
    await waitForTabLoad(tabId);
    // Not logged in there: the site sent the tab to a login page elsewhere,
    // where the requests below would not reach.
    const loaded = await chrome.tabs.get(tabId);
    if (!loaded.url?.startsWith(`${origin}/`) || isLoginUrl(loaded.url)) {
      await chrome.tabs.remove(tabId);
      throw new WestendAuthError();
    }
  }

  const targetTabId = tabId;

  const get = async (path: string, accept: string) => {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      world: 'MAIN',
      args: [path, accept],
      // Runs inside the Westend61 page: must be self-contained.
      func: async (url: string, acceptHeader: string) => {
        const res = await fetch(url, {
          credentials: 'same-origin',
          headers: { Accept: acceptHeader },
        });
        return { status: res.status, url: res.url, text: await res.text() };
      },
    });

    await pause();

    const result = injection?.result;
    if (!result || result.status === 401 || result.status === 403) {
      throw new WestendAuthError();
    }
    if (result.status >= 400) {
      throw new WestendHttpError(result.status, path);
    }
    if (isLoginUrl(result.url)) throw new WestendAuthError();
    return result.text;
  };

  const getPage = async (path: string) => {
    const html = await get(path, 'text/html');
    return new DOMParser().parseFromString(
      stripInlineHandlers(html),
      'text/html'
    );
  };

  const getJson = async <T>(path: string): Promise<T> => {
    const text = await get(path, 'application/json');
    try {
      return JSON.parse(text) as T;
    } catch {
      // A redirect to the login page comes back as HTML.
      throw new WestendAuthError();
    }
  };

  const close = async () => {
    if (createdTab) await chrome.tabs.remove(targetTabId);
  };

  return { getPage, getJson, close };
};

/** A session in a www.westend61.de tab (sales, portfolio, dashboard). */
export const openWestendSession = () =>
  openSession(WESTEND_ORIGIN, WESTEND_TAB_PATH);
