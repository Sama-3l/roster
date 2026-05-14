import type { Metadata } from "next";
import { DM_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

const unbounded = Unbounded({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "Americano | Badminton Tournament Manager",
  description:
    "Doubles · Rotating pairs · Individual scoring — Generate round-robin fixtures for Americano-style badminton tournaments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmMono.variable} ${unbounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
