import "@sidekiq/styles/globals.css";

import { type Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "@sidekiq/trpc/react";
import { ThemeProvider } from "@sidekiq/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Sidekiq",
  description: "Premium AI chat with custom assistants",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
