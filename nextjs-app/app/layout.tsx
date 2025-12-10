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
  title: "Deliverability Analyzer | Email Spam & Deliverability Testing",
  description: "Test your email deliverability and spam score with our comprehensive analysis tool. Check SPF, DKIM, DMARC, blacklist status, and spam score powered by SpamAssassin.",
  icons: {
    icon: "https://i.ibb.co/gLhN0YXJ/Sendmarc-Icon-Author-Image-removebg-preview.png",
    apple: "https://i.ibb.co/gLhN0YXJ/Sendmarc-Icon-Author-Image-removebg-preview.png",
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
