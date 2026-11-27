import type { Metadata } from "next";
import { Noto_Sans_JP, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { UsageAnalytics } from "@/components/usage-analytics";
import { CookieConsent } from "@/components/cookie-consent";

import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IroMap | Photo Color Analyzer",
  description: "Understand the color structure of your photos",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      ["max-image-preview"]: "none",
      ["max-snippet"]: -1,
      ["max-video-preview"]: -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${notoSansJp.variable} ${geistMono.variable} antialiased`}>
        <UsageAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieConsent />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
