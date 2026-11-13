import { createContext, useContext } from "react";
import type { Phase } from "./SceneController";
import type { SceneController } from "./SceneController";

/** Current phase — scenes subscribe to this and animate themselves accordingly. */
export const PhaseContext = createContext<Phase>("loading");
export const useScenePhase = (): Phase => useContext(PhaseContext);

/** The controller instance (for Skip/Replay/tap-to-open). */
export const ControllerContext = createContext<SceneController | null>(null);
export const useController = (): SceneController => {
  const c = useContext(ControllerContext);
  if (!c) throw new Error("useController must be used within a SceneStage");
  return c;
};

/** True once the phase is at/after the envelope appears (handy for scene visibility). */
const ORDER: Phase[] = [
  "loading",
  "lighting",
  "crowd",
  "swarm",
  "tilt",
  "envelope",
  "seal",
  "opening",
  "opened",
];
export const phaseIndex = (p: Phase): number => ORDER.indexOf(p);
export const atOrAfter = (p: Phase, ref: Phase): boolean => phaseIndex(p) >= phaseIndex(ref);
