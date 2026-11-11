# Sticker Quest — Design

This is a starting direction, not final branding. Swap the palette once the logo is locked — everything below is built to be easy to update in the Tailwind config without restructuring the design.

## Configurator redesign (current direction)

The configurator was redesigned in Figma ("Sticker Quest 1.0" — https://www.figma.com/design/mygkYHOSgoPwBo98GkIg1c/Sticker-Quest-1.0 — desktop frame `1:2`, vinyl page) and that design is the look and layout going forward. Where it conflicts with the sections below (palette, type, Waypoint Line/Mascot on the configurator), **the Figma wins**; the older sections still describe pages not yet migrated (cart, checkout); the admin has its own light look, described under "Admin (staff back office)". The type picker ("Pick your sticker type", now at `/stickers`) uses the configurator's shell, banner and cards. The home page follows the "Sticker Quest Home page" frame in the same file: gradient banner, "Ideal for:" ticker, product cards, reviews, how-it-works steps and a "Made in Cape Town" map — it replaces the "Layout concept — homepage" sketch below. `/signup` follows the "Sticker Quest sign up" frame: a `plum` welcome panel (headline, wizard, perks) beside a dark form (`well` inputs, zap "Create account" button); the copy was rewritten rather than taken from the mock. `/login` follows the "Sticker Quest login" frame: the same heading, dark fields and zap button in a single 688px column. `/forgot-password` follows the "Sticker Quest forgot password" frame (same column, goblin sticker beside the heading, hidden on phones). These pages share `NightAuthPage`, as does `/reset-password` (knight helmet beside the heading; an expired link gets its own "Link expired." state). After a reset link is sent, forgot password switches to "Check your email." `/cart` follows the "Sticker Quest cart — populated" and "— empty" frames: one sand card per line (artwork, a grape Averia heading, then every choice the configurator asked for that type — `itemChoices` in `src/lib/itemChoices.ts`, the mock only shows four — a quantity dropdown, the line total with a trash button and the quantity saving as "N% off" in `orchid`), and a sticky sidebar with a Discount card (placeholder until discount codes exist) and the Order Summary (design names from the artwork filenames, flat Courier Guy shipping, total, logged-in/guest status). The empty cart is a centred hero (cart icon, "Your cart is empty.", zap "Get custom stickers") above the home page's product cards (`ProductCardGrid`). There is no separate checkout page: the cart's Checkout button opens a sand popup (`<dialog>`) to log in or complete delivery details, then places the order. The order confirmation (`/checkout/success`) uses the empty cart's hero (zap check, "Your quest has begun"), "What happens next." steps with the home page's step badges (`STEP_BADGES`), and the order in a sand summary card.

- **Shell:** dark `night` page, full-width nav (logo, pill search "Select sticker type...", account actions, cart with count badge), gradient header banner, dark footer. Account actions: logged out shows a glass "Login" pill and a brand-gradient "Sign up" pill; logged in (frame "Logged-in navigation alternative") shows a round glass messages button and a glass "Profile" pill with the wizard avatar, which opens the account menu.
- **Layout:** four dark `dusk` cards in a row (frame `240:128`, "site-matched alternative") — 1 Shape & Cut, 2 Material, 3 Size, 4 Quantity (with the `night` total pill at its foot, total in `zap`) — then a full-width 5 Upload card with a `well` drop zone. Numbered `grape` step badges replace the Waypoint Line on this page. These use `StepCard tone="dusk"`; account pages keep the default sand tone.
- **Selected state:** an idle tile is `dusk-tile` with `sand` text and `dusk-hint` hints; a chosen tile is solid `zap` with `night` text, on every step.
- **Type:** Inter — Black (900) for labels, prices and headings, Regular for hints. Prices are no longer set in mono. On the home page the big headlines (hero and section titles) are **Averia Libre Bold** (`font-headline font-bold`).

| Token | Hex | Use |
|---|---|---|
| `night` | `#16122a` | Page, nav and footer background |
| `blaze` | `#f05932` | Primary accent, CTA, selected shape/quantity |
| `grape` | `#685ea8` | Selected material, per-unit price pill |
| `zap` | `#d6de23` | Selected size, savings badges (`zap-ink` `#7a7200` for badge text) |
| `ink` / `quiet` | `#201f20` / `#7a7879` | Text / secondary text |
| `mist` | `#eceaf0` | Idle tiles and inset panels |
| `dusk` / `dusk-line` | `#2b2542` / `#383053` | Dark card fill / border on the night page (home product cards) |

Tokens live in `globals.css` next to the original palette. Don't claim things in the UI that the business doesn't offer yet (store credit, satisfaction guarantee) — the Figma mock contains them, the build deliberately doesn't. The "Our Quest For Quality." reviews section is built, but its cards are placeholder copy from the mock (`src/lib/reviews.ts`) until real reviews can be added from the backend.

## Signature element: the Waypoint Line + the Mascot

Two devices, working together, reused everywhere so customers learn them once and recognize them everywhere.

### The Waypoint Line

A horizontal line with a dot for each step.

- **In the configurator:** Type → Cut → Shape → Finish → Size → Quantity, dots filling in as the customer completes each choice, live price ticking up at the end.
- **In order tracking:** the same line, now showing Awaiting Proof → Approved → Printing → Shipped, current stage highlighted.

### The characters (replaces the old mascot)

The cast is the **wizard, dragon, goblin and knight**, drawn as die cut stickers (`public/mascot/`, rendered through `src/components/Character.tsx`). The old orange sticker-body mascot with the peeling corner is **retired — don't use it anywhere**.

### How they work together

A character (the wizard) stands at the current stage of the Waypoint Line in order tracking. Empty states (no orders, no proofs, etc.) are copy only — a heading, a line of text and an action, no image.

**This combination is the one place to spend visual boldness. Everything else stays quiet and disciplined around it.**

### What to avoid

- Literal treasure-map/pirate/parchment imagery — too costume-y, undercuts "tech-powered."
- No torn-paper sticker collages.
- No CMYK-dot print clichés.
- No alien/space-explorer mascot — reads as a direct lift from Sticker Shuttle.

## Color (placeholder — swap post-logo)

| Name | Hex | Use |
|---|---|---|
| Paper | `#FAFAF8` | Background |
| Ink Navy | `#14213D` | Primary text, dark UI elements |
| Coral Signal | `#FF5A3C` | Primary CTA, active waypoint dots |
| Waypoint Gold | `#FFB627` | Completed waypoint dots, highlights, badges |
| Trail Teal | `#2EC4B6` | Success states, secondary actions |

Coral Signal is deliberately more saturated/red than a muted terracotta — avoid drifting toward a dusty clay tone, which reads as a generic AI-design default.

## Type

- **Display** (headlines, big moments): **Clash Display** — bold, geometric, a little playful. Used sparingly, not on every heading.
- **Body/UI:** **General Sans** — clean and accessible, does the actual work of the interface.
- **Utility/numeric:** **Space Mono** or **JetBrains Mono** — used specifically for prices, quantities, order IDs, and tracking numbers. This is a deliberate choice, not decoration: a monospace "readout" feel reinforces the transparent-pricing value — numbers should feel precise and tech-driven, not folded into regular body text.

## Patterns worth adopting (structure, not skin)

A few things Sticker Shuttle does well that are genuinely good UX, independent of their dark/alien visual identity — worth building the same way, in our own palette:

- Configurator as labeled sequential cards (e.g. Shape & Cut, Material, Size, Quantity), each with icon-based choices instead of text dropdowns — shapes shown as shapes, materials shown as texture icons.
- Quantity tiers with visible "Save X%" badges — transparent bulk pricing, directly reinforces the brand's transparent-pricing value.
- Upload as its own prominent card, with format/size guidance shown inline, not buried in a generic form field.
- Category page as a scannable list — icon + name + one-line description per sticker type, not a heavy image grid. Works well for a catalogue with several types plus sheets.
- A simple process strip (Upload → Proof → Ship → Receive), adapted to Sticker Quest's actual steps.

## Layout concept — homepage

```
[ Nav: logo — Shop — Track Order — Login ]

[ HERO: not a banner — the configurator itself, front and center.
  Small eyebrow line: "Start your quest"
  Waypoint line begins immediately below, step 1 active. ]

[ Below the fold: trust signals — turnaround time,
  material quality, who it's for (SMEs, vendors, musicians, artists)
  — short, not a wall of copy ]

[ Footer: courier/delivery promise, contact, socials ]
```

The homepage's only job is getting people into the configurator fast. Resist the urge to add a traditional marketing hero above it.

## Admin (staff back office)

The admin is a light work tool, not part of the shop's night look: staff spend long stretches in it, so it favours calm and legibility. It shares one set of building blocks in `src/components/admin/ui.tsx` — use those rather than restyling per page.

- **Shell:** the shop's header and footer are hidden on `/admin` (`HideOnAdmin` in the root layout). A `night` sidebar holds the logo with an "Admin" tag, the sections (Orders with the awaiting-proof count, Support with the unread count, as lime `zap` badges), "View shop", and the signed-in staff member with Log out. On phones it becomes a top bar. The workspace beside it is `admin-canvas` with white cards (`CARD_CLASSES`).
- **Colour:** `admin-ink` / `admin-muted` / `admin-faint` text on white, `admin-line` borders. `grape` is the one action colour (primary buttons, links, active tab, unread marker); `coral-signal` only for errors, `trail-teal` for success.
- **Type:** Inter throughout; numbers use `tabular-nums`. Mono only for order numbers, IDs and tracking numbers.
- **Status:** a coloured dot in a quiet white pill — Awaiting Proof `waypoint-gold`, Awaiting Approval `blaze`, Approved `grape`, Printing `trail-teal`, Shipped `leaf`. The orders table's inline status `<select>` looks the same.
- **Orders list:** four stat cards (Revenue today and Shipped today with a vs-yesterday trend, teal when up and grey when down; Average order; Open support, linking to the inbox), then one card holding underlined status tabs with counts, a table with **one row per order** (order number and date, customer with initials, stacked artwork thumbnails with the first item's type and spec, total quantity, total, status select) and "Showing 1–20 of N" pagination.
- **Order page:** two columns. Main: the items (artwork, spec, quantity × unit price, an Artwork download button) with the items/shipping/total breakdown, then Proofs (upload box, then versions newest first). Side: Fulfilment (status and tracking), Customer, any customer notes.
- **Artwork thumbnails** sit on a transparency checkerboard (`ArtworkThumb checker`) so white artwork stays visible when preflighting.
- **Discounts** (`/admin/discounts`): a table of codes with status tabs (Active, Scheduled, Ended, Off); a code's page has the edit form beside Usage and Recent orders cards.
- **Blog** (`/admin/blog`): a list of posts with cover thumbnails and status tabs; a post's page is the editor (title, link, summary, cover, a Markdown box with a formatting toolbar and a Preview tab that renders on `night` exactly as the public post) beside a Status card with the review buttons. The public `/blog` uses the shop's night look: Averia headlines, `dusk` cards, the newest post as a wide feature card.
- **Support:** the inbox is a list (unread rows get a grape edge and a "New" tag); a conversation is the thread and reply box beside Customer and Linked order cards, with Mark as resolved in the page header.

## Voice, in the interface

- Plain verbs, active voice: "Upload your artwork," not "Artwork submission."
- Buttons say what happens: "Pay & submit for proofing," not "Submit."
- Empty/error states speak in the product's voice, not an apology: if artwork fails to upload, say what happened and what to do next — not "Oops, something went wrong!"
- Tone: friendly and simple, matching the brand personality — never corporate, never try-hard quirky.

## What this brief deliberately avoids

The three most common AI-generated design defaults, none of which fit this brief:

1. Cream background + serif display + terracotta accent
2. Near-black background + single neon accent
3. Broadsheet/newspaper hairline-rule layout
