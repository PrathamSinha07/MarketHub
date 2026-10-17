import { test, expect, type Page } from "@playwright/test";
import { expectClean, isDesktop, monitor } from "./helpers";

const GUEST_PATHS: Array<{ path: string; marker: string | RegExp }> = [
  { path: "/", marker: /Shop by category/ },
  { path: "/products", marker: /All products/ },
  { path: "/login", marker: /Sign in/ },
  { path: "/register", marker: /Create your account/ },
];

/**
 * Layout-level horizontal overflow check.
 *
 * An element is a real offender only when it sticks out past the viewport
 * AND nothing clips it (sr-only helpers, overflow-hidden media boxes and
 * inner scrollers are all intentional and harmless).
 */
async function expectNoPageOverflow(page: Page) {
  const info = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: Array<{ tag: string; cls: string; right: number }> = [];
    const clipsHorizontally = (el: HTMLElement): boolean => {
      for (
        let node: HTMLElement | null = el.parentElement;
        node !== null;
        node = node.parentElement
      ) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === "hidden" || overflowX === "auto" || overflowX === "scroll") {
          return true;
        }
      }
      return false;
    };
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right <= width + 1) continue;
      // Screen-reader-only helpers and clipped subtrees never scroll the page.
      if (el.classList.contains("sr-only")) continue;
      if (clipsHorizontally(el)) continue;
      offenders.push({
        tag: el.tagName,
        cls: String(el.className).slice(0, 120),
        right: Math.round(rect.right),
      });
    }
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: width,
      bodyOverflow: document.body.scrollWidth > width + 1,
      offenders,
    };
  });
  expect(info.bodyOverflow, `page scrolls horizontally: ${JSON.stringify(info)}`).toBe(false);
  expect(info.docScrollWidth, `document overflows viewport: ${JSON.stringify(info)}`).toBeLessThanOrEqual(info.viewportWidth + 1);
  expect(info.offenders, `elements stick out past the viewport: ${JSON.stringify(info.offenders)}`).toEqual([]);
}

test.describe("responsive layout", () => {
  for (const vp of [
    { name: "desktop", width: 1280, height: 720 },
    { name: "mobile", width: 375, height: 667 },
  ]) {
    test(`guest pages have no horizontal overflow at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const m = monitor(page);
      for (const { path, marker } of GUEST_PATHS) {
        await page.goto(path);
        await expect(page.locator("#main-content").getByText(marker).first()).toBeVisible();
        await expectNoPageOverflow(page);
      }
      expectClean(m);
    });
  }

  test("mobile catalog and product detail have no horizontal overflow", async ({ page }) => {
    test.skip(isDesktop(page), "mobile layout focus");
    const m = monitor(page);

    await page.goto("/products");
    // Heading role ignores the chip button that repeats the same words.
    await expect(
      page.getByRole("heading", { level: 1, name: "All products" })
    ).toBeVisible();
    await expectNoPageOverflow(page);

    // Use whatever product the real API returned (catalog content is data-driven).
    const card = page.locator("#main-content article").first();
    const name = (await card.locator("h3").innerText()).trim();
    await card.locator("h3 a").click();
    await expect(page.locator("#product-name")).toHaveText(name);
    await expectNoPageOverflow(page);
    expectClean(m);
  });

  test("mobile menu navigates to real pages", async ({ page }) => {
    test.skip(isDesktop(page), "mobile navigation");
    const m = monitor(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.locator("#mobile-navigation");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Products", exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "All products" })
    ).toBeVisible();

    // The drawer is closed again after navigating (toggle reads "Open navigation").
    await expect(page.locator("#mobile-navigation")).toHaveCount(0);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.locator("#mobile-navigation").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("#login-email")).toBeVisible();
    expectClean(m);
  });

  test("product detail breadcrumb shows the real product name", async ({ page }) => {
    test.skip(isDesktop(page), "mobile layout focus");
    const m = monitor(page);

    await page.goto("/products");
    const card = page.locator("#main-content article").first();
    const name = (await card.locator("h3").innerText()).trim();
    await card.locator("h3 a").click();
    await expect(page.locator("#product-name")).toHaveText(name);

    const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumb.getByText(name)).toBeVisible();
    await expect(crumb.getByText("Product details")).toHaveCount(0);
    expectClean(m);
  });
});
