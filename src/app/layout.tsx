import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono, Urbanist } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { getCart } from "@/lib/cart";
import "./globals.css";

// The redesigned UI face (Figma). A variable font, so every weight the design
// uses (Regular through Black) comes from one file.
const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

// Stands in for General Sans (Fontshare) until the licensed font files are
// self-hosted via next/font/local — see the note in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Stands in for Clash Display (Fontshare) — same bold/geometric/playful
// brief, but freely licensed so it actually renders today. Swap for the
// licensed Clash Display files via next/font/local if/when they're bought.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

// The brand's chosen numeric/utility face for prices, quantities, order IDs.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sticker Quest",
  description: "Custom stickers and labels, configured and ordered online.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cart = await getCart();

  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${geistSans.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink-navy">
        <NavBar cartCount={cart.length} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
