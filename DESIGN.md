# Sticker Quest — Design

This is a starting direction, not final branding. Swap the palette once the logo is locked — everything below is built to be easy to update in the Tailwind config without restructuring the design.

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
