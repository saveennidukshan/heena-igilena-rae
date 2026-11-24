import logoWebp from "../assets/logo.webp";

type Variant = "splash" | "masthead" | "seal" | "letterhead";

interface Props {
  variant: Variant;
  className?: string;
  /** Accessible name. When given, the logo is announced; otherwise it is decorative. */
  label?: string;
}

/** A quiet, crisp rendering of the original gold event mark. */
export default function BrandLogo({ variant, className, label }: Props) {
  return (
    <div
      className={`brandlogo brandlogo--${variant} ${className ?? ""}`.trim()}
      aria-hidden={label ? undefined : true}
    >
      <img
        className="brandlogo__img"
        src={logoWebp}
        alt={label ?? ""}
        draggable={false}
        decoding="async"
      />
    </div>
  );
}
