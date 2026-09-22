import Image from "next/image";
import { TILT_ON_HOVER } from "./StepCard";

/**
 * A shape illustration. With `kissCut` on, a white rounded square (the kiss-cut
 * backing) pops in behind it and the shape shrinks to sit inside — the square
 * is the same size the shape normally occupies. On hover the whole thing tilts
 * together; it must sit inside a `group` element for that to work.
 */
export function ShapeImage({
  src,
  size,
  kissCut,
}: {
  src: string;
  /** Shapes render at two sizes in the Figma: 48px for Custom Shape, 52px for the grid. */
  size: 48 | 52;
  kissCut: boolean;
}) {
  return (
    // The tilt is on this wrapper (not the image) so the kiss-cut square and the
    // shape rotate together as one piece around the square's bottom-right corner.
    <span
      className={`relative flex shrink-0 items-center justify-center ${TILT_ON_HOVER}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className={[
          "absolute inset-0 rounded-2xl bg-white transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          kissCut ? "scale-100 opacity-100" : "scale-75 opacity-0",
        ].join(" ")}
      />
      <span
        className={[
          "relative transition-[scale] duration-300 ease-out",
          kissCut ? "scale-[0.68]" : "scale-100",
        ].join(" ")}
        style={{ width: size, height: size }}
      >
        <Image src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
      </span>
    </span>
  );
}
