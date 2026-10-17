import { test, expect } from "@playwright/test";
import {
  expectClean,
  expectNoHorizontalOverflow,
  isDesktop,
  monitor,
  uid,
} from "./helpers";

test.describe("home & navigation", () => {
  test("home page renders hero, footer and stays clean", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Quality products from independent sellers",
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "MarketHub" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expectClean(m);
  });

  test("primary navigation reaches the catalog", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/");

    if (isDesktop(page)) {
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: "Products", exact: true })
        .click();
    } else {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(page.locator("#mobile-navigation")).toBeVisible();
      await page
        .locator("#mobile-navigation")
        .getByRole("link", { name: "Products", exact: true })
        .click();
    }

    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "All products" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectClean(m);
  });

  test("navbar search forwards the query to server-side search", async ({
    page,
  }) => {
    test.skip(!isDesktop(page), "desktop navbar search is hidden below lg");

    const m = monitor(page);
    await page.goto("/");
    const term = `zzznothingmatchesthis${uid()}`;
    await page.locator("#nav-search").fill(term);
    await page.locator("#nav-search").press("Enter");

    await expect(page).toHaveURL(`/products?q=${encodeURIComponent(term)}`);
    await expect(
      page.getByRole("heading", { name: "No matches found" })
    ).toBeVisible();
    expectClean(m);
  });

  test("hero search forwards the query to the catalog", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/");
    const term = `zzznothingmatchesthis${uid()}`;
    await page.locator("#hero-search").fill(term);
    await page.locator("#hero-search").press("Enter");

    await expect(page).toHaveURL(`/products?q=${encodeURIComponent(term)}`);
    await expect(page.locator("#main-content #product-search")).toHaveValue(term);
    await expect(
      page.getByRole("heading", { name: "No matches found" })
    ).toBeVisible();
    expectClean(m);
  });

  test("hero search with an empty query opens the full catalog", async ({
    page,
  }) => {
    const m = monitor(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "All products" })
    ).toBeVisible();
    expectClean(m);
  });

  test("categories menu opens and filters the catalog", async ({ page }) => {
    test.skip(!isDesktop(page), "categories menu lives in the mobile menu");

    const m = monitor(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Categories" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name: "Electronics" }).click();

    await expect(page).toHaveURL(/\/products\?categoryId=2/);
    await expect(
      page.getByRole("heading", { level: 1, name: "All products" })
    ).toBeVisible();
    expectClean(m);
  });

  test("unknown routes render the 404 page with working actions", async ({
    page,
  }) => {
    const m = monitor(page);
    await page.goto(`/definitely-not-a-page-${uid()}`);

    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();

    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page).toHaveURL(/\/$/);
    expectClean(m);
  });
});
