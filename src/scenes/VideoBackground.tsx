import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useScenePhase, useController, atOrAfter } from "./sceneContext";
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
const INTRO_POSTER = `${import.meta.env.BASE_URL}lantern-intro-poster.jpg`;
const LOOP_POSTER = `${import.meta.env.BASE_URL}lantern-loop-poster.jpg`;

const INTRO_START_TIMEOUT_MS = 12000;

interface Props {
  onIntroSettled?: () => void;
}

/** The video background + the gold masthead reveal that used to live in CameraTilt. */
export default function VideoBackground({ onIntroSettled }: Props) {
  const phase = useScenePhase();
  const controller = useController();
  const reduced = usePrefersReducedMotion();
  const [needsTap, setNeedsTap] = useState(false);
  const introPlayedRef = useRef(false);
  const loopPrimedRef = useRef(false);
  const settledCbRef = useRef(onIntroSettled);
  settledCbRef.current = onIntroSettled;
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
      introPlayedRef.current = false;
      setNeedsTap(false);
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
      setNeedsTap(false);
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
      controller.hold();
      intro.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setNeedsTap(true);
          settledCbRef.current?.();
        }
      });
    }
  }, [phase, reduced, showLoop, controller]);

  useEffect(() => {
    if (reduced || phase !== "lighting" || needsTap) return;
    const t = window.setTimeout(() => {
      if (introPlayedRef.current) return;
      controller.skip();
      settledCbRef.current?.();
    }, INTRO_START_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, reduced, needsTap, controller]);

  useEffect(() => {
    const intro = introRef.current;
    const loop = loopRef.current;
    if (!intro || !loop || reduced) return;

    const onPlaying = () => {
      introPlayedRef.current = true;
      setNeedsTap(false);
      settledCbRef.current?.();
      controller.resume();
      if (!loopPrimedRef.current) {
        loopPrimedRef.current = true;
        loop.preload = "auto";
        loop.load();
      }
    };
    const onStall = () => {
      if (loopShownRef.current || !startedRef.current) return;
      controller.hold();
    };
    const onVisible = () => {
      if (document.hidden || loopShownRef.current || !introPlayedRef.current) return;
      if (intro.paused && !intro.ended) void intro.play().catch(() => {});
    };
    intro.addEventListener("playing", onPlaying);
    intro.addEventListener("waiting", onStall);
    intro.addEventListener("pause", onStall);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      intro.removeEventListener("playing", onPlaying);
      intro.removeEventListener("waiting", onStall);
      intro.removeEventListener("pause", onStall);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [controller, reduced]);

  const handleTapToStart = () => {
    const intro = introRef.current;
    const loop = loopRef.current;
    if (!intro || !loop) return;
    setNeedsTap(false);
    void intro.play().catch(() => {});
    loop
      .play()
      .then(() => {
        if (!loopShownRef.current) loop.pause();
      })
      .catch(() => {});
  };

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

    // The event mark gets a dedicated, genuinely centred beat before the envelope arrives.
    // In reduced-motion mode the same title beat is static during the short lighting phase.
    const showCentredMark = (reduced && phase === "lighting") || (!reduced && phase === "tilt");
    if (showCentredMark) {
      gsap.fromTo(
        m,
        { autoAlpha: 0, scale: reduced ? 1 : 0.94 },
        { autoAlpha: 1, scale: 1, duration: reduced ? 0.18 : 1.15, ease: "power2.out" },
      );
    } else if (phase === "envelope") {
      gsap.to(m, { autoAlpha: 0, scale: 0.97, duration: reduced ? 0.22 : 0.9, ease: "power2.in" });
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
    <>
      <div className="video-bg" aria-hidden="true">
        <video
          ref={introRef}
          className="video-bg__layer video-bg__intro"
          src={INTRO_SRC}
          poster={INTRO_POSTER}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        <video
          ref={loopRef}
          className="video-bg__layer video-bg__loop"
          src={LOOP_SRC}
          poster={LOOP_POSTER}
          muted
          playsInline
          loop
          preload={reduced ? "auto" : "metadata"}
          disablePictureInPicture
        />
      </div>
      {needsTap && (
        <button type="button" className="video-tap-start" onClick={handleTapToStart}>
          Tap to open your invitation
        </button>
      )}
    </>
  );
}
