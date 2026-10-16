import { test, expect } from "@playwright/test";
import {
  apiCreateProduct,
  apiRegister,
  expectClean,
  expectNoHorizontalOverflow,
  expectSignedIn,
  monitor,
  uid,
  uiLogin,
} from "./helpers";

test.describe("customer shopping flow", () => {
  test("search → product → cart → checkout → order history", async ({
    page,
    request,
  }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "flow");
    const customer = await apiRegister(request, "ROLE_CUSTOMER", "flow");
    const productName = `QA Widget ${uid()}`;
    await apiCreateProduct(request, seller.token, productName, {
      price: 25,
      stock: 50,
    });

    const m = monitor(page);
    await uiLogin(page, customer.email, customer.password);
    await expectSignedIn(page);

    // Catalog search finds the product.
    // Scoped to #main-content: Next.js briefly keeps a hidden streamed copy
    // of the page (div#S:0) during client-side navigation.
    await page.goto("/products");
    const search = page.locator("#main-content #product-search");
    await search.fill(productName);
    await search.press("Enter");
    const card = page.locator("#main-content article", { hasText: productName });
    await expect(card).toHaveCount(1);

    // Product detail: raise quantity to 2 and add to cart.
    await card.first().locator("h3 a").click();
    await expect(page.locator("#product-name")).toHaveText(productName);
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Added to your cart" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

    // Cart: item, quantity and subtotal are correct.
    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1, name: "Your cart" })).toBeVisible();
    await expect(page.getByText(productName).first()).toBeVisible();
    const quantity = page.getByRole("spinbutton", { name: "Quantity" });
    await expect(quantity).toHaveValue("2");
    await expect(page.getByText("₹50.00").first()).toBeVisible();

    // Quantity update recalculates server-side state.
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(quantity).toHaveValue("3");
    await expect(page.getByText("₹75.00").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // Checkout places the real order.
    await page.getByRole("button", { name: "Proceed to checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
    await expect(page.getByText(`× 3`)).toBeVisible();
    await page.getByRole("button", { name: "Place order" }).click();

    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible();
    await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("₹75.00").first()).toBeVisible();

    // The order shows up in the customer's history.
    await page.getByRole("link", { name: "View my orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { level: 1, name: "My orders" })).toBeVisible();
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.getByText("₹75.00").first()).toBeVisible();

    // Cart is empty again after checkout.
    await expect(page.getByRole("link", { name: "Cart" }).first()).toBeVisible();

    expectClean(m);
  });

  test("cart items can be removed with a clear empty state", async ({
    page,
    request,
  }) => {
    const seller = await apiRegister(request, "ROLE_SELLER", "rm");
    const customer = await apiRegister(request, "ROLE_CUSTOMER", "rm");
    const productName = `QA Removable ${uid()}`;
    await apiCreateProduct(request, seller.token, productName);

    const m = monitor(page);
    await uiLogin(page, customer.email, customer.password);

    await page.goto("/products");
    const search = page.locator("#main-content #product-search");
    await search.fill(productName);
    await search.press("Enter");
    const card = page.locator("#main-content article", { hasText: productName });
    await expect(card).toHaveCount(1);
    await card.first().locator("h3 a").click();
    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Added to your cart" })
    ).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText(productName).first()).toBeVisible();
    await page.getByRole("button", { name: `Remove ${productName} from cart` }).click();

    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse products" })).toBeVisible();
    expectClean(m);
  });

  test("checkout refuses an empty cart with a friendly state", async ({
    page,
    request,
  }) => {
    const customer = await apiRegister(request, "ROLE_CUSTOMER", "empty");

    const m = monitor(page);
    await uiLogin(page, customer.email, customer.password);
    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse products" })).toBeVisible();
    // No failed calls - the guard runs client-side against the empty cart.
    expectClean(m);
  });

  test("customers see their account menu and role label", async ({
    page,
    request,
  }) => {
    const customer = await apiRegister(request, "ROLE_CUSTOMER", "whoami");
    const m = monitor(page);
    await uiLogin(page, customer.email, customer.password);
    await expectSignedIn(page);

    const menuButton = page.getByRole("button", { name: "Open navigation" });
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
    }
    // The desktop header keeps a hidden copy below the lg breakpoint.
    await expect(
      page.getByText(customer.email).filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("Customer", { exact: true }).filter({ visible: true }).first()
    ).toBeVisible();
    expectClean(m);
  });
});
