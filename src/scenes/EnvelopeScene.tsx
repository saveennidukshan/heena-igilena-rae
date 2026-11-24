import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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

/** A restrained scatter of moonlit dust released as the envelope opens. */
const SPARK_COUNT = 7;

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
  const letterWrapRef = useRef<HTMLDivElement>(null);
  const present = atOrAfter(phase, "envelope");
  const opening = phase === "opening";
  const showLetter = atOrAfter(phase, "opening");
  const showSeal = phase === "seal";
  const showBurst = opening && !controller.reducedMotion;

  useLayoutEffect(() => {
    const env = envRef.current;
    const flap = flapRef.current;
    const card = cardRef.current;
    const glow = glowRef.current;

    if (!present) {
      if (env) gsap.killTweensOf(env);
      if (flap) gsap.killTweensOf(flap);
      if (card) gsap.killTweensOf(card);
      if (glow) gsap.killTweensOf(glow);
      return;
    }

    if (!env || !flap || !card || !glow) return;

    const targets = [env, flap, card, glow];
    const reduced = controller.reducedMotion;
    gsap.killTweensOf(targets);

    // Every phase derives its visual state from the controller, including direct Skip jumps.
    if (phase === "envelope") {
      gsap.set([env, flap, card], { clearProps: "transform" });
      gsap.set(env, { autoAlpha: 1, yPercent: 0, y: 0, scale: 1, rotationZ: 0 });
      gsap.set(flap, { rotateX: 0, zIndex: 4, autoAlpha: 1 });
      gsap.set(card, { yPercent: 0, rotationX: 0, rotationZ: 0 });
      gsap.set(glow, { opacity: 0.42, scale: 1 });

      gsap.fromTo(
        env,
        { yPercent: reduced ? 7 : 34, scale: reduced ? 0.99 : 0.975, rotationZ: reduced ? 0 : -0.7, autoAlpha: 0 },
        {
          yPercent: 0,
          scale: 1,
          rotationZ: 0,
          autoAlpha: 1,
          duration: reduced ? 0.42 : 1.22,
          ease: reduced ? "power2.out" : "power3.out",
          force3D: true,
        },
      );
    } else if (phase === "seal") {
      gsap.set(env, { yPercent: 0, y: 0, scale: 1, rotationZ: 0, autoAlpha: 1 });
      gsap.set(flap, { rotateX: 0, zIndex: 4, autoAlpha: 1 });
      gsap.set(card, { yPercent: 0, rotationX: 0, rotationZ: 0 });
      gsap.set(glow, { opacity: 0.42, scale: 1 });
    }

    // A very small suspended-paper drift; only transform properties are animated.
    if ((phase === "envelope" || phase === "seal") && !reduced) {
      gsap.to(env, {
        y: -2.5,
        rotationZ: 0.12,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: phase === "envelope" ? 1.38 : 0.15,
        force3D: true,
      });
    }

    // The wax component calls controller.open only after its fragments have fallen.
    if (opening) {
      gsap.killTweensOf(targets);
      gsap.set(env, { yPercent: 0, y: 0, rotationZ: 0, scale: 1, autoAlpha: 1 });
      gsap.set(flap, { rotateX: 0, zIndex: 4, autoAlpha: 1 });
      gsap.set(card, { yPercent: 0, rotationX: 2.2, rotationZ: -0.25 });

      if (reduced) {
        gsap.to(flap, { autoAlpha: 0, duration: 0.12, ease: "none" });
        gsap.to(card, { yPercent: -118, duration: 0.32, ease: "power2.out" });
        gsap.to(env, { autoAlpha: 0, duration: 0.34, ease: "power1.out", delay: 0.14 });
        gsap.to(glow, { opacity: 0, duration: 0.22, delay: 0.12 });
      } else {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

        // A soft recoil travels through the envelope before the paper releases.
        timeline.to(env, { rotationZ: -0.38, y: 1.5, scale: 0.997, duration: 0.1, ease: "power1.out" }, 0);
        timeline.to(env, { rotationZ: 0, y: 0, scale: 1, duration: 0.24, ease: "power2.out" }, 0.1);

        // The flap flexes at the crease, then swings behind the pocket with a tiny settle.
        timeline.to(flap, { rotateX: 4, duration: 0.1, ease: "power1.out" }, 0.02);
        timeline.to(flap, { rotateX: -9, duration: 0.15, ease: "power1.inOut" }, 0.12);
        timeline.to(flap, { rotateX: -164, duration: 0.74, ease: "power2.inOut" }, 0.27);
        timeline.to(flap, { rotateX: -182, duration: 0.14, ease: "power1.out" }, 1.01);
        timeline.to(flap, { rotateX: -180, duration: 0.16, ease: "power1.inOut" }, 1.15);
        timeline.set(flap, { zIndex: 1 }, 1.2);

        // A restrained pool of reflected moonlight follows the moving flap.
        timeline.to(glow, { opacity: 0.68, duration: 0.42, ease: "power2.out" }, 0.34);

        // Paper slides out with a slight initial tilt, then settles flat above the pocket.
        timeline.to(
          card,
          { yPercent: -126, rotationX: 0, rotationZ: 0, duration: 1.02, ease: "power3.out", force3D: true },
          0.72,
        );
        timeline.to(card, { yPercent: -123, duration: 0.16, ease: "power1.inOut" }, 1.74);

        // The envelope leaves only after the card has cleared the mouth.
        timeline.to(env, { yPercent: 32, autoAlpha: 0, duration: 0.76, ease: "power2.in" }, 2.02);
        timeline.to(glow, { opacity: 0, duration: 0.62, ease: "power1.in" }, 2.08);
      }
    } else if (phase === "opened") {
      gsap.set(env, { autoAlpha: 0 });
      gsap.set(glow, { opacity: 0 });
    }

    return () => {
      gsap.killTweensOf(targets);
    };
  }, [phase, present, opening, controller.reducedMotion]);

  // Reveal the complete letter + countdown together, only after the paper clears the envelope.
  useLayoutEffect(() => {
    const wrap = letterWrapRef.current;
    if (!wrap) return;
    gsap.killTweensOf(wrap);

    if (phase === "opening") {
      if (controller.reducedMotion) {
        gsap.fromTo(wrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: "none" });
      } else {
        gsap.fromTo(
          wrap,
          { autoAlpha: 0, y: 9 },
          { autoAlpha: 1, y: 0, duration: 0.48, delay: 2.02, ease: "power2.out", force3D: true },
        );
      }
    } else if (phase === "opened") {
      gsap.set(wrap, { autoAlpha: 1, y: 0 });
    }

    return () => gsap.killTweensOf(wrap);
  }, [phase, controller.reducedMotion]);

  // Moonlit dust floats out of the envelope opening in a short, one-shot drift.
  useLayoutEffect(() => {
    const root = burstRef.current;
    if (!root || !showBurst) return;

    const particles = Array.from(root.querySelectorAll<HTMLElement>(".stardust-burst__particle"));
    const tweens: gsap.core.Tween[] = [];
    particles.forEach((particle) => {
      particle.style.willChange = "transform, opacity";
    });

    particles.forEach((particle, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const spread = (index - (SPARK_COUNT - 1) / 2) * 17;
      const drift = direction * (10 + index * 2);
      const duration = 1.8 + (index % 3) * 0.28;
      const delay = 0.24 + index * 0.075;

      tweens.push(
        gsap.fromTo(
          particle,
          { x: spread * 0.35, y: 8, scale: 0.25, opacity: 0 },
          {
            x: spread + drift,
            y: -(105 + (index % 4) * 23),
            scale: 0.72 + (index % 3) * 0.14,
            opacity: 0.9,
            duration,
            delay,
            ease: "power2.out",
          },
        ),
      );
      tweens.push(
        gsap.to(particle, {
          opacity: 0,
          duration: 0.62,
          delay: delay + duration - 0.48,
          ease: "power1.in",
        }),
      );
    });

    return () => {
      tweens.forEach((tween) => tween.kill());
      particles.forEach((particle) => {
        particle.style.willChange = "auto";
      });
    };
  }, [showBurst]);

  if (!present) {
    return <div className="envelope-scene" data-phase={phase} style={SCENE_STYLE} aria-hidden="true" />;
  }

  return (
    <div className="envelope-scene" data-phase={phase} style={SCENE_STYLE}>
      <div className="envelope-stage">
        <div ref={glowRef} className="envelope__glow" aria-hidden="true" />

        {/* The fixed anchor owns centering; GSAP only transforms the envelope inside it. */}
        <div className="envelope-unit-anchor">
          <div ref={envRef} className="env">
            {/* back panel (opaque) */}
            <svg className="env__part env__back" aria-hidden="true" viewBox="0 0 350 250" preserveAspectRatio="none">
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
            <svg className="env__part env__pocket" aria-hidden="true" viewBox="0 0 350 250" preserveAspectRatio="none">
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
              <svg className="env__flap-face env__flap-face--front" aria-hidden="true" viewBox="0 0 350 135" preserveAspectRatio="none">
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
              <svg className="env__flap-face env__flap-face--back" aria-hidden="true" viewBox="0 0 350 135" preserveAspectRatio="none">
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
        </div>

        {/* the readable letter — sits above everything once handed off */}
        {showLetter && (
          <div ref={letterWrapRef} className="letter-wrap">
            <div className="letter-stack">
              <InvitationLetter guest={guest} event={event} />
              <div className="letter-aside">
                <EventCountdown event={event} />
                {phase === "opened" && (
                  <button
                    type="button"
                    className="controls__btn letter-replay"
                    onClick={() => controller.replay()}
                  >
                    Replay invitation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {/* fine celestial dust drifting out as the letter is released */}
        {showBurst && (
          <div ref={burstRef} className="stardust-burst" aria-hidden="true">
            {Array.from({ length: SPARK_COUNT }).map((_, i) => (
              <span key={i} className="stardust-burst__particle">
                <BurstSpark />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** A small, low-contrast star glint for the envelope's dust burst. */
function BurstSpark() {
  return (
    <svg className="stardust-burst__svg" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.5 12.1 7.9 18.5 10 12.1 12.1 10 18.5 7.9 12.1 1.5 10 7.9 7.9Z" fill="#eee8ff" />
      <circle cx="10" cy="10" r="2" fill="#fff" />
    </svg>
  );
}

type EventDateFields = Record<string, unknown>;

function parseClock(value: unknown): [number, number, number] | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?(?:[:.](\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const meridiem = match[4]?.toUpperCase();

  if (minutes > 59 || seconds > 59 || hours > 23) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
  }
  return [hours, minutes, seconds];
}

function makeLocalTimestamp(
  year: number,
  monthIndex: number,
  day: number,
  clockValue?: unknown,
): number | null {
  const clock = clockValue == null || clockValue === "" ? [0, 0, 0] as const : parseClock(clockValue);
  if (!clock) return null;

  const [hours, minutes, seconds] = clock;
  const date = new Date(year, monthIndex, day, hours, minutes, seconds);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) return null;

  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function parseEventDate(value: unknown, timeValue?: unknown): number | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;

  const raw = value.trim();
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return makeLocalTimestamp(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      timeValue,
    );
  }

  // A timezone-free ISO date/time is local time; explicit Z/offset values stay absolute.
  const localIso = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (localIso) {
    return makeLocalTimestamp(
      Number(localIso[1]),
      Number(localIso[2]) - 1,
      Number(localIso[3]),
      `${localIso[4]}:${localIso[5]}:${localIso[6] ?? "00"}`,
    );
  }

  // Parse common human-readable dates before Date.parse so a separate `time` field is kept.
  const dayFirst = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})(?:[,|·–— ]+(.+))?$/i);
  const monthFirst = raw.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?:[,|·–— ]+(.+))?$/i);
  const human = dayFirst ?? monthFirst;
  if (human) {
    const monthNames = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
    ];
    const monthName = (dayFirst ? human[2] : human[1]).toLowerCase();
    const monthIndex = monthNames.findIndex((month) => month.startsWith(monthName.slice(0, 3)));
    if (monthIndex < 0) return null;

    const day = Number(dayFirst ? human[1] : human[2]);
    const year = Number(human[3]);
    const inlineTime = human[4]?.replace(/^[,|·–— ]+/, "").replace(/^at\s+/i, "");
    const clockValue = inlineTime ?? timeValue;
    if (clockValue == null || clockValue === "" || parseClock(clockValue)) {
      return makeLocalTimestamp(year, monthIndex, day, clockValue);
    }
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Supports common EventConfig date names without requiring a change to the config type:
 * startsAt, startAt, startDateTime, eventDateTime, dateTime, datetime,
 * eventDate, startDate, or date (optionally paired with time/startTime).
 */
function getEventTimestamp(event: EventConfig): number | null {
  const fields = event as unknown as EventDateFields;
  const separateTime = fields.startTime ?? fields.time;
  const dateKeys = [
    "countdownAt",
    "startsAt",
    "startAt",
    "startDateTime",
    "eventDateTime",
    "dateTime",
    "datetime",
    "eventDate",
    "startDate",
    "date",
  ];

  for (const key of dateKeys) {
    const value = fields[key];
    if (value === undefined || value === null || value === "") continue;
    const timestamp = parseEventDate(value, separateTime);
    if (timestamp !== null) return timestamp;
  }
  return null;
}

function EventCountdown({ event }: { event: EventConfig }) {
  const target = getEventTimestamp(event);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target === null) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, [target]);

  if (target === null) {
    return (
      <section className="event-countdown event-countdown--unavailable" aria-label="Event countdown">
        <p className="event-countdown__eyebrow">A little more until we meet</p>
        <p className="event-countdown__unavailable-text">
          The countdown will begin when the event date is confirmed.
        </p>
      </section>
    );
  }

  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  const parts = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  return (
    <section className="event-countdown" aria-label="Countdown to the event">
      <p className="event-countdown__eyebrow">A little more until we meet</p>
      {remaining === 0 ? (
        <p className="event-countdown__arrived">The moment has arrived ✦</p>
      ) : (
        <div className="event-countdown__grid" aria-live="off">
          {parts.map((part) => (
            <div className="event-countdown__unit" key={part.label}>
              <span className="event-countdown__value">{String(part.value).padStart(2, "0")}</span>
              <span className="event-countdown__label">{part.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const SCENE_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 5,
  pointerEvents: "none",
};
