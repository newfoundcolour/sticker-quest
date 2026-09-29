import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Blog · Sticker Quest" };

// Placeholder until blog posts exist.
export default function BlogPage() {
  return <ComingSoon title="Blog" blurb="Sticker tips, how-tos and behind-the-scenes posts are on the way." />;
}
