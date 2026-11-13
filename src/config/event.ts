import type { EventConfig } from "./types";

/**
 * EVENT DETAILS — single source of truth.
 * Replace the [PLACEHOLDER] values with the real ones, then `git push` (Vercel redeploys).
 * The file is UTF-8; keep the Sinhala text as-is.
 */
export const event: EventConfig = {
  name: "හීන ඉගිලෙන රෑ",
  themeLabel: "Dreamy Night",
  dateTime: "[DATE — e.g. 20 December 2025, 7:00 PM]",
  venue: "[VENUE — e.g. Main Auditorium, Faculty of Computing, USJ]",
  taglines: ["same sky, same dreams, one night"],
};

/** Host line shown on the letter. */
export const host = "Faculty of Computing · University of Sri Jayewardenepura";

/** True when a field still holds an unfilled "[PLACEHOLDER …]" example value. */
export const isPlaceholder = (value: string): boolean => /^\s*\[/.test(value);

/**
 * Loud dev warning if the real date/venue haven't been set yet (we must never invent them).
 * The letter falls back to "To be announced" on screen so guests never see the raw example.
 */
const DEV = typeof import.meta !== "undefined" && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
if (DEV) {
  const missing = (["dateTime", "venue"] as const).filter((k) => isPlaceholder(event[k]));
  if (missing.length) {
    console.warn(
      `[event config] Still using placeholder values for: ${missing.join(", ")}. ` +
        `Edit src/config/event.ts with the real event details before launch.`,
    );
  }
}
