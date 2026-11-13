import type { Guest } from "./types";

/**
 * GUEST LIST — single source of truth (currently MOCK DATA).
 * REPLACE WITH REAL DATA before the real launch, then `git push` (Vercel redeploys),
 * then regenerate QR codes (see MANUAL_SETUP.md). Routes are generated from this array —
 * do not hand-write routes. 12 entries.
 */
export const guests: Guest[] = [
  { slug: "DeanPrasad", name: "Dean Prasad", title: "Dean, Faculty of Computing" },
  { slug: "guest-02", name: "Guest Two" },
  { slug: "guest-03", name: "Guest Three" },
  { slug: "guest-04", name: "Guest Four" },
  { slug: "guest-05", name: "Guest Five" },
  { slug: "guest-06", name: "Guest Six" },
  { slug: "guest-07", name: "Guest Seven" },
  { slug: "guest-08", name: "Guest Eight" },
  { slug: "guest-09", name: "Guest Nine" },
  { slug: "guest-10", name: "Guest Ten" },
  { slug: "guest-11", name: "Guest Eleven" },
  { slug: "guest-12", name: "Guest Twelve" },
];

/** Fast lookup by slug. */
export const guestBySlug = (slug: string): Guest | undefined =>
  guests.find((g) => g.slug.toLowerCase() === slug.toLowerCase());
