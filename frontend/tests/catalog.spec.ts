import { test, expect } from "@playwright/test";
import {
  expectClean,
  expectNoHorizontalOverflow,
  monitor,
  uid,
  visibleCardPrices,
} from "./helpers";

test.describe("catalog", () => {
  test("lists products and opens a product detail page", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/products");

    const cards = page.locator("#main-content article");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page);

    const name = await cards.first().locator("h3").innerText();
    await cards.first().locator("h3 a").click();

    await expect(page).toHaveURL(/\/products\/\d+$/);
    await expect(page.locator("#product-name")).toHaveText(name.trim());
    await expect(
      page.getByRole("button", { name: "Add to cart", exact: true })
    ).toBeVisible();
    expectClean(m);
  });

  test("search narrows results and the empty state recovers", async ({
    page,
  }) => {
    const m = monitor(page);
    await page.goto("/products");
    await expect(page.locator("#main-content article").first()).toBeVisible();

    const term = `noSuchProduct${uid()}`;
    // Scoped to #main-content: Next.js briefly keeps a hidden streamed copy
    // of the page (div#S:0) during client-side navigation.
    const search = page.locator("#main-content #product-search");
    await search.fill(term);
    await search.press("Enter");

    await expect(
      page.getByRole("heading", { name: "No matches found" })
    ).toBeVisible();
    await expect(page.getByText(`No products match "${term}"`)).toBeVisible();
    expect(await page.locator("#main-content article").count()).toBe(0);

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.locator("#main-content article").first()).toBeVisible();
    expectClean(m);
  });

  test("price sorting is applied server-side", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/products");
    await expect(page.locator("#main-content article").first()).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/products") &&
          res.url().includes("sortBy=price_asc") &&
          res.status() === 200
      ),
      page.locator("#main-content #product-sort").selectOption("price_asc"),
    ]);
    expect(response.status()).toBe(200);

    const prices = await visibleCardPrices(page);
    expect(prices.length).toBeGreaterThan(1);
    for (let i = 1; i < prices.length; i += 1) {
      expect(prices[i - 1], `prices out of order: ${prices.join(", ")}`).toBeLessThanOrEqual(
        prices[i]
      );
    }
    expectClean(m);
  });

  test("category chips filter the catalog", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/products");
    await expect(page.locator("#main-content article").first()).toBeVisible();

    const chip = page.getByRole("button", { name: "Electronics" });
    await expect(chip).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/products") &&
          res.url().includes("categoryId=2") &&
          res.status() === 200
      ),
      chip.click(),
    ]);
    expect(response.status()).toBe(200);
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    const payload = await response.json();
    for (const item of payload.data.content) {
      expect(item.categoryId).toBe(2);
    }
    expectClean(m);
  });

  test("guests are prompted to sign in instead of getting an error", async ({
    page,
  }) => {
    const m = monitor(page);
    await page.goto("/products");
    await page.locator("#main-content article").first().locator("h3 a").click();
    await expect(page.locator("#product-name")).toBeVisible();

    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await expect(
      page.getByText(/with a customer account to add products to your cart/)
    ).toBeVisible();
    // No error toast, no failed API call - the flow explains itself.
    expect(m.apiFailures).toEqual([]);
    expectClean(m);
  });

  test("a category deep link selects the matching chip", async ({ page }) => {
    const m = monitor(page);
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/products") &&
          res.url().includes("categoryId=2") &&
          res.status() === 200
      ),
      page.goto("/products?categoryId=2"),
    ]);
    expect(response.status()).toBe(200);

    // The chip state reflects the URL, not just clicks.
    const chip = page.getByRole("button", { name: "Electronics" });
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    const allChip = page.getByRole("button", { name: "All products" });
    await expect(allChip).toHaveAttribute("aria-pressed", "false");

    const payload = await response.json();
    expect(payload.data.content.length).toBeGreaterThan(0);
    for (const item of payload.data.content) {
      expect(item.categoryId).toBe(2);
    }
    expectClean(m);
  });

  test("a search deep link pre-fills the catalog and navbar search", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 1280) < 1024,
      "navbar search only renders at lg"
    );
    const m = monitor(page);
    const term = `zzznothingmatchesthis${uid()}`;
    await page.goto(`/products?q=${encodeURIComponent(term)}`);

    // The submitted query survives the server round-trip into both inputs.
    await expect(page.locator("#main-content #product-search")).toHaveValue(term);
    await expect(page.locator("#nav-search")).toHaveValue(term);
    await expect(page.getByRole("heading", { name: "No matches found" })).toBeVisible();
    expectClean(m);
  });
});
