import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import type { Guest, EventConfig } from "../config/types";
import { useScenePhase, useController, atOrAfter } from "./sceneContext";
import WaxSeal from "./WaxSeal";
import InvitationLetter from "./InvitationLetter";
import "../styles/envelope.css";

interface Props {
  guest: Guest | null;
  event: EventConfig;
}

/** How many lanterns float up out of the envelope mouth as it opens. */
const BURST_COUNT = 6;

/**
 * Scene 4–6 (Agent "Envelope"). The envelope rises into the starry sky ("envelope"),
 * carries the wax seal while it idles ("seal"), then on tap plays ONE physical open:
 *   1. the wax seal fractures into irregular chips which fall under gravity (in WaxSeal);
 *   2. after the wax breaks, the top flap hinges open on its top edge (rotateX → 180°) and drops
 *      behind the card, showing its darker inside face;
 *   3. the card slides UP out of the opaque front pocket (envelope-width while inside);
 *   4. once the card clears the mouth the envelope sinks + fades while the readable letter
 *      grows toward the camera ABOVE everything (InvitationLetter) — so no envelope
 *      geometry is ever seen through the card, and the card is never bigger than the
 *      envelope while it is still inside it.
 *
 * Everything is driven by the controller phase — a direct Skip to "seal" lands the envelope
 * centred and sealed with no rise.
 */
export default function EnvelopeScene({ guest, event }: Props) {
  const phase = useScenePhase();
  const controller = useController();

  const envRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  /** true once the envelope is at its resting centre (via rise or a snap on Skip). */
  const atRest = useRef(false);
  /** true once the open sequence has played. */
  const opened = useRef(false);

  const present = atOrAfter(phase, "envelope");
  const opening = atOrAfter(phase, "opening");
  const showSeal = phase === "seal" || phase === "opening";
  const showLetter = opening;
  const showBurst = opening && !controller.reducedMotion;

  useLayoutEffect(() => {
    if (!atOrAfter(phase, "envelope")) {
      // left the envelope sequence (Replay): arm a fresh run next time
      atRest.current = false;
      opened.current = false;
      return;
    }

    const env = envRef.current;
    const flap = flapRef.current;
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!env || !flap || !card || !glow) return;
    const reduced = controller.reducedMotion;
    gsap.killTweensOf([env, flap, card, glow]);

    // --- rest state (rise into frame once, or snap on a Skip jump) -----------
    if (phase === "envelope" && !atRest.current) {
      atRest.current = true;
      gsap.set(flap, { rotateX: 0, zIndex: 4 });
      gsap.set(card, { yPercent: 0 });
      if (reduced) {
        gsap.fromTo(env, { yPercent: 16, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" });
        gsap.to(glow, { opacity: 1, duration: 0.7, ease: "power2.out" });
      } else {
        gsap.fromTo(env, { yPercent: 135, autoAlpha: 1 }, { yPercent: 0, duration: 1.5, ease: "back.out(1.04)" });
        gsap.fromTo(glow, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out", delay: 0.4 });
      }
    } else if (atOrAfter(phase, "seal") && !atRest.current) {
      atRest.current = true;
      gsap.set(env, { yPercent: 0, autoAlpha: 1 });
      gsap.set(flap, { rotateX: 0, zIndex: 4 });
      gsap.set(card, { yPercent: 0 });
      gsap.set(glow, { opacity: 1, scale: 1 });
    }

    // --- the open sequence (once) -------------------------------------------
    if (opening && !opened.current) {
      opened.current = true;
      gsap.set(env, { yPercent: 0, autoAlpha: 1 });

      if (reduced) {
        // ~300ms crossfade: flap + seal fade (WaxSeal handles the seal), card shown, env goes
        gsap.to(flap, { autoAlpha: 0, duration: 0.3, ease: "power1.out" });
        gsap.to(env, { autoAlpha: 0, duration: 0.4, ease: "power1.out", delay: 0.3 });
        return;
      }

      const tl = gsap.timeline();
      // 2 — let the seal fracture and shed its wax first; then the flap unsticks and
      //     hinges open on its top edge, revealing the dark inner lining.
      tl.to(flap, { rotateX: 7, duration: 0.18, ease: "power1.out" }, 0.62);
      tl.to(flap, { rotateX: -180, duration: 0.8, ease: "power3.inOut" }, 0.8);
      tl.set(flap, { zIndex: 1 }, 1.24);
      // 3 — warm lantern light blooms from the opening as it parts
      tl.to(glow, { opacity: 1, scale: 1.14, duration: 0.5, ease: "power2.out" }, 0.92);
      // 4 — the card rises up out of the opaque pocket with a soft settle
      tl.fromTo(card, { yPercent: 0 }, { yPercent: -124, duration: 0.92, ease: "power2.out" }, 1.32);
      // 5 — handoff: the envelope sinks + fades as the readable letter grows in above it
      tl.to(env, { yPercent: 48, autoAlpha: 0, duration: 0.86, ease: "power2.in" }, 2.08);
      tl.to(glow, { opacity: 0, scale: 1, duration: 0.86, ease: "power1.in" }, 2.08);
    } else if (phase === "opened") {
      // guaranteed settled state (also covers a jump straight to opened)
      opened.current = true;
      gsap.set(env, { autoAlpha: 0 });
      gsap.set(glow, { opacity: 0 });
    }
  }, [phase, opening, controller]);

  // --- lantern burst out of the envelope mouth (one-shot, on open) ----------
  useLayoutEffect(() => {
    const root = burstRef.current;
    if (!root || !showBurst) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".lantern-burst__rise"));
    const sways = Array.from(root.querySelectorAll<HTMLElement>(".lantern-burst__sway"));
    const tweens: gsap.core.Tween[] = [];

    items.forEach((rise, i) => {
      const spread = (i / (BURST_COUNT - 1) - 0.5) * 140;
      const drift = spread * 1.4 + (Math.random() * 40 - 20);
      const climb = -(window.innerHeight * 0.62 + Math.random() * 120);
      const dur = 3.4 + Math.random() * 1.6;
      const delay = 1.1 + i * 0.13;

      tweens.push(
        gsap.fromTo(
          rise,
          { x: spread * 0.3, y: 30, scale: 0.25, opacity: 0 },
          { y: climb, x: spread + drift, scale: 0.9 + Math.random() * 0.25, opacity: 1, duration: dur, ease: "power1.out", delay },
        ),
      );
      tweens.push(gsap.to(rise, { opacity: 0, duration: 1.2, ease: "power1.in", delay: delay + dur - 1.2 }));
      tweens.push(gsap.to(sways[i], { x: i % 2 ? 18 : -18, duration: 1.3 + Math.random() * 0.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay }));
    });

    return () => tweens.forEach((t) => t.kill());
  }, [showBurst]);

  if (!present) {
    return <div className="envelope-scene" data-phase={phase} style={SCENE_STYLE} aria-hidden="true" />;
  }

  return (
    <div className="envelope-scene" data-phase={phase} style={SCENE_STYLE}>
      <div className="envelope-stage">
        <div ref={glowRef} className="envelope__glow" aria-hidden="true" />

        {/* the envelope unit */}
        <div ref={envRef} className="env" aria-hidden="true">
          {/* back panel (opaque) */}
          <svg className="env__part env__back" viewBox="0 0 350 250" preserveAspectRatio="none">
            <defs>
              <linearGradient id="env-body" x1="0.1" y1="0" x2="0.55" y2="1">
                <stop offset="0" stopColor="#332d5b" />
                <stop offset="0.46" stopColor="#211d43" />
                <stop offset="1" stopColor="#11152f" />
              </linearGradient>
              {/* a metallic gold-foil sweep reused for every gold edge */}
              <linearGradient id="env-foil-a" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8172ad" />
                <stop offset="0.36" stopColor="#d8c9f6" />
                <stop offset="0.52" stopColor="#f5f0ff" />
                <stop offset="0.7" stopColor="#bca9e6" />
                <stop offset="1" stopColor="#7969a6" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="346" height="246" rx="16" fill="url(#env-body)" stroke="url(#env-foil-a)" strokeWidth="2.5" />
            <rect x="6.5" y="6.5" width="337" height="237" rx="12" fill="none" stroke="#ddd3f5" strokeOpacity="0.24" strokeWidth="1" />
            <rect x="13" y="13" width="324" height="224" rx="9" fill="none" stroke="#ddd3f5" strokeOpacity="0.11" strokeWidth="0.8" />
            <path d="M26 24 H74 M276 24 H324 M26 226 H74 M276 226 H324" stroke="#ddd3f5" strokeOpacity="0.42" strokeWidth="1" />
            <path d="M175 17 l4 5 -4 5 -4 -5z M175 223 l4 5 -4 5 -4 -5z" fill="#d9c7f7" opacity="0.72" />
          </svg>

          {/* the sliding card, clipped to the envelope interior (open at the top) */}
          <div className="env__clip">
            <div ref={cardRef} className="env__card" />
          </div>

          {/* front pocket (opaque) — hides the resting card; gold seams for the look */}
          <svg className="env__part env__pocket" viewBox="0 0 350 250" preserveAspectRatio="none">
            <defs>
              <linearGradient id="env-pocket" x1="0.1" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3b356a" />
                <stop offset="0.52" stopColor="#292650" />
                <stop offset="1" stopColor="#151a36" />
              </linearGradient>
              <linearGradient id="env-foil-b" x1="0" y1="0" x2="1" y2="0.5">
                <stop offset="0" stopColor="#7969a6" />
                <stop offset="0.4" stopColor="#d8c9f6" />
                <stop offset="0.55" stopColor="#f5f0ff" />
                <stop offset="0.72" stopColor="#bca9e6" />
                <stop offset="1" stopColor="#8172ad" />
              </linearGradient>
              <radialGradient id="env-pocket-sheen" cx="0.5" cy="1.05" r="0.75">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* The front pocket fills everything BELOW the flap's diagonals (up to the centre
                apex), so the flap and pocket meet flush — no slice of the darker back panel
                shows through on the sides. */}
            <path d="M0 0 L175 133 L350 0 L350 249 L0 249 Z" fill="url(#env-pocket)" />
            <path d="M0 0 L175 133 L350 0 L350 249 L0 249 Z" fill="url(#env-pocket-sheen)" />
            {/* a restrained art-deco flourish pressed into the lower pocket */}
            <g fill="none" stroke="#d9c7f7" strokeOpacity="0.25" strokeWidth="1">
              <path d="M28 178 L64 202 M322 178 L286 202" />
              <path d="M132 218 Q175 189 218 218 M143 228 Q175 207 207 228" />
              <path d="M175 202 l7 7 -7 7 -7 -7z" />
            </g>
            {/* faint lantern-light star-dust on the paper */}
            <g fill="#d9c7f7" opacity="0.16">
              <circle cx="46" cy="196" r="1.1" />
              <circle cx="104" cy="228" r="1.4" />
              <circle cx="250" cy="208" r="1.2" />
              <circle cx="306" cy="184" r="1.3" />
              <circle cx="188" cy="234" r="1" />
              <circle cx="286" cy="236" r="1.1" />
            </g>
            {/* the lower fold V — a soft shadow then a crisp gold seam, meeting the flap at the centre */}
            <path d="M2 248 L175 134 L348 248" fill="none" stroke="#120a22" strokeOpacity="0.32" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M2 248 L175 133 L348 248" fill="none" stroke="url(#env-foil-b)" strokeWidth="2" strokeLinejoin="round" />
          </svg>

          {/* the flap: top-edge hinge with a real back face */}
          <div ref={flapRef} className="env__flap">
            <svg className="env__flap-face env__flap-face--front" viewBox="0 0 350 135" preserveAspectRatio="none">
              <defs>
                <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#494274" />
                  <stop offset="0.55" stopColor="#332e5d" />
                  <stop offset="1" stopColor="#1b1b3d" />
                </linearGradient>
                <linearGradient id="env-foil-c" x1="0" y1="0" x2="1" y2="0.4">
                  <stop offset="0" stopColor="#7969a6" />
                  <stop offset="0.4" stopColor="#d8c9f6" />
                  <stop offset="0.55" stopColor="#f5f0ff" />
                  <stop offset="0.72" stopColor="#bca9e6" />
                  <stop offset="1" stopColor="#8172ad" />
                </linearGradient>
              </defs>
              <path d="M1 1 L349 1 L175 133 Z" fill="url(#env-flap)" stroke="url(#env-foil-c)" strokeWidth="2.5" strokeLinejoin="round" />
              {/* inset gold liner + a hairline highlight along the hinge */}
              <path d="M15 7 L335 7 L175 120 Z" fill="none" stroke="#d9c7f7" strokeOpacity="0.38" strokeWidth="1" strokeLinejoin="round" />
              <path d="M2 2.5 L348 2.5" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" />
              <path d="M175 19 l8 8 -8 8 -8 -8z" fill="none" stroke="#d8c9f6" strokeOpacity="0.55" strokeWidth="1" />
              <circle cx="175" cy="27" r="2" fill="#f6f0ff" fillOpacity="0.72" />
            </svg>
            <svg className="env__flap-face env__flap-face--back" viewBox="0 0 350 135" preserveAspectRatio="none">
              <defs>
                <linearGradient id="env-flap-back" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#17152f" />
                  <stop offset="1" stopColor="#101329" />
                </linearGradient>
              </defs>
              <path d="M1 1 L349 1 L175 133 Z" fill="url(#env-flap-back)" stroke="#d9c7f7" strokeOpacity="0.3" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M16 8 L334 8 L175 116 Z" fill="none" stroke="#d9c7f7" strokeOpacity="0.32" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </div>

          {showSeal && <WaxSeal onTap={() => controller.open()} />}
        </div>

        {/* the readable letter — sits above everything once handed off */}
        {showLetter && (
          <div className="letter-wrap">
            <InvitationLetter guest={guest} event={event} />
          </div>
        )}

        {/* sky lanterns drifting up out of the open envelope */}
        {showBurst && (
          <div ref={burstRef} className="lantern-burst" aria-hidden="true">
            {Array.from({ length: BURST_COUNT }).map((_, i) => (
              <span key={i} className="lantern-burst__rise">
                <span className="lantern-burst__sway">
                  <BurstLantern />
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** A tiny original sky-lantern sprite for the one-shot burst (colours from design tokens). */
function BurstLantern() {
  return (
    <svg className="lantern-burst__svg" viewBox="0 0 40 56" aria-hidden="true">
      <circle cx="20" cy="27" r="17" fill="rgb(217 199 247 / 0.13)" />
      <path d="M20 4 L23.5 21.5 L36 27 L23.5 32.5 L20 50 L16.5 32.5 L4 27 L16.5 21.5 Z" fill="#eee8ff" />
      <path d="M20 15 L22 25 L29 27 L22 29 L20 39 L18 29 L11 27 L18 25 Z" fill="#ffffff" opacity="0.8" />
      <circle cx="33" cy="10" r="1.7" fill="#d9c7f7" />
      <circle cx="8" cy="43" r="1.4" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}

const SCENE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 5,
  pointerEvents: "none",
};
