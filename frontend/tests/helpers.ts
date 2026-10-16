import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Spring Boot API (context path included). */
export const API_BASE =
  process.env.MARKETHUB_API_BASE ?? "http://localhost:8080/api/v1";

/** Short unique token for test data (emails, slugs, store names). */
export function uid(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

/** Desktop nav renders at >= 1024px (the `lg` breakpoint). */
export function isDesktop(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) >= 1024;
}

export interface PageMonitor {
  /** Console messages of type "error" (resource-load noise excluded). */
  consoleErrors: string[];
  /** Uncaught exceptions on the page. */
  pageErrors: string[];
  /** Requests that never completed (DNS, aborted, connection refused). */
  failedRequests: string[];
  /** Any 5xx response. */
  serverErrors: string[];
  /** Same-origin (non-API) responses >= 400, e.g. missing chunks or assets. */
  assetFailures: string[];
  /** API responses >= 400 - assert these explicitly per test. */
  apiFailures: string[];
  /** Same-origin 404s (expected for unknown routes). */
  notFound: string[];
}

/** Attaches listeners that collect everything QA cares about. */
export function monitor(page: Page): PageMonitor {
  const m: PageMonitor = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    serverErrors: [],
    assetFailures: [],
    apiFailures: [],
    notFound: [],
  };

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // Resource-load failures are asserted through the response listeners.
    if (text.includes("Failed to load resource")) return;
    m.consoleErrors.push(text);
  });

  page.on("pageerror", (error) => m.pageErrors.push(String(error)));

  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "unknown";
    // Next.js prefetches routes with RSC requests and cancels them the
    // moment the real navigation commits — that abort is expected.
    if (errorText === "net::ERR_ABORTED" && request.url().includes("_rsc=")) {
      return;
    }
    m.failedRequests.push(`${request.method()} ${request.url()} :: ${errorText}`);
  });

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 500) {
      m.serverErrors.push(`${status} ${url}`);
      return;
    }
    if (status < 400) return;
    if (url.includes("/api/")) {
      m.apiFailures.push(`${status} ${url}`);
      return;
    }
    if (status === 404) {
      m.notFound.push(url);
      return;
    }
    if (url.startsWith("http://localhost:3000")) {
      m.assetFailures.push(`${status} ${url}`);
    }
  });

  return m;
}

export function expectClean(
  m: PageMonitor,
  options: { allowApi?: RegExp } = {}
): void {
  expect(m.pageErrors, "uncaught page errors").toEqual([]);
  expect(m.failedRequests, "requests that never completed").toEqual([]);
  expect(m.serverErrors, "5xx responses").toEqual([]);
  expect(m.assetFailures, "failed page/asset responses").toEqual([]);
  expect(m.consoleErrors, "console errors").toEqual([]);
  const unexpected = m.apiFailures.filter(
    (entry) => !options.allowApi?.test(entry)
  );
  expect(unexpected, "unexpected API error responses").toEqual([]);
}

/** Fails when the page scrolls sideways (broken layout at this width). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(
      doc.scrollWidth - doc.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    );
  });
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(2);
}

export interface Account {
  email: string;
  password: string;
  token: string;
}

/** Registers a user through the real API (fast setup for UI tests). */
export async function apiRegister(
  request: APIRequestContext,
  role: "ROLE_CUSTOMER" | "ROLE_SELLER",
  tag: string
): Promise<Account> {
  const email = `qa-${tag}-${uid()}@example.com`;
  const password = "Password1!";
  const body: Record<string, unknown> = {
    email,
    password,
    firstName: "QA",
    lastName: tag,
    role,
  };
  if (role === "ROLE_SELLER") {
    body.storeName = `QA Store ${uid()}`;
    body.storeDescription = "Playwright browser QA";
  }

  const response = await request.post(`${API_BASE}/auth/register`, { data: body });
  expect(response.status(), `register ${email}`).toBe(201);
  const payload = await response.json();
  return { email, password, token: payload.data.token };
}

/** Creates a product through the real API (setup for catalog/cart tests). */
export async function apiCreateProduct(
  request: APIRequestContext,
  token: string,
  name: string,
  options: { price?: number; stock?: number; categoryId?: number } = {}
): Promise<number> {
  const response = await request.post(`${API_BASE}/products`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name,
      slug: `qa-${uid()}`,
      description: `${name} (browser QA fixture)`,
      price: options.price ?? 25,
      stockQuantity: options.stock ?? 50,
      categoryId: options.categoryId ?? 2,
    },
  });
  expect(response.status(), `create product ${name}`).toBe(201);
  const payload = await response.json();
  return payload.data.id as number;
}

/** Signs in through the real login form. */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectSignedIn(page);
}

/** True when the account menu is only reachable through the mobile menu. */
async function ensureMenuOpen(page: Page): Promise<boolean> {
  const hamburger = page.getByRole("button", { name: "Open navigation" });
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    return true;
  }
  return false;
}

/** Asserts the header (or the open mobile menu) shows a signed-in session. */
export async function expectSignedIn(page: Page): Promise<void> {
  // Scoped to the banner: the mobile menu keeps its own copy.
  const signOut = page.getByRole("banner").getByRole("button", { name: "Sign out" });
  if (await signOut.isVisible().catch(() => false)) return;
  await ensureMenuOpen(page);
  await expect(signOut, "expected a signed-in session").toBeVisible();
}

/** Asserts the header (or the open mobile menu) shows a signed-out session. */
export async function expectSignedOut(page: Page): Promise<void> {
  // Scoped to the banner: the footer repeats the same "Sign in" link.
  const signIn = page.getByRole("banner").getByRole("link", { name: "Sign in" });
  if (await signIn.isVisible().catch(() => false)) return;
  await ensureMenuOpen(page);
  await expect(signIn, "expected a signed-out session").toBeVisible();
}

/** Signs out through the header or the mobile menu. */
export async function uiSignOut(page: Page): Promise<void> {
  const signOut = page.getByRole("button", { name: "Sign out" });
  if (!(await signOut.isVisible().catch(() => false))) {
    await ensureMenuOpen(page);
  }
  await page.getByRole("button", { name: "Sign out" }).click();
  await expectSignedOut(page);
}

/** Reads the visible prices (₹ formatted) from catalog product cards. */
export async function visibleCardPrices(page: Page): Promise<number[]> {
  const cards = page.locator("#main-content article");
  const count = await cards.count();
  const prices: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const text = await cards.nth(index).innerText();
    const match = text.match(/₹\s*([\d,]+\.\d{2})/);
    if (match) {
      prices.push(Number(match[1].replace(/,/g, "")));
    }
  }
  return prices;
}
