import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { Toaster } from "@/components/ui/toaster";
import "@/lib/env"; // Trigger Env Validation

import "../globals.css";

const IBMPlex = IBM_Plex_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex'
});

export const metadata: Metadata = {
  title: "ArabianRizz - The #1 AI Wingman for Dates & Hookups",
  description: "Stop getting rejected. Use our Uncensored AI to generate rizz, get dates, and hookup fast. Your personal dating coach.",
  keywords: "AI Wingman, Rizz App, Dating Coach, Hookup Lines, Uncensored AI, Tinder Helper, RizzGPT, Flirting AI",
  openGraph: {
    title: "Get Loved. Get Laid. Get ArabianRizz.",
    description: "The only Uncensored AI Wingman that actually works. Upload screenshots, get replies, and close the deal.",
    type: "website",
  }
};

export default function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = useMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <ClerkProvider appearance={{
      variables: { colorPrimary: '#624cf5' }
    }}>
      <html lang={locale} dir={dir}>
        <body className={cn("font-IBMPlex antialiased", IBMPlex.variable)}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster />
            <AnalyticsProvider />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
