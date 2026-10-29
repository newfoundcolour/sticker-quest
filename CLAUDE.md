# Sticker Quest

South African, web-only, tech-powered print shop specialising in custom stickers and labels. No physical location — everything is ordered through an interactive web configurator.

**Brand personality:** fun, friendly, simple, accessible — playful and pioneering in tone.

Visual/design decisions must follow `DESIGN.md` in the project root.

## Stack

- **Framework:** Next.js 16 (App Router), `src/` layout — the proxy (formerly middleware) is `src/proxy.ts`
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase (Postgres + Supabase Auth via `@supabase/ssr`)
- **ORM:** Prisma (connects as `postgres`, which bypasses RLS)
- **Artwork storage:** Cloudinary (customer-uploaded artwork, folder `sticker-quest/artwork`)
- **Private files:** Supabase Storage — buckets `proofs` and `support-attachments` (private)
- **Payments:** PayFast — charged upfront at checkout (not integrated yet; `Order` has no `paymentStatus` — see `TODO(payfast)`)
- **Shipping:** The Courier Guy — manual booking for v1, no API integration yet. A flat fee (`PricingSetting` key `SHIPPING_FLAT_FEE`) is added once per order by `getPricedCart`; `Order.shippingFee` records it and `Order.totalPrice` includes it.
- **Discount codes:** not built yet — the cart shows a placeholder Discount card (`src/components/cart/DiscountCard.tsx`, `TODO(discounts)`) that never changes the price

## Product configurator

Customers configure a product with these options, and price recalculates live as each is selected:

- **Sticker type:** vinyl, holographic, chrome, glitter, clear, sticker sheets, label sheets
- **Cut type:** kiss or die
- **Shape:** square, circle, rectangle, oval, custom
- **Finish:** matte or gloss for vinyl and label sheets only; every other type has a single option (stored as matte) labelled with its material name
- **Size:** 50, 75, 100 or 125 mm (square presets), or custom in mm rounded to the nearest 0.5 (up to max printer width). Stored and priced in cm.
- **Quantity:** minimum 50, no upper limit

Pricing is driven by a pricing rules table, not hardcoded — exact pricing tables are still being finalized, so avoid baking specific prices into code. Prices are always recomputed server-side (`getPricedCart`); never trust a price, size or quantity from the browser.

## Order flow

1. Customer configures product and uploads artwork (logged in or as a guest).
2. Checkout needs a verified account. The cart's Checkout button (`CheckoutPanel`) asks guests to log in and asks for any missing name, surname, phone or delivery address in a popup, saved to their Profile (`src/lib/validation/deliveryDetails.ts`; the server re-checks before every order). It then places the order from the session + Profile, never from browser input. `/checkout` just redirects to the cart.
3. Customer pays via PayFast (payment is upfront) — not built yet: `TODO(payfast)` in `src/app/actions/checkout.ts` is where the redirect goes.
4. Order enters `awaiting_proof` status with the customer's `userId`.
5. Staff preflight the artwork in Illustrator and upload a proof on `/admin/orders/[id]` → order moves to `awaiting_approval`. (Staff may still send proofs by WhatsApp/email.)
6. The customer approves (→ `approved`) or requests changes with a comment (→ back to `awaiting_proof`) at `/account/proofs`. Staff can record an approval given elsewhere ("approve on customer's behalf"), and setting an order to Approved by hand records the pending proof as staff-approved.

**Order pipeline (status values):** `awaiting_proof` → `awaiting_approval` → `approved` → `printing` → `shipped`

**Delivery promise:** printed and dispatched the next business day after proof approval.

## Roles & access

Three roles, stored **only** in `Profile.role` (a server-side table): **customer** (default for every signup), **staff**, **admin**.

- New auth users get a `CUSTOMER` Profile from a Postgres trigger on `auth.users` (also keeps `Profile.email` in sync with the verified email and deletes the Profile with the user). Staff/admin are granted by hand in the database. No form, action or API ever writes `role`.
- **Never** use Supabase `user_metadata` for authorisation — users can edit it. It only carries display details at signup (first/last name, and optional company, phone, Instagram handle), which the trigger re-checks before copying into `Profile`.
- `/admin/*` — staff/admin only (`requireStaff()`); a logged-in customer gets a 404. `/admin/login` admits staff only.
- `/account/*` — a logged-in user with a **verified email** (`requireVerifiedUser()`).
- The proxy only refreshes the session, sets the CSP and redirects logged-out `/account` visits; it is not a security boundary.

## Routes

- **Auth:** `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/auth/confirm` (Supabase email links: `token_hash` + `type`, or PKCE `code`), `/terms`, `/privacy` (placeholders)
- **Account:** `/account` (dashboard), `/account/orders`, `/account/orders/[id]`, `/account/reorder`, `/account/proofs`, `/account/proofs/[id]`, `/account/proofs/[id]/file`, `/account/support`, `/account/support/new`, `/account/support/[id]`, `/account/support/attachments/[messageId]`, `/account/settings`
- **Reorder:** `/configure/[type]?reorder=<orderItemId>` prefills the configurator from the customer's own item
- **Admin:** `/admin/login`, `/admin/orders`, `/admin/orders/[id]` (with Proofs panel), `/admin/proofs/[id]/file`, `/admin/support`, `/admin/support/[id]`, `/admin/support/attachments/[messageId]`

## Data model (beyond orders/pricing)

- **Profile** — id = Supabase auth user id; email, role, firstName, lastName, company?, phone?, instagramHandle? (optional fields validated in `src/lib/validation/profileFields.ts`), and the delivery address addressLine1?, addressLine2?, city?, province?, postalCode? (required at checkout; also editable in Settings)
- **Order.userId** (nullable) — guest orders stay valid; past guest orders are linked by email **only after Supabase has verified that email** (`linkGuestOrders`).
- **Proof** — orderId, version (unique per order, never overwritten), storagePath, originalFilename, mimeType, sizeBytes, status (pending/approved/rejected; "superseded" is computed), customerComment, decidedAt, decidedBy, decisionSource (customer / staff_on_behalf), uploadedBy.
- **SupportConversation** — userId, category, orderId?, status (open/resolved), lastMessageAt, resolvedAt. **SupportMessage** — sender (customer/staff), senderUserId, body (plain text ≤ 5,000), attachmentPath?, readAt.
- **RateLimit** — fixed-window counters for our own actions (`src/lib/rateLimit.ts`).

## Security rules (keep these when adding features)

- **Every public-schema table has RLS enabled with no policies** (deny-all), and `anon`/`authenticated` privileges revoked. Every new table's migration must do the same (`ENABLE ROW LEVEL SECURITY` + `REVOKE ALL … FROM anon, authenticated`).
- **Authorise in server code.** Every server action and route handler checks the session itself (`requireStaff()` / `requireVerifiedUser()`); layouts don't protect actions. Take the user id from the verified session (`getUser()` via `getSessionUser()`), never from the browser, and scope every customer query by it (see `src/lib/customerOrders.ts`, `proofs.ts`, `support.ts`). Someone else's order/proof/conversation/file = 404.
- **Validate everything server-side** with zod: auth forms, settings, cart lines (`cartItemInputSchema` — also re-checked on every cart read), checkout fields, support messages, proof comments.
- **Files:** private buckets only; validate by magic bytes (`src/lib/fileSniff.ts`), random storage names, serve only through routes that check access then redirect to a 5-minute signed URL. Artwork URLs must be in our Cloudinary folder (`isOwnArtworkUrl`).
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` is server-only (`src/lib/storage.ts` imports `server-only`); never `NEXT_PUBLIC_`.
- **No open redirects:** any `next` from a URL or form goes through `safeRedirectPath`.
- **Plain text only:** never `dangerouslySetInnerHTML`; messages render escaped with `whitespace-pre-wrap`.
- **Auth responses are generic** (login, signup, forgot password, email change) — never reveal whether an email is registered.
- Security headers: CSP with a per-request nonce in `src/proxy.ts` (allows Cloudinary, Supabase, PayFast form posts); static headers in `next.config.ts`.

## Email / notifications

No transactional email yet. Events (proof ready/approved/rejected, support messages) call `notify()` in `src/lib/notifications.ts` — plug an email provider in there.

## Migrations

- Apply with `npx prisma migrate deploy` (not `migrate dev`): migrations add triggers on Supabase's `auth.users` and create Storage buckets, which a plain shadow database doesn't have. Always show migrations to the owner before applying to the live database.
- Supabase's pooler can make Prisma's migration engine time out (`P1001`) — add `connect_timeout=60` to the URL and retry.
- Adding a value to an enum goes in its own migration (Postgres can't use a new enum value in the same transaction).

## Testing

- `npm run typecheck`, `npm run lint`.
- End-to-end: Playwright in `tests/e2e`, run against a **separate test Supabase project** configured in `.env.test` (`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY`, `TEST_DATABASE_URL`, optional `TEST_EMAIL_DOMAIN`). The tests refuse to run if `.env.test` matches the live project in `.env`.
  - `npm run test:e2e:db` — migrate + seed the test database (rerun after new migrations)
  - `npm run test:e2e` — starts the app on port 3100 (build folder `.next-test`) and runs the tests
