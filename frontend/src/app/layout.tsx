import type { Metadata } from "next";
import { Prompt, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "WBL Connect",
  description: "ระบบบริหารจัดการสถานศึกษา WBL Connect โรงเรียนวัดบึงเหล็ก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WBL Connect" />
      </head>
      <body
        className={`${prompt.variable} ${inter.variable} antialiased font-sans bg-background text-text-primary`}
      >
        <GlobalErrorBoundary>
          <ServiceWorkerRegister />
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            theme="light"
            toastOptions={{
              className: "!rounded-xl !border-border !shadow-elevated",
              style: {
                fontFamily: "var(--font-prompt)",
              },
            }}
          />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
