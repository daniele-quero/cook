import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Text, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { PwaRegistrar } from "@/components/pwa-registrar";
import "./globals.css";
import "./chat-consent.css";
import "./legal.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const libreCaslonText = Libre_Caslon_Text({
  variable: "--font-display",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://danio-cooks.netlify.app"),
  title: {
    default: "Danio Cooks",
    template: "%s | Danio Cooks",
  },
  description: "Ricette tecniche, tempi chiari e cucina ragionata.",
  applicationName: "Danio Cooks",
  verification: {
    google: "ijh2bPUAd1Q4n-aZjPIAU4cWIm-hbkpk54VW3IzQFE4",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Danio Cooks",
    title: "Danio Cooks",
    description: "Ricette tecniche, tempi chiari e cucina ragionata.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Danio Cooks",
    description: "Ricette tecniche, tempi chiari e cucina ragionata.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Danio Cooks",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${plusJakartaSans.variable} ${libreCaslonText.variable} h-full`}>
      <head>
        <Script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3487676869629470"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}