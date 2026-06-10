# Product Overview — WareFlow

> Single source of truth for the product. Update when product facts change.

## One-liner
A warehouse operations app that gives supervisors a live, known location for every
item — from inbound dock to outbound truck — so fulfillment moves faster and inventory
stops going missing.

## The problem
In a busy warehouse, the costly failure isn't losing inventory outright — it's losing
*time*. When a pallet or carton lands in the wrong slot, the team doesn't lose the item,
they lose minutes hunting for it on every order it touches. Across an operation that
quietly bleeds dozens of labor-hours a week and pushes orders out late. Inbound,
storage, and outbound are tracked in disconnected places (paper, spreadsheets,
memory), so no one has a single trustworthy picture of where things are.

## The solution
One connected spine for the physical flow of goods: **inbound check-in → slot
assignment → pick path → outbound confirm.** Every item carries a known location at
every step, so misplaced inventory becomes something the system won't allow rather than
a recurring fire drill.

## Primary user
Warehouse supervisors / floor leads responsible for keeping fulfillment moving and
inventory accurate. Secondary users: receiving and picking staff who log and act on the
data.

## Core capabilities (MVP scope)
1. **Inbound shipments** — log arriving shipments, record contents, and check items in
   at the dock.
2. **Storage locations** — assign and track the slot/bin/zone where each item lives;
   look up any item's current location instantly.
3. **Outbound orders** — build and track outbound orders, guide picking from known
   locations, and confirm dispatch (blocked until every line is picked).
4. **Operations dashboard** — live operational counts (expected shipments, awaiting
   put-away, items stored, open orders, dispatched today) and an awaiting-put-away
   watchlist that prompts the next action.

Items use human-readable location codes (e.g. `B-04-12`). The app ships with
owner-editable configurables (app name, logo, brand colors, tagline, facility name,
supervisor greeting, storage zones, low-stock threshold) requiring no code changes.

## Goals / outcomes
- **Speed up fulfillment** — shorten the time from order to dispatch by removing search
  time and guesswork.
- **Eliminate misplaced inventory** — every item has a known, current location, so
  nothing is "lost in the building."

## Positioning & tone
Practical, operational, no-nonsense. Built for the warehouse floor, not the back
office: fast to read, easy to act on during a shift. Calm, credible, competent.

## Strategic principles
- The location of every item is sacred — the product's whole value rests on it being
  trustworthy.
- Optimize for speed of action on the floor over feature breadth.
- One connected flow beats three disconnected trackers.

## Status
Pre-build. Name (**WareFlow**) and branding (industrial orange #F97316 on slate/white)
confirmed. MVP scope locked: inbound shipments, storage locations, outbound orders.
Awaiting initial app generation.
