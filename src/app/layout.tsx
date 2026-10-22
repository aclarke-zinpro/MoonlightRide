import type { Metadata, Viewport } from "next";
import { getEnv } from "@/lib/env";
import { inter, playfair } from "./fonts";
import "./globals.css";

// Every page reads the database at request time (research.md R1), never during the build.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getEnv().SITE_URL),
    title: { default: "Moonlight Ride", template: "%s · Moonlight Ride" },
    description:
      "An annual fall bike ride by the light of the full moon on the gravel roads along the Cannon River near Northfield, Minnesota.",
    openGraph: { images: ["/images/og-2026.jpg"], siteName: "Moonlight Ride", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#0d0f12", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
