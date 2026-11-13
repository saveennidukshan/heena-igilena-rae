import gsap from "gsap";

/**
 * The single source of truth for "where are we in the sequence".
 * Every scene component renders the correct visual for the CURRENT phase, no matter how
 * it was reached (normal play, Skip, or Replay) — scenes must not keep their own clock.
 */
export type Phase =
  | "loading"
  | "lighting"
  | "crowd"
  | "swarm"
  | "tilt"
  | "envelope"
  | "seal"
  | "opening"
  | "opened";

/**
 * Phase start times (seconds), aligned to the ~10s intro video (lantern-intro.mp4):
 * the couple light + release the lantern, the camera tilts up into the full sky (tilt),
 * then as the footage cross-fades into the looping backdrop the envelope rises (envelope).
 */
const FULL: Partial<Record<Phase, number>> = {
  lighting: 0,
  crowd: 2.5,
  swarm: 5,
  tilt: 7.5,
  envelope: 10,
  seal: 12,
};

/** Condensed, gentle schedule for prefers-reduced-motion (no swarm/tilt build-up). */
const REDUCED: Partial<Record<Phase, number>> = {
  lighting: 0,
  envelope: 0.8,
  seal: 1.8,
};

const AUTO_PHASES: Phase[] = ["lighting", "crowd", "swarm", "tilt", "envelope", "seal"];

export interface SceneControllerOptions {
  reducedMotion: boolean;
  onPhase: (phase: Phase) => void;
}

export class SceneController {
  readonly reducedMotion: boolean;
  private readonly onPhase: (phase: Phase) => void;
  private readonly schedule: Partial<Record<Phase, number>>;
  private readonly openDuration: number;
  private tl: gsap.core.Timeline;
  private _phase: Phase = "loading";
  private opened = false;
  private openCall?: gsap.core.Tween;

  constructor({ reducedMotion, onPhase }: SceneControllerOptions) {
    this.reducedMotion = reducedMotion;
    this.onPhase = onPhase;
    this.schedule = reducedMotion ? REDUCED : FULL;
    this.openDuration = reducedMotion ? 0.8 : 3.05;
    this.tl = this.buildTimeline();
  }

  private buildTimeline(): gsap.core.Timeline {
    const tl = gsap.timeline({ paused: true });
    AUTO_PHASES.forEach((p) => {
      const t = this.schedule[p];
      if (t !== undefined) tl.call(() => this.set(p), undefined, t);
    });
    const sealTime = this.schedule.seal ?? 0;
    // trailing hold so the timeline has duration past the seal while it waits for a tap.
    tl.to({}, { duration: 0.4 }, sealTime);
    return tl;
  }

  get phase(): Phase {
    return this._phase;
  }

  /** 0..1 progress through the auto sequence. */
  get progress(): number {
    return this.tl.progress();
  }

  private set(phase: Phase) {
    if (phase === this._phase) return;
    this._phase = phase;
    this.onPhase(phase);
  }

  /** Begin the auto sequence from the start (called once assets are preloaded). */
  play() {
    this.opened = false;
    this.openCall?.kill();
    this.tl.play(0);
  }

  /** Jump straight to the envelope + seal, skipping the sky build-up. */
  skip() {
    this.tl.pause();
    const sealTime = this.schedule.seal ?? 0;
    this.tl.time(sealTime);
    this.set("seal");
  }

  /** User tapped the seal: break it open, then settle into the letter. */
  open() {
    if (this.opened) return;
    this.opened = true;
    this.tl.pause();
    this.set("opening");
    this.openCall = gsap.delayedCall(this.openDuration, () => this.set("opened"));
  }

  /** Restart the whole experience from the first beat. */
  replay() {
    this.opened = false;
    this.openCall?.kill();
    this.set("loading");
    this.play();
  }

  destroy() {
    this.openCall?.kill();
    this.tl.kill();
  }
}
