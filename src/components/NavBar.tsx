"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Mascot } from "@/components/configurator/Mascot";
import { MaterialIcon } from "@/components/icons/MaterialIcon";
import { CartIcon } from "@/components/icons/CartIcon";
import {
  STICKER_TYPE_DESCRIPTIONS,
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";
import type { StickerType } from "@/generated/prisma/client";

export function NavBar() {
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
    <header className="flex justify-center border-b border-ink-navy/10 bg-paper px-4 py-3">
      <div className="flex w-full max-w-3xl items-center gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <Mascot className="h-9 w-9 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
          <span className="font-display text-lg font-bold text-ink-navy">Sticker Quest</span>
        </Link>

        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-navy/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
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
            placeholder="Choose sticker type..."
            className="w-full rounded-full border border-ink-navy/15 bg-white/70 py-2 pl-10 pr-4 text-sm text-ink-navy outline-none focus:border-coral-signal"
          />

          {open && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-ink-navy/10 bg-white shadow-lg">
              {groups.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-navy/50">No matching sticker types.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1 p-2">
                  {groups.map((group) => (
                    <div key={group.title}>
                      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-navy/45">
                        {group.title}
                      </p>
                      <div className="flex flex-col">
                        {group.types.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goToType(type)}
                            className="flex items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-coral-signal/5"
                          >
                            <MaterialIcon
                              material={type}
                              className="h-8 w-8 shrink-0 text-ink-navy"
                            />
                            <span>
                              <span className="block text-sm font-medium text-ink-navy">
                                {STICKER_TYPE_LABELS[type]}
                              </span>
                              <span className="line-clamp-2 block text-xs text-ink-navy/55">
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

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-navy transition-colors hover:bg-ink-navy/5"
          aria-label="Cart"
        >
          <CartIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
