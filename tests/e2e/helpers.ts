import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { loadTestEnv } from "./env";

/**
 * Test data helpers. Users are created through Supabase's admin API (the
 * auth.users trigger then creates their Profile, exactly like a real signup);
 * orders, proofs and conversations are inserted directly. Everything a test
 * creates is tracked and removed again by cleanup().
 */

const env = loadTestEnv();

export const admin = createClient(env.TEST_SUPABASE_URL, env.TEST_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const db = new Pool({ connectionString: env.TEST_DATABASE_URL, max: 2 });

export const PASSWORD = "correct horse battery staple";

const createdUserIds: string[] = [];
const createdEmails: string[] = [];
const uploaded: { bucket: string; path: string }[] = [];

/** Set TEST_EMAIL_DOMAIN in .env.test if your test project rejects example.com on signup. */
const EMAIL_DOMAIN = process.env.TEST_EMAIL_DOMAIN || env.TEST_EMAIL_DOMAIN || "example.com";

export function uniqueEmail(label: string): string {
  return `e2e+${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@${EMAIL_DOMAIN}`;
}

export type TestUser = { id: string; email: string; password: string };

export async function createUser(
  label: string,
  opts: { confirmed?: boolean; role?: "CUSTOMER" | "STAFF" | "ADMIN"; firstName?: string } = {},
): Promise<TestUser> {
  const email = uniqueEmail(label);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: opts.confirmed ?? true,
    user_metadata: { first_name: opts.firstName ?? "Test", last_name: label },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  createdUserIds.push(data.user.id);
  createdEmails.push(email);
  // Roles are only ever granted directly in the database — same as production.
  if (opts.role && opts.role !== "CUSTOMER") {
    await db.query(`UPDATE "Profile" SET role = $1 WHERE id = $2`, [opts.role, data.user.id]);
  }
  return { id: data.user.id, email, password: PASSWORD };
}

export function trackEmail(email: string) {
  createdEmails.push(email);
}

/** Looks up a user created through the signup form, so cleanup can remove it. */
export async function findAuthUserId(email: string): Promise<string | null> {
  const { rows } = await db.query(`SELECT id FROM "Profile" WHERE email = $1`, [email]);
  const id: string | undefined = rows[0]?.id;
  if (id) createdUserIds.push(id);
  return id ?? null;
}

export async function confirmUser(userId: string) {
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) throw new Error(`confirmUser failed: ${error.message}`);
}

/** An artwork URL that passes the app's "our own Cloudinary folder" check in the test server. */
export function testArtworkUrl(): string {
  return `https://res.cloudinary.com/${env.TEST_CLOUDINARY_CLOUD_NAME}/image/upload/v1/sticker-quest/artwork/e2e-${randomUUID()}.png`;
}

export async function createOrder(user: TestUser, status = "AWAITING_PROOF"): Promise<string> {
  const id = `e2e${randomUUID().replace(/-/g, "")}`;
  await db.query(
    `INSERT INTO "Order" (id, status, "customerName", email, phone, "shippingAddress", "totalPrice", "userId", "updatedAt")
     VALUES ($1, $2, 'Test Customer', $3, '0800000000', '1 Test St, Cape Town, Western Cape, 8001', 123.45, $4, now())`,
    [id, status, user.email, user.id],
  );
  await db.query(
    `INSERT INTO "OrderItem" (id, "orderId", "stickerType", "cutType", shape, finish, "widthCm", "heightCm", quantity,
       "artworkUrl", "artworkFilename", "pricePerUnit", "totalPrice")
     VALUES ($1, $2, 'VINYL', 'DIE', 'CIRCLE', 'MATTE', 7.5, 7.5, 100, $3, 'logo.png', 1.23, 123.45)`,
    [`${id}i`, id, testArtworkUrl()],
  );
  return id;
}

// A real 1×1 PNG, so magic-byte checks and image rendering behave normally.
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function uploadTestFile(bucket: string, folder: string): Promise<string> {
  const path = `${folder}/e2e-${randomUUID()}.png`;
  const { error } = await admin.storage.from(bucket).upload(path, TINY_PNG, { contentType: "image/png" });
  if (error) throw new Error(`upload to ${bucket} failed: ${error.message}`);
  uploaded.push({ bucket, path });
  return path;
}

/** A pending proof (version 1) on the order, which moves to Awaiting Approval — as if staff uploaded it. */
export async function createPendingProof(orderId: string, staff: TestUser): Promise<string> {
  const id = `e2ep${randomUUID().replace(/-/g, "")}`;
  const storagePath = await uploadTestFile("proofs", `orders/${orderId}`);
  await db.query(
    `INSERT INTO "Proof" (id, "orderId", version, "storagePath", "originalFilename", "mimeType", "sizeBytes", "uploadedBy")
     VALUES ($1, $2, 1, $3, 'proof.png', 'image/png', $4, $5)`,
    [id, orderId, storagePath, TINY_PNG.length, staff.id],
  );
  await db.query(`UPDATE "Order" SET status = 'AWAITING_APPROVAL' WHERE id = $1`, [orderId]);
  return id;
}

/** A conversation with one customer message carrying an image attachment. Returns ids. */
export async function createConversation(user: TestUser): Promise<{ conversationId: string; messageId: string }> {
  const conversationId = `e2ec${randomUUID().replace(/-/g, "")}`;
  const messageId = `e2em${randomUUID().replace(/-/g, "")}`;
  const attachmentPath = await uploadTestFile("support-attachments", `users/${user.id}`);
  await db.query(`INSERT INTO "SupportConversation" (id, "userId", category) VALUES ($1, $2, 'PRINT_QUALITY')`, [
    conversationId,
    user.id,
  ]);
  await db.query(
    `INSERT INTO "SupportMessage" (id, "conversationId", sender, "senderUserId", body, "attachmentPath", "attachmentName")
     VALUES ($1, $2, 'CUSTOMER', $3, 'Private message for e2e', $4, 'photo.png')`,
    [messageId, conversationId, user.id, attachmentPath],
  );
  return { conversationId, messageId };
}

export async function orderStatus(orderId: string): Promise<string> {
  const { rows } = await db.query(`SELECT status FROM "Order" WHERE id = $1`, [orderId]);
  return rows[0]?.status;
}

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

/** Removes every user, order, file and conversation this run created. */
export async function cleanup() {
  for (const { bucket, path } of uploaded.splice(0)) {
    await admin.storage.from(bucket).remove([path]);
  }
  if (createdEmails.length) {
    // Orders cascade to items and proofs; conversations cascade with the Profile.
    await db.query(`DELETE FROM "Order" WHERE email = ANY($1)`, [createdEmails.splice(0)]);
  }
  for (const id of createdUserIds.splice(0)) {
    await admin.auth.admin.deleteUser(id); // the auth.users trigger deletes the Profile
  }
}
