import { expect, test } from "@playwright/test";
import { cleanup, createUser, login } from "./helpers";

test.afterAll(cleanup);

test("a wrong current password is rejected and nothing changes", async ({ page }) => {
  const user = await createUser("password");
  await login(page, user);
  await page.goto("/account/settings");

  await page.getByLabel("Current password").fill("this is not my password");
  await page.getByLabel("New password", { exact: true }).fill("a brand new long passphrase");
  await page.getByLabel("Confirm new password").fill("a brand new long passphrase");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("That doesn't match your current password.")).toBeVisible();

  // The old password still works.
  await page.context().clearCookies();
  await login(page, user);
});
