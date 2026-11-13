import { useController, useScenePhase } from "../scenes/sceneContext";

/** Skip (jump to the envelope) while the sequence plays; Replay once it's open. */
export default function SkipReplay() {
  const controller = useController();
  const phase = useScenePhase();

  const showSkip = phase !== "opening" && phase !== "opened" && phase !== "seal";
  const showReplay = phase === "opened";

  return (
    <div className="controls">
      {showSkip && (
        <button type="button" className="controls__btn" onClick={() => controller.skip()}>
          Skip
        </button>
      )}
      {showReplay && (
        <button type="button" className="controls__btn" onClick={() => controller.replay()}>
          Replay
        </button>
      )}
    </div>
  );
}
