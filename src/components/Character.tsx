import Image from "next/image";

/**
 * The Sticker Quest cast — the wizard, dragon, goblin and knight drawn as
 * die cut stickers. Use these for empty states and markers; the old orange
 * sticker mascot is retired.
 */
export const CHARACTERS = {
  // A 400px copy of wizard-sticker.png: images aren't optimised (next.config), and
  // the browser shrinking the 3211px original this small makes it look crunchy.
  wizard: { src: "/mascot/wizard-sticker-400.png", width: 400, height: 475 },
  dragon: { src: "/mascot/holo-dragon.png", width: 868, height: 868 },
  goblin: { src: "/mascot/goblin-sticker.png", width: 480, height: 388 },
  knight: { src: "/mascot/knight-helmet-sticker.png", width: 360, height: 515 },
} as const;

export type CharacterName = keyof typeof CHARACTERS;

/** One character, fitted inside a `size`-px square. Decorative, so it has no alt text. */
export function Character({
  name,
  size = 72,
  className = "",
}: {
  name: CharacterName;
  size?: number;
  className?: string;
}) {
  const c = CHARACTERS[name];
  const scale = size / Math.max(c.width, c.height);
  return (
    <Image
      src={c.src}
      alt=""
      aria-hidden
      width={Math.round(c.width * scale)}
      height={Math.round(c.height * scale)}
      className={`drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${className}`}
    />
  );
}
