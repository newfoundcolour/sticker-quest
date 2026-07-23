import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Stands in for General Sans (Fontshare) until the licensed font files are
// self-hosted via next/font/local — see the note in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink-navy">
        {children}
      </body>
    </html>
  );
}
