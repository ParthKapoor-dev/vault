import "@/styles/main.css";

import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Footer } from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/components/providers";
import { OpenGraph } from "@/lib/og";

export const metadata: Metadata = {
  ...OpenGraph,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${GeistMono.variable} ${GeistSans.className} ${GeistSans.variable}`}
      >
        <Providers>
          <main className="mx-auto max-w-screen-sm overflow-x-hidden px-6 py-24 md:overflow-x-visible">
            <Header />
            {children}
            <Footer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
