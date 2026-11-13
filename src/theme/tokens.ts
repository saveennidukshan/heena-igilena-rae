/** TS mirror of the CSS design tokens, for GSAP / tsParticles / canvas use. */
export const colors = {
  night: "#0b132b",
  twilight: "#2c1a4d",
  lavender: "#8e7cb9",
  moonlight: "#ebd0ce",
  gold: "#f0c05a",
  ember: "#e8923a",
  seal: "#8e2b2b",
} as const;

/** Scene-beat timings in seconds (mirrors PLAN §8 and tokens.css). */
export const timings = {
  light: 3.5,
  crowd: 3,
  swarm: 4,
  tilt: 3.5,
  logo: 2,
  envelope: 2,
  open: 2.5,
} as const;

export const ease = {
  soft: "power2.inOut",
  settle: "back.out(1.4)",
  out: "power3.out",
} as const;
