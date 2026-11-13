import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { Guest, EventConfig } from "../config/types";
import { host, isPlaceholder } from "../config/event";
import BrandLogo from "../components/BrandLogo";
import { useScenePhase, useController } from "./sceneContext";

/** Never show a raw placeholder to a guest. */
const show = (value: string): string => (isPlaceholder(value) ? "To be announced" : value);

interface Props {
  guest: Guest | null;
  event: EventConfig;
}

/** The invitation paper revealed from the envelope and presented as a keepsake card. */
export default function InvitationLetter({ guest, event }: Props) {
  const phase = useScenePhase();
  const controller = useController();
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = controller.reducedMotion;
    gsap.killTweensOf(el);

    if (phase === "opening") {
      if (reduced) {
        gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
      } else {
        // The parchment appears only after the card has cleared the envelope mouth.
        gsap.fromTo(
          el,
          { opacity: 0, yPercent: 18, scale: 0.58, rotationX: 7, transformOrigin: "50% 62%" },
          {
            opacity: 1,
            yPercent: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.9,
            ease: "power3.out",
            delay: 1.98,
          },
        );
      }
    } else {
      gsap.set(el, { opacity: 1, yPercent: 0, scale: 1, rotationX: 0 });
    }
  }, [phase, controller]);

  useEffect(() => {
    if (phase === "opened") ref.current?.focus({ preventScroll: true });
  }, [phase]);

  return (
    <article ref={ref} className="letter" tabIndex={-1} aria-label="Your invitation">
      <span className="letter__corner letter__corner--tl" aria-hidden="true" />
      <span className="letter__corner letter__corner--tr" aria-hidden="true" />
      <span className="letter__corner letter__corner--bl" aria-hidden="true" />
      <span className="letter__corner letter__corner--br" aria-hidden="true" />

      <header className="letter__header">
        <span className="letter__moon" aria-hidden="true" />
        <span className="letter__eyebrow">A keepsake invitation</span>
        <BrandLogo variant="letterhead" className="letter__logo" />
        <h1 className="letter__event sinhala sr-only" lang="si">
          {event.name}
        </h1>
        <span className="letter__ornament" aria-hidden="true">
          <span />
          <i>✦</i>
          <span />
        </span>
        <p className="letter__kicker">You are cordially invited</p>
      </header>

      <section className="letter__salutation" aria-label="Invitation recipient">
        {guest ? (
          <>
            <p className="letter__greeting">With warm regards to</p>
            <h2 className="letter__name">{guest.name}</h2>
            {guest.title && <p className="letter__title">{guest.title}</p>}
          </>
        ) : (
          <h2 className="letter__name letter__name--generic">An evening to remember</h2>
        )}
      </section>

      <p className="letter__message">
        We would be honoured by your presence as we gather beneath one sky to celebrate a night
        filled with memories, dreams and new beginnings.
      </p>

      <div className="letter__divider" aria-hidden="true">
        <span />
        <i>❧</i>
        <span />
      </div>

      <dl className="letter__information" aria-label="Event details">
        <div className="letter__detail">
          <span className="letter__detail-icon" aria-hidden="true">◷</span>
          <div>
            <dt>When</dt>
            <dd>{show(event.dateTime)}</dd>
          </div>
        </div>
        <div className="letter__detail">
          <span className="letter__detail-icon" aria-hidden="true">⌖</span>
          <div>
            <dt>Where</dt>
            <dd>{show(event.venue)}</dd>
          </div>
        </div>
      </dl>

      {event.taglines[0] && <p className="letter__tagline">“{event.taglines[0]}”</p>}

      <footer className="letter__footer">
        <span className="letter__footer-rule" />
        <p className="letter__closing">We look forward to welcoming you</p>
        <p className="letter__host">{host}</p>
      </footer>
    </article>
  );
}
