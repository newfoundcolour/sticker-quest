import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import {
  STICKER_TYPE_GROUPS,
  STICKER_TYPE_LABELS,
  STICKER_TYPE_SLUGS,
} from "@/lib/stickerTypeSlug";

const OFFICE_HOURS = [
  { days: "Monday – Friday", hours: "8am – 5pm" },
  { days: "Saturday", hours: "Closed" },
  { days: "Sunday", hours: "Closed" },
];

const LINK_CLASSES = "text-white/55 transition-colors hover:text-white";

function FooterColumn({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-4 text-sm">{children}</div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.13] bg-night">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <FooterColumn title="Products">
          <ul className="space-y-2.5">
            {STICKER_TYPE_GROUPS.flatMap((group) => group.types).map((type) => {
              const label = STICKER_TYPE_LABELS[type];
              return (
                <li key={type}>
                  <Link href={`/configure/${STICKER_TYPE_SLUGS[type]}`} className={LINK_CLASSES}>
                    {/* "Sticker Sheets", not "Sticker Sheets Stickers". */}
                    {label.endsWith("Sheets") ? label : `${label} Stickers`}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FooterColumn>

        <FooterColumn title="Blog">
          <Link href="/blog" className={LINK_CLASSES}>
            Blog posts
          </Link>
        </FooterColumn>

        <FooterColumn title="Support">
          <Link href="/contact" className={LINK_CLASSES}>
            Contact us
          </Link>
          <h3 className="mt-6 text-xs font-black text-white/80 uppercase tracking-wide">
            Office hours
          </h3>
          <dl className="mt-2.5 space-y-1.5 text-white/55">
            {OFFICE_HOURS.map(({ days, hours }) => (
              <div key={days} className="flex justify-between gap-4 sm:max-w-[220px]">
                <dt>{days}</dt>
                <dd className="text-white/80">{hours}</dd>
              </div>
            ))}
          </dl>
        </FooterColumn>

        <FooterColumn
          title={
            <>
              <span aria-hidden="true">🐉 </span>Our Mission
            </>
          }
        >
          <p className="leading-relaxed text-white/55">
            We&rsquo;re Sticker Quest and we&rsquo;re on a quest to make getting custom branded
            stickers dead easy.
          </p>
        </FooterColumn>
      </Container>

      <div className="border-t border-white/[0.13]">
        <Container className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:h-[112px] sm:flex-row sm:justify-between sm:py-0 sm:text-left">
          <Image
            src="/brand/logo-sticker-quest.png"
            alt="Sticker Quest"
            width={68}
            height={40}
            className="h-8 w-auto sm:h-10"
          />
          <p className="text-xs text-white/45">© 2026 StickerQuest Inc. · All rights reserved.</p>
          {/* Plain text until the Privacy / Terms pages exist. */}
          <div className="flex gap-5 text-xs font-bold text-white/55 sm:gap-7">
            <span>Privacy</span>
            <span>Terms</span>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
