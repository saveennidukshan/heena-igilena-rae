import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import BrandLogo from "../components/BrandLogo";
import { useScenePhase, useController, atOrAfter } from "./sceneContext";

/**
 * A layered, embossed wax seal. On activation the wax compresses against the envelope,
 * develops a branching fracture, then breaks into uneven pieces which drop with gravity.
 */
export default function WaxSeal({ onTap }: { onTap: () => void }) {
  const phase = useScenePhase();
  const controller = useController();
  const reduced = controller.reducedMotion;

  const discRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const crackRef = useRef<SVGSVGElement>(null);
  const crackPathsRef = useRef<SVGPathElement[]>([]);
  const fragmentRefs = useRef<HTMLSpanElement[]>([]);
  const fired = useRef(false);

  const broken = atOrAfter(phase, "opening");

  const handleTap = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    onTap();
  }, [onTap]);

  // Subtle breathing under the warm light while the seal is waiting to be opened.
  useEffect(() => {
    if (phase !== "seal") return;
    const disc = discRef.current;
    if (!disc || reduced) return;

    const pulse = gsap.to(disc, {
      scale: 1.025,
      y: -1,
      duration: 1.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    return () => {
      pulse.kill();
      gsap.set(disc, { scale: 1, y: 0, rotation: 0 });
    };
  }, [phase, reduced]);

  // Touch to open in distinct physical beats: pressure, fracture, then falling pieces.
  useEffect(() => {
    if (!broken) return;
    const disc = discRef.current;
    const label = labelRef.current;
    const crack = crackRef.current;
    const paths = crackPathsRef.current.filter(Boolean);
    const fragments = fragmentRefs.current.filter(Boolean);
    if (!disc) return;

    gsap.killTweensOf([disc, label, crack, ...paths, ...fragments]);

    if (reduced) {
      gsap.to([disc, label], { opacity: 0, scale: 0.96, duration: 0.28, ease: "power1.out" });
      return;
    }

    const tl = gsap.timeline();
    tl.to(disc, {
      scaleX: 0.94,
      scaleY: 0.88,
      y: 3,
      rotation: -2,
      duration: 0.12,
      ease: "power2.in",
    })
      .to(disc, {
        scaleX: 1.055,
        scaleY: 1.025,
        y: -1,
        rotation: 1.5,
        duration: 0.12,
        ease: "back.out(2.4)",
      })
      .to(crack, { opacity: 1, duration: 0.02 }, 0.17)
      .to(paths, {
        strokeDashoffset: 0,
        duration: 0.22,
        stagger: 0.035,
        ease: "power1.out",
      }, 0.17)
      .to(disc, {
        scale: 1.08,
        rotation: -1,
        duration: 0.08,
        ease: "power1.in",
      }, 0.39)
      .to(label, { opacity: 0, y: 8, duration: 0.18, ease: "power1.out" }, 0.22)
      .set(fragments, { opacity: 1 }, 0.43)
      .to(disc, { opacity: 0, scale: 0.92, duration: 0.1, ease: "power1.out" }, 0.43);

    const throws = [
      { x: -23, y: 76, rotation: -34, duration: 0.72, delay: 0.43, scale: 0.82 },
      { x: 21, y: 63, rotation: 31, duration: 0.66, delay: 0.46, scale: 0.78 },
      { x: -31, y: 112, rotation: -58, duration: 0.78, delay: 0.48, scale: 0.7 },
      { x: 29, y: 105, rotation: 52, duration: 0.74, delay: 0.45, scale: 0.72 },
      { x: 3, y: 132, rotation: 19, duration: 0.84, delay: 0.5, scale: 0.58 },
    ];

    fragments.forEach((fragment, index) => {
      const shard = throws[index];
      if (!shard) return;
      tl.to(fragment, {
        x: shard.x,
        y: shard.y,
        rotation: shard.rotation,
        scale: shard.scale,
        opacity: 0,
        duration: shard.duration,
        ease: "power2.in",
      }, shard.delay);
    });

    return () => {
      tl.kill();
    };
  }, [broken, reduced]);

  const crackPaths = [
    "M51 4 L47 19 L56 28 L47 39 L54 49 L45 61 L50 75",
    "M47 39 L34 43 L28 55 L17 59",
    "M54 49 L68 53 L73 65 L84 69",
    "M45 61 L34 69 L35 83",
  ];

  return (
    <button
      type="button"
      className="wax-seal"
      onClick={handleTap}
      disabled={broken}
      aria-label="Tap to open your invitation"
    >
      <span ref={discRef} className="wax-seal__disc">
        <span className="wax-seal__rim" aria-hidden="true" />
        <span className="wax-seal__emboss" aria-hidden="true" />
        <BrandLogo variant="seal" />
      </span>

      <span className="wax-seal__break-layer" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            ref={(element) => {
              if (element) fragmentRefs.current[index] = element;
            }}
            className={`wax-seal__fragment wax-seal__fragment--${index + 1}`}
          />
        ))}
        <svg ref={crackRef} className="wax-seal__cracks" viewBox="0 0 100 100" aria-hidden="true">
          {crackPaths.map((path, index) => (
            <path
              key={path}
              ref={(element) => {
                if (element) crackPathsRef.current[index] = element;
              }}
              d={path}
              pathLength={1}
            />
          ))}
        </svg>
      </span>

      <span ref={labelRef} className="wax-seal__label">
        <span className="wax-seal__label-line" />
        Touch to open
        <span className="wax-seal__label-line" />
      </span>
    </button>
  );
}
