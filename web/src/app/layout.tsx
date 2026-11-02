import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import { cn } from "@/lib/utils";

// imakepage's own typeface, as on imakepage.com.
const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "imakepage", template: "%s | imakepage" },
  description: "Type your name and get a real estate website, home search and lead inbox in one place.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

// Every page reads live data (leads, listings, site settings), so render per request.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  preconnect("https://images.unsplash.com");
  return (
    <html lang="en" className={cn("h-full antialiased", sans.variable)}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only z-[2000] rounded-lg bg-ink px-4 py-2 font-semibold text-ground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
