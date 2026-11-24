import { useEffect } from "react";
import logoWebp from "../assets/logo.webp";
import BrandLogo from "./BrandLogo";

interface Props {
  onReady: () => void;
}

/** Preloads fonts + the logo so nothing pops in, then reveals the scene. */
export default function Preloader({ onReady }: Props) {
  useEffect(() => {
    let done = false;
    let active = true;
    let minimumTimer: number | undefined;
    let maximumTimer: number | undefined;

    const finish = () => {
      if (done || !active) return;
      done = true;
      if (maximumTimer !== undefined) window.clearTimeout(maximumTimer);
      onReady();
    };

    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const logoReady = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = logoWebp;
    });

    // Keep the centred event mark on screen long enough to register, even when cached
    // assets resolve almost instantly. The upper bound protects slow connections.
    const minimumSplash = new Promise<void>((resolve) => {
      minimumTimer = window.setTimeout(resolve, 1150);
    });
    const timeout = new Promise<void>((resolve) => {
      maximumTimer = window.setTimeout(resolve, 2500);
    });

    Promise.race([Promise.all([fontsReady, logoReady, minimumSplash]), timeout]).then(finish);

    return () => {
      active = false;
      if (minimumTimer !== undefined) window.clearTimeout(minimumTimer);
      if (maximumTimer !== undefined) window.clearTimeout(maximumTimer);
    };
  }, [onReady]);

  return (
    <div className="preloader" role="status" aria-live="polite">
      <BrandLogo variant="splash" />
      <span className="sr-only">Loading your invitation…</span>
    </div>
  );
}
