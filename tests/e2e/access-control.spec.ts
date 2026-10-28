import { expect, test } from "@playwright/test";
import {
  cleanup,
  createConversation,
  createOrder,
  createPendingProof,
  createUser,
  login,
  type TestUser,
} from "./helpers";

/**
 * Customer B must not be able to see anything of customer A's: order, proof,
 * proof file, conversation or attachment. Every one should be a plain 404.
 */
let alice: TestUser;
let bob: TestUser;
let staff: TestUser;
let aliceOrderId: string;
let aliceProofId: string;
let aliceConversationId: string;
let aliceMessageId: string;

test.beforeAll(async () => {
  alice = await createUser("alice");
  bob = await createUser("bob");
  staff = await createUser("staff", { role: "STAFF" });
  aliceOrderId = await createOrder(alice);
  aliceProofId = await createPendingProof(aliceOrderId, staff);
  ({ conversationId: aliceConversationId, messageId: aliceMessageId } = await createConversation(alice));
});
test.afterAll(cleanup);

test("a customer can't read another customer's order, proof, conversation or files", async ({ page }) => {
  await login(page, bob);

  const urls = [
    `/account/orders/${aliceOrderId}`,
    `/account/proofs/${aliceProofId}`,
    `/account/proofs/${aliceProofId}/file`,
    `/account/support/${aliceConversationId}`,
    `/account/support/attachments/${aliceMessageId}`,
  ];
  for (const url of urls) {
    const res = await page.request.get(url, { maxRedirects: 0 });
    expect(res.status(), url).toBe(404);
  }

  // Bob's own lists don't show Alice's things either.
  await page.goto("/account/orders");
  await expect(page.getByText("No orders yet")).toBeVisible();
  await page.goto("/account/support");
  await expect(page.getByText("No messages yet")).toBeVisible();
});

test("the owner can open their own proof file (redirect to a signed URL)", async ({ page }) => {
  await login(page, alice);
  const res = await page.request.get(`/account/proofs/${aliceProofId}/file`, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toContain("/storage/v1/object/sign/proofs/");
});

test("a customer can't open the admin area", async ({ page }) => {
  await login(page, bob);
  for (const url of ["/admin", "/admin/orders", `/admin/orders/${aliceOrderId}`, "/admin/support", `/admin/proofs/${aliceProofId}/file`]) {
    const res = await page.request.get(url, { maxRedirects: 0 });
    expect(res.status(), url).toBe(404);
  }
});

test("a customer is turned away at the admin login", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(bob.email);
  await page.getByLabel("Password").fill(bob.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("logged-out visitors are sent to login, and files are 404 / redirected", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);
  const res = await page.request.get(`/admin/proofs/${aliceProofId}/file`, { maxRedirects: 0 });
  expect(res.status()).toBe(404);
});
