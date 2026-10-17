import { test, expect } from "@playwright/test";
import {
  API_BASE,
  apiRegister,
  expectClean,
  expectSignedIn,
  monitor,
  uid,
  uiLogin,
} from "./helpers";

test.describe("seller dashboard", () => {
  test("customers get an explanation instead of the seller area", async ({
    page,
    request,
  }) => {
    const customer = await apiRegister(request, "ROLE_CUSTOMER", "noaccess");
    const m = monitor(page);
    await uiLogin(page, customer.email, customer.password);

    await page.goto("/seller");
    await expect(
      page.getByRole("heading", { name: "Seller access required" })
    ).toBeVisible();
    // Client-side guard: no failing seller API call, no 403 noise.
    expect(m.apiFailures).toEqual([]);
    expectClean(m);
  });

  test("dashboard sections load for a real seller", async ({ page, request }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "dash");
    const m = monitor(page);
    await uiLogin(page, seller.email, seller.password);
    await expectSignedIn(page);

    await page.goto("/seller");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();

    await page.goto("/seller/products");
    await expect(page.getByRole("heading", { level: 1, name: "Products" })).toBeVisible();
    // The header and the empty-state card both link to the new product form.
    await expect(page.getByRole("link", { name: "Add product" }).first()).toBeVisible();

    await page.goto("/seller/orders");
    await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();

    expectClean(m);
  });

  test("new product form validates before submitting", async ({
    page,
    request,
  }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "formval");
    const m = monitor(page);
    await uiLogin(page, seller.email, seller.password);

    await page.goto("/seller/products/new");
    await page.getByRole("button", { name: "Create product", exact: true }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Slug is required")).toBeVisible();
    await expect(page.getByText("Price is required")).toBeVisible();
    await expect(page.getByText("Stock quantity is required")).toBeVisible();
    expect(m.apiFailures).toEqual([]);
    expectClean(m);
  });

  test("seller creates a product and it is publicly visible", async ({
    page,
    request,
  }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "create");

    const name = `QA Listing ${uid()}`;
    const m = monitor(page);
    await uiLogin(page, seller.email, seller.password);

    await page.goto("/seller/products/new");
    await page.locator("#product-name").fill(name);
    await page.locator("#product-slug").fill(`qa-${uid()}`);
    await page.locator("#product-price").fill("19.99");
    await page.locator("#product-stock").fill("25");

    // The select only offers leaf categories (parents render as optgroups),
    // so pick whatever option the form actually loaded.
    const category = page.locator("#product-category");
    const firstOption = category.locator("option").nth(1);
    await expect(firstOption).toBeAttached();
    const categoryId = await firstOption.getAttribute("value");
    expect(categoryId).toBeTruthy();
    await category.selectOption(categoryId!);
    await page.getByRole("button", { name: "Create product", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Product created" })).toBeVisible();
    await expect(page).toHaveURL(/\/seller\/products$/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { level: 1, name: "Products" })
    ).toBeVisible();

    // It shows up in the seller's own list…
    await expect(page.getByText(name).first()).toBeVisible();

    // …and in the public catalog.
    const anon = await request.get(
      `${API_BASE}/products?search=${encodeURIComponent(name)}`
    );
    expect(anon.status()).toBe(200);
    const payload = await anon.json();
    const ids = payload.data.content.map((item: { id: number }) => item.id);
    expect(ids.length).toBe(1);

    await page.goto(`/products?q=${encodeURIComponent(name)}`);
    await expect(
      page.locator("#main-content article", { hasText: name })
    ).toHaveCount(1);

    expectClean(m);
  });

  test("seller edits and archives their own product", async ({ page, request }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "editarch");
    const name = `QA Edit ${uid()}`;
    const m = monitor(page);
    await uiLogin(page, seller.email, seller.password);

    // Create the fixture through the UI (same flow already covered above).
    await page.goto("/seller/products/new");
    await page.locator("#product-name").fill(name);
    await page.locator("#product-slug").fill(`qa-${uid()}`);
    await page.locator("#product-price").fill("19.99");
    await page.locator("#product-stock").fill("25");
    const category = page.locator("#product-category");
    const firstOption = category.locator("option").nth(1);
    await expect(firstOption).toBeAttached();
    await category.selectOption((await firstOption.getAttribute("value"))!);
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    await expect(page).toHaveURL(/\/seller\/products$/, { timeout: 15000 });

    // Edit: change the price and save.
    const row = page.locator("#main-content tr", { hasText: name }).first();
    await row.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/seller\/products\/\d+\/edit$/);
    await page.locator("#product-price").fill("42.50");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Changes saved" })).toBeVisible();

    // The new price is live in the public catalog.
    const anon = await request.get(
      `${API_BASE}/products?search=${encodeURIComponent(name)}`
    );
    expect(anon.status()).toBe(200);
    const payload = await anon.json();
    expect(payload.data.content[0].price).toBe(42.5);

    // Archive: explicit two-step confirmation, then the status shows.
    await page.goto("/seller/products");
    const listRow = page.locator("#main-content tr", { hasText: name }).first();
    await listRow.getByRole("button", { name: "Archive" }).click();
    await listRow.getByRole("button", { name: "Confirm" }).click();
    await expect(listRow.getByText("Archived")).toBeVisible();

    // An archived product is hidden from the marketplace (real API check).
    const after = await request.get(
      `${API_BASE}/products?search=${encodeURIComponent(name)}`
    );
    expect(after.status()).toBe(200);
    const afterPayload = await after.json();
    expect(afterPayload.data.content).toEqual([]);

    expectClean(m);
  });
});
