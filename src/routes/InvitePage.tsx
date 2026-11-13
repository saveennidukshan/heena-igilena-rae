import { guestBySlug } from "../config/guests";
import { event } from "../config/event";
import SceneStage from "../components/SceneStage";
import SEO from "../components/SEO";

interface Props {
  /** Provided by the generated per-guest routes. Absent on "/" (generic invite). */
  slug?: string;
}

/**
 * Looks up the guest for this route and renders the animated invitation.
 * No slug => generic invitation (no personal name).
 */
export default function InvitePage({ slug }: Props) {
  const guest = slug ? guestBySlug(slug) : undefined;

  const title = guest
    ? `${guest.name} — ${event.name}`
    : `${event.name} — You're Invited`;
  const description = guest
    ? `${guest.name}, you're invited to ${event.name} (${event.themeLabel}).`
    : `You're invited to ${event.name}.`;

  return (
    <>
      <SEO title={title} description={description} />
      <SceneStage guest={guest ?? null} event={event} />
    </>
  );
}
