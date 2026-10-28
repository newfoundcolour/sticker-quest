import type { ReactNode } from "react";

/** Title row at the top of each /account page, on the night background. */
export function AccountPageHeader({ title, intro, action }: { title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-black leading-tight text-white sm:text-[36px]">{title}</h1>
        {intro && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/65">{intro}</p>}
      </div>
      {action}
    </div>
  );
}
