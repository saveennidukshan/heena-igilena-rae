import { useCallback, useEffect, useRef, useState } from "react";
import type { Guest, EventConfig } from "../config/types";
import { SceneController, type Phase } from "../scenes/SceneController";
import { ControllerContext, PhaseContext } from "../scenes/sceneContext";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import VideoBackground from "../scenes/VideoBackground";
import EnvelopeScene from "../scenes/EnvelopeScene";
import BrandLogo from "./BrandLogo";
import Preloader from "./Preloader";
import SkipReplay from "./SkipReplay";
import "../styles/scene.css";

interface Props {
  guest: Guest | null;
  event: EventConfig;
}

/** Mounts every scene layer, wires the shared controller, and gates on preload. */
export default function SceneStage({ guest, event }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const [ready, setReady] = useState(false);

  const controllerRef = useRef<SceneController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new SceneController({ reducedMotion, onPhase: setPhase });
  }
  const controller = controllerRef.current;

  useEffect(() => () => controller.destroy(), [controller]);

  const handleReady = useCallback(() => {
    setReady(true);
    controller.play();
  }, [controller]);

  return (
    <ControllerContext.Provider value={controller}>
      <PhaseContext.Provider value={phase}>
        <main className="stage" data-phase={phase} aria-label={`Invitation to ${event.name}`}>
          <VideoBackground />

          <div className="night-atmosphere" aria-hidden="true">
            <span className="night-atmosphere__moon" />
            <span className="night-atmosphere__horizon" />
          </div>

          <BrandLogo variant="masthead" className="masthead" label={event.name} />

          <EnvelopeScene guest={guest} event={event} />

          <SkipReplay />
          {!ready && <Preloader onReady={handleReady} />}
        </main>
      </PhaseContext.Provider>
    </ControllerContext.Provider>
  );
}
