import { test, expect } from "@playwright/test";
import {
  apiRegister,
  expectClean,
  expectSignedIn,
  expectSignedOut,
  monitor,
  uid,
  uiLogin,
  uiSignOut,
} from "./helpers";

test.describe("authentication", () => {
  test("registration form explains what is missing", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/register");

    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await expect(page.getByText("Last name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    expect(m.apiFailures).toEqual([]);

    await page.locator("#register-email").fill("not-an-email");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByText("Invalid email format")).toBeVisible();

    expectClean(m);
  });

  test("customer can register, sign out and sign back in", async ({ page }) => {
    const m = monitor(page);
    const email = `qa-ui-${uid()}@example.com`;
    const password = "Password1!";

    await page.goto("/register");
    await page.locator("#register-firstName").fill("QA");
    await page.locator("#register-lastName").fill("Browser");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill(password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expectSignedIn(page);

    await uiSignOut(page);
    await expect(page).toHaveURL(/\/$/);

    await uiLogin(page, email, password);
    await expectSignedIn(page);

    expectClean(m);
  });

  test("wrong password shows a clear error and stays on the form", async ({
    page,
  }) => {
    const m = monitor(page);
    const account = await apiRegister(
      page.request,
      "ROLE_CUSTOMER",
      "badlogin"
    );

    await page.goto("/login");
    await page.locator("#login-email").fill(account.email);
    await page.locator("#login-password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // The route announcer also exposes role="alert" - scope to the form's message.
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(
      "The email or password you entered is incorrect."
    );
    await expect(page).toHaveURL(/\/login/);
    await expectSignedOut(page);

    // The 401 is the expected answer for a bad password.
    expectClean(m, { allowApi: /401/ });
  });

  test("guests hitting a protected page are sent to sign in", async ({
    page,
  }) => {
    const m = monitor(page);
    await page.goto("/orders");

    await expect(page).toHaveURL(/\/login\?next=%2Forders/);
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" })
    ).toBeVisible();
    expectClean(m);
  });

  test("sign-in form validates before calling the API", async ({ page }) => {
    const m = monitor(page);
    await page.goto("/login");
    await page.locator("#login-email").fill("nope");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Invalid email format")).toBeVisible();
    expect(m.apiFailures).toEqual([]);
    expectClean(m);
  });
});
