import type { ReactNode } from "react";

/** Title row at the top of each /account page, matching the Figma Orders dashboard. */
export function AccountPageHeader({ title, intro, action }: { title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-headline text-[32px] font-bold leading-tight text-sand">{title}</h1>
        {intro && <p className="max-w-xl text-sm leading-relaxed text-white/[0.44]">{intro}</p>}
      </div>
      {action}
    </div>
  );
}
