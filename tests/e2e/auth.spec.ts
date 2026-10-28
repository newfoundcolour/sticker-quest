import { expect, test } from "@playwright/test";
import { PASSWORD, cleanup, confirmUser, createUser, findAuthUserId, login, trackEmail, uniqueEmail } from "./helpers";

test.afterAll(cleanup);

test("sign up, confirm, log in and log out — the nav switches each time", async ({ page }) => {
  const email = uniqueEmail("signup");
  trackEmail(email);

  // Logged out: Log in / Sign up in the nav.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

  await page.goto("/signup");
  await page.getByLabel("First name").fill("Sam");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();

  // Stand in for clicking the emailed link.
  const userId = await findAuthUserId(email);
  expect(userId, "signup should have created the user (check the test project's email settings)").toBeTruthy();
  await confirmUser(userId!);

  // Clear any session the signup may have created, then log in for real.
  await page.context().clearCookies();
  await login(page, { email, password: PASSWORD });
  await expect(page.getByRole("button", { name: /Account menu/ })).toHaveText(/ST/);
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);

  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
});

test("login errors are generic: unknown email and wrong password look the same", async ({ page }) => {
  const user = await createUser("generic");

  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Password", { exact: true }).fill("whatever-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-right-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("an unconfirmed account can't use the account area", async ({ page }) => {
  const user = await createUser("unconfirmed", { confirmed: false });
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
});
