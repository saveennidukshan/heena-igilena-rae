import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

// Dev-only: expose GSAP so the timeline can be slowed/paused while tuning the animation.
if (import.meta.env.DEV) {
  import("gsap").then(({ default: gsap }) => {
    (window as unknown as { gsap: typeof gsap }).gsap = gsap;
  });
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
