import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://video-university.local";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Video Learning — Udemy-style learning built with Next.js",
    template: "%s | Video Learning",
  },
  description:
    "A Udemy-inspired video learning experience powered by Next.js, Tailwind CSS, and a NestJS backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-[var(--background)] text-[var(--foreground)] antialiased"
      >
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
          {children}
        </main>
        <Toaster />
        <SiteFooter />
      </body>
    </html>
  );
}
