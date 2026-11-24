import { useController, useScenePhase } from "../scenes/sceneContext";

/** Skip the opening sequence; Replay is kept in the invitation's scroll flow. */
export default function SkipReplay() {
  const controller = useController();
  const phase = useScenePhase();
  const showSkip = phase !== "opening" && phase !== "opened" && phase !== "seal";

  if (!showSkip) return null;

  return (
    <div className="controls">
      <button type="button" className="controls__btn" onClick={() => controller.skip()}>
        Skip
      </button>
    </div>
  );
}
