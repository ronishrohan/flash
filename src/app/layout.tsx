import type { Metadata } from "next";
import { Poppins, Inter, Shadows_Into_Light } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
    <html lang="en" className={`h-full antialiased ${poppins.variable} ${inter.variable} ${shadowsIntoLight.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
