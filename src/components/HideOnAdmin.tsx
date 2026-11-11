"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Leaves out the shop's header and footer on /admin, which has its own sidebar. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
