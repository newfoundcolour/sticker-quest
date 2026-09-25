# Sticker Quest

South African, web-only, tech-powered print shop specialising in custom stickers and labels. No physical location — everything is ordered through an interactive web configurator.

**Brand personality:** fun, friendly, simple, accessible — playful and pioneering in tone.

Visual/design decisions must follow `DESIGN.md` in the project root.

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database + Auth:** Supabase (Postgres)
- **ORM:** Prisma
- **Artwork storage:** Cloudinary (customer-uploaded artwork)
- **Payments:** PayFast — charged upfront at checkout
- **Shipping:** The Courier Guy — manual booking for v1, no API integration yet

## Product configurator

Customers configure a product with these options, and price recalculates live as each is selected:

- **Sticker type:** vinyl, holographic, chrome, glitter, clear, economy, sticker sheets, label sheets
- **Cut type:** kiss or die
- **Shape:** square, circle, rectangle, oval, custom
- **Finish:** matte or gloss
- **Size:** 50, 75, 100 or 125 mm (square presets), or custom in mm rounded to the nearest 0.5 (up to max printer width). Stored and priced in cm.
- **Quantity:** minimum 50, no upper limit

Pricing is driven by a pricing rules table, not hardcoded — exact pricing tables are still being finalized, so avoid baking specific prices into code.

## Order flow

1. Customer configures product and uploads artwork.
2. Customer pays via PayFast at checkout (payment is upfront).
3. Order enters `awaiting_proof` status.
4. Staff manually preflights the artwork offline in Illustrator and sends a proof to the customer via WhatsApp or email.
5. Once the customer approves, staff manually updates the order status.

**Order pipeline (status values):** `awaiting_proof` → `approved` → `printing` → `shipped`

**Delivery promise:** 3–5 working days from proof approval.

## Roles & admin

Two internal roles: **admin** and **staff**. Access is via a login-gated dashboard at `/admin`.
