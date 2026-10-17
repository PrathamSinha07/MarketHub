import { test, expect } from "@playwright/test";
import { apiRegister, expectClean, monitor, uiLogin } from "./helpers";

/**
 * Failure-path coverage with intercepted network (no live API involved).
 * These tests verify how the UI behaves when the MarketHub API is down,
 * erroring, or unreachable — the backend is not modified; failures are
 * simulated only through Playwright route interception.
 */
test.describe("API failure states", () => {
  test("products page shows 'Products unavailable' and recovers after retry", async ({
    page,
  }) => {
    const m = monitor(page);
    let failNext = true;

    await page.route("**/api/v1/products**", async (route) => {
      if (failNext) {
        failNext = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, message: "Internal error" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/products");
    const alert = page.locator("#main-content").getByRole("alert");
    await expect(alert).toContainText("Products unavailable");

    // Retry re-requests the API (route now passes through).
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.locator("#main-content article").first()).toBeVisible();
    await expect(alert).toHaveCount(0);
    // The single 500 is the simulated failure this test orchestrates.
    m.serverErrors = m.serverErrors.filter((entry) => !entry.includes("/api/v1/products"));
    expectClean(m, { allowApi: /500 .*\/api\/v1\/products/ });
  });

  test("products page surfaces a network failure instead of hanging", async ({ page }) => {
    const m = monitor(page);
    await page.route("**/api/v1/products**", (route) => route.abort("connectionrefused"));

    await page.goto("/products");
    // The skeletons are replaced by an explanation (Failed to fetch from abort).
    await expect(page.locator("#main-content").getByRole("alert")).toContainText("Products unavailable");
    await expect(page.locator("#main-content article")).toHaveCount(0);

    // The aborted catalog request is the simulated failure itself; keep the
    // rest of the page (chunks, assets) clean.
    m.failedRequests = m.failedRequests.filter(
      (entry) => !entry.includes("/api/v1/products")
    );
    m.apiFailures = m.apiFailures.filter(
      (entry) => !entry.includes("/api/v1/products")
    );
    expectClean(m);
  });

  test("cart page shows 'Cart unavailable' and recovers after retry", async ({ page, request }) => {
    const account = await apiRegister(request, "ROLE_CUSTOMER", "cartfail");
    const m = monitor(page);
    let failing = true;

    await page.route("**/api/v1/cart**", async (route) => {
      if (failing) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, message: "Internal error" }),
        });
        return;
      }
      await route.continue();
    });

    await uiLogin(page, account.email, account.password);
    await page.goto("/cart");
    const alert = page.locator("#main-content").getByRole("alert");
    await expect(alert).toContainText("Cart unavailable");

    // Retry re-fetches the real cart (route passes through now).
    failing = false;
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    // The 500s are the simulated failures this test orchestrates.
    m.serverErrors = m.serverErrors.filter((entry) => !entry.includes("/api/v1/cart"));
    expectClean(m, { allowApi: /500 .*\/api\/v1\/cart/ });
  });
});
