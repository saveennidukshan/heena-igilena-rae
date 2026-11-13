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
    const finish = () => {
      if (done) return;
      done = true;
      onReady();
    };

    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const logoReady = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = logoWebp;
    });
    // Prime the intro video's first frames so playback begins the instant the scene reveals
    // (the browser caches it; the real <video> element then reuses the buffered data).
    const vid = document.createElement("video");
    const introReady = new Promise<void>((resolve) => {
      vid.preload = "auto";
      vid.muted = true;
      vid.onloadeddata = () => resolve();
      vid.onerror = () => resolve();
      vid.src = `${import.meta.env.BASE_URL}lantern-intro.mp4`;
      vid.load();
    });
    // Safety timeout so a slow network never traps the user on the splash.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2500));

    Promise.race([Promise.all([fontsReady, logoReady, introReady]), timeout]).then(finish);
  }, [onReady]);

  return (
    <div className="preloader" role="status" aria-live="polite">
      <BrandLogo variant="splash" />
      <span className="sr-only">Loading your invitation…</span>
    </div>
  );
}
