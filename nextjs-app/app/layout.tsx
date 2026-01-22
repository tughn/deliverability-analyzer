import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deliverability Analyzer | Email Authentication Testing",
  description: "Test email deliverability instantly. Verify SPF, DKIM, DMARC authentication and get actionable recommendations.",
  icons: {
    icon: '/logo.png',
  },
  alternates: {
    canonical: "https://deliverabilityanalyzer.xyz/",
  },
  other: {
    "og:updated_time": new Date().toISOString(),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
