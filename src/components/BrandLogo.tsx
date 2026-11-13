import logoWebp from "../assets/logo.webp";

type Variant = "splash" | "masthead" | "seal" | "letterhead";

interface Props {
  variant: Variant;
  className?: string;
  /** Accessible name. When given, the logo is announced (alt text); otherwise it is purely
   *  decorative (aria-hidden) — used where a real text heading already carries the title. */
  label?: string;
}

/**
 * The event logo (gold-foil "හීන ඉගිලෙන රෑ") as a reusable hero element with a
 * gold-shimmer sweep. `seal` renders static/small; all variants go static under
 * reduced-motion (handled in scene.css).
 */
export default function BrandLogo({ variant, className, label }: Props) {
  return (
    <div
      className={`brandlogo brandlogo--${variant} ${className ?? ""}`.trim()}
      aria-hidden={label ? undefined : true}
    >
      <img className="brandlogo__img" src={logoWebp} alt={label ?? ""} draggable={false} />
      <span className="brandlogo__shimmer" aria-hidden="true" />
    </div>
  );
}
