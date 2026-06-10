## Design Guidelines — WareFlow

### Design philosophy
Built for the warehouse floor, not the back office. Fast to scan during a shift, easy to act on, large touch targets for gloved hands and tablets on the dock. Calm, credible, competent. Information density serves speed of action — surface location and status first, decoration never.

### Color
- **Primary / action**: a strong industrial blue (e.g. #1E5BBF) — used for primary buttons, active states, key links. Conveys trust and operational calm.
- **Surface / neutrals**: clean off-white background (#F7F8FA), white cards, slate-gray text (#1F2733 headings, #5A6473 secondary). High contrast for readability on the floor.
- **Status semantics** (critical — status drives the whole flow):
  - Pending / awaiting action: amber (#D97706)
  - In progress / checked-in / assigned: blue (#1E5BBF)
  - Done / dispatched / shelved: green (#16A34A)
  - Problem / misplaced / blocked: red (#DC2626)
- Use status color as a clear chip/badge, not full-bleed backgrounds, so screens stay calm.

### Typography
- System sans-serif stack (Inter / system-ui) for crisp legibility.
- Clear hierarchy: bold scannable headings, generous size for primary data (location codes, SKU, quantity). Location codes (zone/aisle/bin) shown in a slightly mono/tabular treatment so they read precisely and align in tables.
- Avoid small dense paragraphs; favor labeled key-value pairs and tables.

### Layout & components
- App shell with a persistent left nav for the three capabilities: Inbound, Storage, Outbound, plus a Dashboard overview.
- Card and table based. Tables for lists (shipments, items, orders) with status chips; cards for detail and quick actions.
- Prominent primary actions per screen ("Check in", "Assign location", "Pick", "Confirm dispatch").
- Search-first on Storage: a big lookup bar to instantly find any item's current location.
- Generous spacing, comfortable tap targets (min 44px), clear empty states that prompt the next action.

### Motion & elevation
- Subtle elevation on cards (soft shadow), restrained transitions. No flashy animation — speed and clarity over flair.

### Tone in UI copy
- Plain, operational, imperative. "Check in shipment", "Assign to bin", "Confirm dispatch". No jargon, no fluff.