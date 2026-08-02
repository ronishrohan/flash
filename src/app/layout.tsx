import type { Metadata } from "next";
import { Inter, Shadows_Into_Light } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shadows",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flash — AI Email Agent",
  description: "Your inbox, on autopilot. Flash reads, replies, and organizes your Gmail through plain English commands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={`h-full antialiased ${inter.variable} ${shadowsIntoLight.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
