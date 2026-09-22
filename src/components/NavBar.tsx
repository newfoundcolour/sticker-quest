"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Container } from "@/components/Container";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import {
  STICKER_TYPE_DESCRIPTIONS,
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";
import type { StickerType } from "@/generated/prisma/client";

export function NavBar({ cartCount }: { cartCount: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STICKER_TYPE_GROUPS;
    return STICKER_TYPE_GROUPS.map((group) => ({
      title: group.title,
      types: group.types.filter((type) => STICKER_TYPE_LABELS[type].toLowerCase().includes(q)),
    })).filter((group) => group.types.length > 0);
  }, [query]);

  function goToType(type: StickerType) {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/configure/${STICKER_TYPE_SLUGS[type]}`);
  }

  return (
    <header className="bg-night">
      <Container className="flex items-center gap-3 py-3 sm:gap-5 sm:py-3.5">
        <Link href="/" className="shrink-0" aria-label="Sticker Quest home">
          <Image
            src="/brand/logo-sticker-quest.png"
            alt=""
            width={98}
            height={58}
            priority
            className="h-9 w-auto transition-transform duration-200 hover:scale-105 sm:h-12 md:h-[58px]"
          />
        </Link>

        <div className="relative min-w-0 flex-1">
          <div className="flex h-11 items-center gap-2 rounded-full border-2 border-white/[0.19] bg-white/[0.08] px-3.5 sm:h-[46px] sm:gap-3 sm:px-[22px]">
            <span aria-hidden className="text-base font-black text-zap">
              ✦
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 100)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && groups[0]?.types[0]) goToType(groups[0].types[0]);
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Select sticker type..."
              aria-label="Select sticker type"
              className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none placeholder:text-white"
            />
            <span
              aria-hidden
              className={["text-sm text-white/50 transition-transform duration-150", open ? "rotate-180" : ""].join(
                " ",
              )}
            >
              ⌄
            </span>
          </div>

          {open && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-[20px] border-[1.5px] border-grape bg-sand shadow-card">
              {groups.length === 0 ? (
                <p className="px-4 py-3 text-sm text-quiet">No matching sticker types.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1 p-2">
                  {groups.map((group) => (
                    <div key={group.title}>
                      <p className="px-2 py-1 text-xs font-black uppercase tracking-wide text-quiet">
                        {group.title}
                      </p>
                      <div className="flex flex-col">
                        {group.types.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goToType(type)}
                            className="flex items-start gap-2 rounded-xl p-2 text-left transition-colors hover:bg-zap/20"
                          >
                            <MaterialIcon material={type} className="h-8 w-8 shrink-0 text-night" />
                            <span>
                              <span className="block text-sm font-black text-night">
                                {STICKER_TYPE_LABELS[type]}
                              </span>
                              <span className="line-clamp-2 block text-xs text-quiet">
                                {STICKER_TYPE_DESCRIPTIONS[type]}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          href="/cart"
          className="relative flex size-11 shrink-0 flex-col items-center justify-center"
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
        >
          <Image src="/icons/cart.svg" alt="" width={23} height={23} />
          <span className="absolute left-7 top-0 flex size-[17px] items-center justify-center rounded-full bg-blaze text-[10px] font-black text-white">
            {cartCount}
          </span>
        </Link>
      </Container>
    </header>
  );
}
