import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useScenePhase, atOrAfter } from "./sceneContext";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import "../styles/video.css";

/*
 * The cinematic background is now REAL FOOTAGE, not a hand-built canvas scene.
 *
 *   intro  (lantern-intro.mp4, ~10s) — a couple light and release a glowing sky lantern,
 *          then the camera tilts up into a sky filling with lanterns. Plays once, start→end.
 *   loop   (lantern-loop.mp4)        — a calm drifting-lantern sky that begins exactly where
 *          the intro ends and loops seamlessly. It becomes the steady backdrop over which the
 *          envelope rises and the letter slides out.
 *
 * Near the end of the intro we CROSS-FADE into the loop so the sky never cuts, then the loop
 * carries the rest of the experience. A direct Skip (→ envelope/seal) cuts straight to the
 * loop. prefers-reduced-motion shows the loop's first frame as a still backdrop — no playback.
 */

const CROSSFADE = 0.9; // seconds of intro→loop dissolve
const CROSSFADE_LEAD = 0.85; // begin the dissolve this long before the intro ends

const INTRO_SRC = `${import.meta.env.BASE_URL}lantern-intro.mp4`;
const LOOP_SRC = `${import.meta.env.BASE_URL}lantern-loop.mp4`;

/** The video background + the gold masthead reveal that used to live in CameraTilt. */
export default function VideoBackground() {
  const phase = useScenePhase();
  const reduced = usePrefersReducedMotion();
  const introRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const loopShownRef = useRef(false);
  /** true whenever the looping backdrop is meant to be rolling (envelope → opened). */
  const keepLoopRef = useRef(false);

  /** Reveal the looping sky — crossfaded during normal play, instant on Skip. Idempotent. */
  const showLoop = useCallback(
    (instant: boolean) => {
      if (loopShownRef.current) return;
      loopShownRef.current = true;
      const loop = loopRef.current;
      const intro = introRef.current;
      if (!loop) return;
      gsap.killTweensOf(loop);
      if (intro) gsap.killTweensOf(intro);
      void loop.play().catch(() => {});

      if (instant) {
        gsap.set(loop, { autoAlpha: 1 });
        if (intro) {
          gsap.set(intro, { autoAlpha: 0 });
          intro.pause();
        }
      } else {
        gsap.to(loop, { autoAlpha: 1, duration: CROSSFADE, ease: "power1.inOut" });
        if (intro) {
          gsap.to(intro, {
            autoAlpha: 0,
            duration: CROSSFADE,
            ease: "power1.inOut",
            onComplete: () => intro.pause(),
          });
        }
      }
    },
    [],
  );

  // --- drive playback from the phase machine ---------------------------------
  useEffect(() => {
    const intro = introRef.current;
    const loop = loopRef.current;
    if (!intro || !loop) return;

    // Reduced motion: no autoplaying footage — hold the calm sky on its first frame.
    if (reduced) {
      startedRef.current = true;
      loopShownRef.current = true;
      keepLoopRef.current = false; // reduced motion holds a still frame, never plays
      gsap.set(loop, { autoAlpha: 1 });
      gsap.set(intro, { autoAlpha: 0 });
      intro.pause();
      loop.pause();
      try {
        loop.currentTime = 0;
      } catch {
        /* not seekable yet — the first frame paints once decoded */
      }
      return;
    }

    if (phase === "loading") {
      // Replay/initial: re-arm both clips for a clean restart.
      startedRef.current = false;
      loopShownRef.current = false;
      keepLoopRef.current = false;
      intro.pause();
      loop.pause();
      try {
        intro.currentTime = 0;
        loop.currentTime = 0;
      } catch {
        /* ignore */
      }
      gsap.set(intro, { autoAlpha: 1 });
      gsap.set(loop, { autoAlpha: 0 });
      return;
    }

    // Envelope → seal → opening → opened: the looping sky is the backdrop the whole time.
    // Opening/opened arrive on a user tap, so play() is always permitted here — this both
    // cuts to the loop (on a Skip) and recovers a loop the browser quietly paused mid-open.
    if (atOrAfter(phase, "envelope")) {
      startedRef.current = true;
      keepLoopRef.current = true;
      showLoop(true);
      void loop.play().catch(() => {});
      return;
    }

    // First real beat: roll the intro from the top.
    if (!startedRef.current && phase === "lighting") {
      startedRef.current = true;
      gsap.set(intro, { autoAlpha: 1 });
      gsap.set(loop, { autoAlpha: 0 });
      try {
        intro.currentTime = 0;
      } catch {
        /* ignore */
      }
      void intro.play().catch(() => {});
    }
  }, [phase, reduced, showLoop]);

  // --- crossfade to the loop as the intro runs out ---------------------------
  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    const onTime = () => {
      if (loopShownRef.current) return;
      const d = intro.duration;
      if (d && intro.currentTime >= d - CROSSFADE_LEAD) showLoop(false);
    };
    const onEnded = () => showLoop(false);
    intro.addEventListener("timeupdate", onTime);
    intro.addEventListener("ended", onEnded);
    return () => {
      intro.removeEventListener("timeupdate", onTime);
      intro.removeEventListener("ended", onEnded);
    };
  }, [showLoop]);

  // --- keep the looping backdrop alive -------------------------------------
  // Some mobile browsers quietly pause an inline <video> after a heavy repaint (the letter
  // opening over it) or when the tab is backgrounded. Whenever the loop is meant to be
  // rolling, resume it the instant it pauses or the page becomes visible again.
  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    const resume = () => {
      if (keepLoopRef.current && !document.hidden && loop.paused) {
        void loop.play().catch(() => {});
      }
    };
    loop.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      loop.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  // --- gold masthead: materialise over the full sky, then recede as the envelope rises ---
  useEffect(() => {
    const m = document.querySelector<HTMLElement>(".masthead");
    if (!m) return;
    gsap.killTweensOf(m);
    gsap.set(m, { xPercent: -50, yPercent: -50 });

    if (reduced) {
      gsap.set(m, { autoAlpha: 0 });
      return;
    }
    if (phase === "tilt") {
      gsap.fromTo(
        m,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 1.3, ease: "power2.out" },
      );
    } else if (phase === "envelope") {
      gsap.to(m, { autoAlpha: 0, scale: 1.04, duration: 1.2, ease: "power2.in" });
    } else {
      gsap.set(m, { autoAlpha: 0 });
    }
  }, [phase, reduced]);

  useEffect(
    () => () => {
      const m = document.querySelector<HTMLElement>(".masthead");
      if (m) gsap.killTweensOf(m);
    },
    [],
  );

  return (
    <div className="video-bg" aria-hidden="true">
      <video
        ref={introRef}
        className="video-bg__layer video-bg__intro"
        src={INTRO_SRC}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <video
        ref={loopRef}
        className="video-bg__layer video-bg__loop"
        src={LOOP_SRC}
        muted
        playsInline
        loop
        preload="auto"
        disablePictureInPicture
      />
    </div>
  );
}
