"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
    <header className="flex items-center gap-4 bg-night px-8 py-3">
      <Link href="/" className="shrink-0" aria-label="Sticker Quest home">
        <Image
          src="/brand/logo-sticker-quest.png"
          alt=""
          width={94}
          height={56}
          priority
          className="h-14 w-auto transition-transform duration-200 hover:scale-105"
        />
      </Link>

      <div className="relative flex-1">
        <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.12] px-[22px] py-[11px]">
          <span aria-hidden className="text-sm font-extrabold text-zap">
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
            className="min-w-0 flex-1 bg-transparent text-sm font-extrabold text-white outline-none placeholder:text-white"
          />
          <Image
            src="/icons/dropdown.svg"
            alt=""
            width={14}
            height={14}
            className={["transition-transform duration-150", open ? "rotate-180" : ""].join(" ")}
          />
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-[20px] bg-white shadow-card">
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
                          className="flex items-start gap-2 rounded-xl p-2 text-left transition-colors hover:bg-mist"
                        >
                          <MaterialIcon material={type} className="h-8 w-8 shrink-0 text-ink" />
                          <span>
                            <span className="block text-sm font-black text-ink">
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
        className="relative flex h-9 w-9 shrink-0 items-center justify-center"
        aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
      >
        <Image src="/icons/cart.svg" alt="" width={20} height={20} />
        <span className="absolute -top-1 left-6 flex size-4 items-center justify-center rounded-full bg-blaze text-[9px] font-black text-white">
          {cartCount}
        </span>
      </Link>
    </header>
  );
}
