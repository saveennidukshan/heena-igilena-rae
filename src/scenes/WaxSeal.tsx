import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  onTap: () => void;
}

/** A tactile wax-seal break: pressure, hairline fractures, then small falling pieces. */
export default function WaxSeal({ onTap }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const discRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const crackRef = useRef<SVGSVGElement>(null);
  const fragmentRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const isBreaking = useRef(false);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  const handleBreak = () => {
    if (isBreaking.current) return;
    isBreaking.current = true;

    const button = buttonRef.current;
    const disc = discRef.current;
    const label = labelRef.current;
    const cracks = crackRef.current;
    const fragments = fragmentRefs.current.filter((item): item is HTMLSpanElement => Boolean(item));
    const paths = cracks ? Array.from(cracks.querySelectorAll<SVGPathElement>("path")) : [];

    if (!button || !disc || !label || !cracks || fragments.length !== 5) {
      onTap();
      return;
    }

    button.disabled = true;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (reducedMotion) {
      gsap.to(button, {
        autoAlpha: 0,
        duration: 0.12,
        ease: "none",
        onComplete: onTap,
      });
      return;
    }

    // Promote only the pieces taking part in this short interaction.
    [button, disc, label, cracks, ...fragments].forEach((element) => {
      element.style.willChange = "transform, opacity";
    });

    gsap.set(button, { x: 0, y: 0, rotation: 0 });
    gsap.set(disc, { scale: 1, rotation: 0, autoAlpha: 1 });
    gsap.set(fragments, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 0 });
    gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(cracks, { opacity: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        [button, disc, label, cracks, ...fragments].forEach((element) => {
          element.style.willChange = "auto";
        });
        onTap();
      },
    });
    timelineRef.current = timeline;

    // Pressure builds in the centre of the seal before it begins to split.
    timeline.to(disc, { scale: 0.975, rotation: -1.1, duration: 0.13, ease: "power2.in" }, 0);
    timeline.to(disc, { scale: 1.018, rotation: 0.55, duration: 0.12, ease: "power1.out" }, 0.13);
    timeline.to(label, { autoAlpha: 0, y: -4, duration: 0.14, ease: "power1.out" }, 0.06);

    // A tiny paper-and-wax tremor, kept deliberately subtle.
    timeline.to(button, { x: -1.2, duration: 0.035, ease: "none" }, 0.2);
    timeline.to(button, { x: 1.1, duration: 0.045, ease: "none" }, 0.235);
    timeline.to(button, { x: -0.6, duration: 0.04, ease: "none" }, 0.28);
    timeline.to(button, { x: 0, duration: 0.05, ease: "power1.out" }, 0.32);

    // Cracks branch outward from the embossed centre, one after another.
    timeline.to(cracks, { opacity: 1, duration: 0.04 }, 0.2);
    timeline.to(paths, { strokeDashoffset: 0, duration: 0.27, stagger: 0.035, ease: "power1.inOut" }, 0.2);
    timeline.to(disc, { scale: 0.94, rotation: -1.6, duration: 0.14, ease: "power2.in" }, 0.53);

    // The broken seal separates into five uneven chips. Each accelerates as it falls.
    timeline.to(fragments, { opacity: 1, duration: 0.04, stagger: 0.012 }, 0.58);
    timeline.to(disc, { autoAlpha: 0, duration: 0.1, ease: "power1.in" }, 0.59);

    const flights = [
      { x: -36, y: 48, rotation: -70, duration: 0.66 },
      { x: 34, y: 43, rotation: 82, duration: 0.61 },
      { x: -29, y: 72, rotation: -44, duration: 0.73 },
      { x: 31, y: 78, rotation: 66, duration: 0.69 },
      { x: 3, y: 86, rotation: 128, duration: 0.76 },
    ];

    fragments.forEach((fragment, index) => {
      const flight = flights[index];
      timeline.to(
        fragment,
        {
          x: flight.x,
          y: flight.y,
          rotation: flight.rotation,
          scale: 0.72 - index * 0.035,
          duration: flight.duration,
          ease: "power2.in",
        },
        0.61 + index * 0.014,
      );
      timeline.to(
        fragment,
        { opacity: 0, duration: 0.18, ease: "power1.in" },
        1.02 + index * 0.018,
      );
    });

    timeline.to(button, { autoAlpha: 0, duration: 0.1, ease: "power1.out" }, 1.2);
  };

  return (
    <span className="wax-seal-anchor">
      <button
        ref={buttonRef}
        type="button"
        className="wax-seal"
        onClick={handleBreak}
        aria-label="Break the wax seal and open the invitation"
      >
        <span ref={discRef} className="wax-seal__disc" aria-hidden="true">
          <span className="wax-seal__rim" />
          <span className="wax-seal__emboss" />
          <svg className="wax-seal__symbol" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path
              d="M39 8.5C25.2 10.1 16.8 21.7 18.7 34.4c1.4 9.3 8.8 16.3 18 17.4-3.2 1.7-6.9 2.6-10.8 2.6C13.1 54.4 2.8 44.1 2.8 31.4S13.1 8.4 25.9 8.4c4.8 0 9.3 1.5 13.1 4.1Z"
              fill="currentColor"
              opacity=".92"
              transform="translate(10 0)"
            />
            <path d="m43 17 2.6 7.2 7.2 2.6-7.2 2.6L43 36.6l-2.6-7.2-7.2-2.6 7.2-2.6L43 17Z" fill="currentColor" />
          </svg>
        </span>

        <svg ref={crackRef} className="wax-seal__cracks" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M49 48 37 34 40 18" pathLength={1} />
          <path d="M51 49 67 37 78 40" pathLength={1} />
          <path d="M48 52 34 64 29 80" pathLength={1} />
          <path d="M52 52 66 65 72 82" pathLength={1} />
          <path d="M50 48 53 30 61 21" pathLength={1} />
        </svg>

        <span className="wax-seal__break-layer" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((part) => (
            <span
              key={part}
              ref={(element) => { fragmentRefs.current[part - 1] = element; }}
              className={`wax-seal__fragment wax-seal__fragment--${part}`}
            />
          ))}
        </span>

        <span ref={labelRef} className="wax-seal__label">
          <span className="wax-seal__label-line" />
          Break the seal
          <span className="wax-seal__label-line" />
        </span>
      </button>
    </span>
  );
}
