# Sticker Quest — Design

This is a starting direction, not final branding. Swap the palette once the logo is locked — everything below is built to be easy to update in the Tailwind config without restructuring the design.

## Configurator redesign (current direction)

The configurator was redesigned in Figma ("Sticker Quest 1.0", desktop frame `1:2`, vinyl page) and that design is the look and layout going forward. Where it conflicts with the sections below (palette, type, Waypoint Line/Mascot on the configurator), **the Figma wins**; the older sections still describe pages not yet migrated (home, cart, checkout, admin).

- **Shell:** dark `night` page, full-width nav (logo, pill search "Select sticker type...", cart with count badge), gradient header banner, dark footer.
- **Layout:** four white cards in a row — 1 Shape & Cut, 2 Material, 3 Size, 4 Quantity (with the total box at its foot) — then a full-width 5 Upload card. Numbered step badges replace the Waypoint Line on this page.
- **Selected state:** an idle tile is `mist` grey; a chosen tile fills with its step's accent (Shape & Quantity `blaze`, Material `grape`, Size `zap`).
- **Type:** Urbanist only — Black (900) for labels, prices and headings, Regular for hints. Prices are no longer set in mono.

| Token | Hex | Use |
|---|---|---|
| `night` | `#16122a` | Page, nav and footer background |
| `blaze` | `#f05932` | Primary accent, CTA, selected shape/quantity |
| `grape` | `#685ea8` | Selected material, per-unit price pill |
| `zap` | `#d6de23` | Selected size, savings badges (`zap-ink` `#7a7200` for badge text) |
| `ink` / `quiet` | `#201f20` / `#7a7879` | Text / secondary text |
| `mist` | `#eceaf0` | Idle tiles and inset panels |

Tokens live in `globals.css` next to the original palette. Don't claim things in the UI that the business doesn't offer yet (store credit, satisfaction guarantee, testimonials) — the Figma mock contains them, the build deliberately doesn't.

## Signature element: the Waypoint Line + the Mascot

Two devices, working together, reused everywhere so customers learn them once and recognize them everywhere.

### The Waypoint Line

A horizontal line with a dot for each step.

- **In the configurator:** Type → Cut → Shape → Finish → Size → Quantity, dots filling in as the customer completes each choice, live price ticking up at the end.
- **In order tracking:** the same line, now showing Awaiting Proof → Approved → Printing → Shipped, current stage highlighted.

### The Mascot

A small character whose body is a sticker: a rounded rectangle or circle shape with one peeling corner lifted off its backing, simple friendly face.

This is deliberately **not** an animal or alien — it's a character built from the actual product, which is harder to mistake for anyone else's and stays distinctive even as the rest of the visual system evolves. (Avoids reading as a copy of Sticker Shuttle's alien or Sticker Mule's mule.)

### How they work together

The mascot stands at or walks along the current position on the Waypoint Line — guiding the customer through the configurator, and later showing up at the current stage of their order tracking. It can also appear in empty states (empty cart, no orders yet) and near the upload prompt, holding/pointing at the drop zone.

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

## Admin Dashboard UI Inspiration

Structural patterns worth adopting for `/admin`, sourced from a reference admin order-management dashboard screenshot — the *structure* is worth copying, not the reference's own branding or colors. Everything below still runs on Sticker Quest's existing palette (Paper / Ink Navy / Coral Signal / Waypoint Gold / Trail Teal) and type system (Clash Display for the odd headline, General Sans for UI text, mono for anything numeric) — no new colors, no new typefaces.

### Quick Stats row

A row of small cards at the top of `/admin/orders`, one glance at shop health before scrolling to the table:

- Total Orders, Awaiting Proof, Approved, Printing, Shipped Today, Revenue Today, Average Order Value.
- Each card: a small icon in a muted Ink Navy circle, the number in mono (same "precise readout" logic as configurator pricing), the label in small uppercase Ink Navy/50.
- A trend indicator only where a day-over-day comparison is actually meaningful — Shipped Today and Revenue Today compare against yesterday; the pipeline-stage counts (Awaiting Proof, Approved, Printing) don't get one, since "up" or "down" doesn't mean good or bad for a queue depth.
- Trend up = Trail Teal (the success color already reserved for this). Trend down = muted Ink Navy, not Coral Signal — Coral is the CTA/urgent color elsewhere in the system, and using it for "orders dipped" would read as more alarming than an internal stats card should.

### Status pills

Order status renders as a colored pill in the orders table, not plain text — reusing the same four-stage vocabulary as the Waypoint Line rather than inventing a new color per status:

| Status | Pill |
|---|---|
| Awaiting Proof | Waypoint Gold (muted) |
| Approved | Trail Teal (muted) |
| Printing | Coral Signal (muted) |
| Shipped | Ink Navy (solid) |

Shipped gets the solid treatment — it's the terminal state, and standing out as "done" is the point.

### Filter pills

`All / Awaiting Proof / Approved / Printing / Shipped` as pill buttons above the table, not a `<select>` — staff narrow the view in one click. Active pill: solid Coral Signal. Inactive: outlined Ink Navy/15. Same pill shape as the status badges, just larger and interactive.

### Customer identity in the table

Each row's customer cell stacks an avatar placeholder (initials in an Ink Navy/10 circle), the name, and the email — not just a bare name — so staff can recognize a repeat customer without opening the order.

### Pagination

Once the table grows past one screen: "Showing 1–20 of 134 orders" plus Prev/Next, numerals in mono. No page-number list — staff work through orders roughly in order, not by jumping to page 7.

### Sidebar navigation (once admin grows beyond Orders)

Today's top nav (`Sticker Quest Admin — Orders — Log out`) is fine for a single section. Once more admin surfaces exist (pricing rules, staff accounts, discount tiers), switch to a left sidebar with labeled groups — e.g. a `COMMERCE` group holding Orders, Pricing Rules, Discount Tiers — small uppercase Ink Navy/40 tracking-wide group labels, current page highlighted with a Coral Signal left border and a light Ink Navy/5 background. Not worth building until there's a second group to justify it.

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
