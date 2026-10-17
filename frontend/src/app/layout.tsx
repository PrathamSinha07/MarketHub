import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { NavbarSkeleton } from "@/components/layout/NavbarSkeleton";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MarketHub — Multi-vendor marketplace",
    template: "%s | MarketHub",
  },
  description:
    "MarketHub is a multi-vendor marketplace connecting buyers with independent sellers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-full flex-col font-sans text-zinc-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
            >
              Skip to main content
            </a>
            {/* Required by Cache Components: `usePathname()` (URL data) must
                live inside a Suspense boundary. The navbar also signals
                AuthProvider once it has hydrated (see useAuth.completeRestore)
                so the session restore never lands between the prerendered HTML
                and this boundary's hydration - that race used to make React
                log error #418 on every page load. */}
            <Suspense fallback={<NavbarSkeleton />}>
              <Navbar />
            </Suspense>
            {/* Soft page surface so white cards/forms read as raised
                surfaces; navbar and footer remain white anchors. */}
            <main id="main-content" className="flex-1 bg-zinc-50">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
