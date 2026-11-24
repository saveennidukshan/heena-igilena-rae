/** A single invited guest. The slug is the URL path segment; name is shown on the letter. */
export interface Guest {
  /** URL path segment, e.g. "DeanPrasad" -> /DeanPrasad. Keep URL-safe (letters, digits, -). */
  slug: string;
  /** Display name shown on the invitation letter. May be Sinhala or Latin text. */
  name: string;
  /** Optional honorific / role, e.g. "Dean, Faculty of Computing". */
  title?: string;
}

/** Event-wide content. Single source of truth for everything the letter/meta show. */
export interface EventConfig {
  /** Event name (Sinhala). Rendered primarily via the gold logo image. */
  name: string;
  /** Optional Latin transliteration / theme label for meta + fallbacks. */
  themeLabel?: string;
  /** Human-readable date & time shown on the invitation. */
  dateTime: string;
  /** Optional exact event instant for the countdown (ISO 8601, including timezone offset). */
  countdownAt?: string;
  /** Venue name / address. */
  venue: string;
  /** Short flourish lines shown on the letter. */
  taglines: string[];
}
