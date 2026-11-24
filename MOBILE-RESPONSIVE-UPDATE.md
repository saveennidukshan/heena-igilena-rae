# Moonlit Indigo — responsive layout update

This update keeps the original Moonlit Indigo visual identity, invitation copy, background footage, and animation sequence. It focuses on predictable layout behavior across desktop, tablet, portrait phones, and landscape phones.

## Responsive changes

- Uses the small, dynamic viewport units (`svh` / `dvh`) with a `100vh` fallback so mobile browser chrome does not crop the stage.
- Uses safe-area-aware spacing for phones with display cut-outs and rounded corners.
- Keeps the opened invitation and countdown in one scroll region. The content is vertically centered when it fits and starts at the top when it needs scrolling.
- Uses a wider two-panel desktop composition: invitation on the left, countdown and Replay action on the right.
- Keeps compact portrait layouts in one column and switches short landscape screens to a compact two-panel layout when there is enough width.
- Keeps event details in two columns when they have room and switches to one column on narrow phones for readable wrapping.
- Sizes the original logo by height and preserves its intrinsic aspect ratio. The logo itself has no glow, drop-shadow, or shimmer filter.
- Moves Replay into normal invitation flow instead of fixing it over the page, so it cannot cover the letter while scrolling. Skip remains a floating control only during the opening sequence.
- Keeps the envelope and seal sized relative to the available viewport, with their existing 3D opening and wax-fracture animation intact.

## Animation and accessibility

- GSAP continues to animate transforms and opacity rather than layout dimensions.
- Temporary `will-change` promotion is applied only during short particle motion and removed during cleanup.
- The existing reduced-motion behavior is preserved.
- The countdown interval runs only when a valid event date is configured and refreshes after the page becomes visible again.

## Configure the countdown

Edit `src/config/event.ts`. Keep `dateTime` as the human-readable date printed on the invitation. For an unambiguous countdown instant, add `countdownAt` in ISO 8601 format with the event's UTC offset.

Example format only:

```ts
countdownAt: "2026-12-20T19:00:00+05:30",
```

Replace the example with the confirmed event date and time before publishing. If the date is still a placeholder, the invitation displays a date-confirmation message instead of a fabricated countdown.

## Run locally

```bash
npm ci
npm run dev
```

For a production bundle:

```bash
npm run build
```


## Positioning and centred logo correction

The follow-up positioning fix separates layout transforms from animation transforms:

- The envelope now sits inside `.envelope-unit-anchor`, fixed at the true centre of the viewport. GSAP animates only the inner `.env`, so its entrance and floating motion cannot displace the anchor on phones.
- The wax seal now uses `.wax-seal-anchor` for its fixed position and a separate inner button for shake/pressure motion. The cracks and wax fragments are centred with auto margins rather than a `translateX()` transform, so GSAP fragment movement starts from the exact visible seal position on desktop and mobile.
- The event logo appears in the true centre during the title beat before the envelope arrives. The same centred title is retained in reduced-motion mode.
- The initial splash logo remains centred for at least 1.15 seconds (up to the existing 2.5-second safety limit), avoiding a near-invisible flash when assets are already cached.
