import { expect, test } from "@playwright/test";
import { cleanup, createOrder, createPendingProof, createUser, db, login, orderStatus, type TestUser } from "./helpers";

let customer: TestUser;
let staff: TestUser;

test.beforeAll(async () => {
  customer = await createUser("proofs");
  staff = await createUser("proofstaff", { role: "STAFF" });
});
test.afterAll(cleanup);

test("approving a proof moves the order to Approved, and can't be done twice", async ({ page }) => {
  const orderId = await createOrder(customer);
  const proofId = await createPendingProof(orderId, staff);
  expect(await orderStatus(orderId)).toBe("AWAITING_APPROVAL");

  await login(page, customer);
  await page.goto(`/account/proofs/${proofId}`);
  await page.getByRole("button", { name: "Approve proof" }).click();
  await page.getByRole("button", { name: "Yes, approve and print" }).click();
  await expect(page.getByText(/Approved! Your stickers go to print/)).toBeVisible();

  expect(await orderStatus(orderId)).toBe("APPROVED");
  const { rows } = await db.query(`SELECT status, "decidedBy", "decisionSource" FROM "Proof" WHERE id = $1`, [proofId]);
  expect(rows[0]).toMatchObject({ status: "APPROVED", decidedBy: customer.id, decisionSource: "CUSTOMER" });

  // A second visit shows the decision, not the buttons.
  await page.goto(`/account/proofs/${proofId}`);
  await expect(page.getByRole("button", { name: "Approve proof" })).toHaveCount(0);
});

test("rejecting needs a comment, sends the order back to Awaiting Proof and stores the comment", async ({ page }) => {
  const orderId = await createOrder(customer);
  const proofId = await createPendingProof(orderId, staff);

  await login(page, customer);
  await page.goto(`/account/proofs/${proofId}`);
  await page.getByRole("button", { name: "Request changes" }).click();

  // Too short: refused by the server.
  await page.getByLabel("What should we change?").fill("no");
  await page.getByRole("button", { name: "Send my changes" }).click();
  await expect(page.getByText(/at least 3 characters/i).first()).toBeVisible();
  expect(await orderStatus(orderId)).toBe("AWAITING_APPROVAL");

  await page.getByLabel("What should we change?").fill("Please make the logo bigger.");
  await page.getByRole("button", { name: "Send my changes" }).click();
  await expect(page.getByText(/We've got your notes/)).toBeVisible();

  expect(await orderStatus(orderId)).toBe("AWAITING_PROOF");
  const { rows } = await db.query(`SELECT status, "customerComment" FROM "Proof" WHERE id = $1`, [proofId]);
  expect(rows[0]).toMatchObject({ status: "REJECTED", customerComment: "Please make the logo bigger." });
});
