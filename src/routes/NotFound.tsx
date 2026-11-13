import { Link } from "react-router-dom";
import { event } from "../config/event";
import SEO from "../components/SEO";
import SceneStage from "../components/SceneStage";

/**
 * Unknown slug — still a graceful, on-theme generic invitation rather than a dead end.
 * Shows the event with a gentle note and a link home.
 */
export default function NotFound() {
  return (
    <>
      <SEO title={`${event.name} — You're Invited`} description={`You're invited to ${event.name}.`} />
      <SceneStage guest={null} event={event} />
      <div
        style={{
          position: "fixed",
          bottom: "max(16px, env(safe-area-inset-bottom))",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 50,
          color: "var(--text-muted)",
          fontSize: "var(--fs-xs)",
        }}
      >
        This invitation link wasn't recognised — enjoy the generic view, or{" "}
        <Link to="/" style={{ color: "var(--color-gold)" }}>
          start over
        </Link>
        .
      </div>
    </>
  );
}
