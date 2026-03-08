import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IroMap Workbench",
  description: "Color structure workbench for RGB exploration and photo analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
