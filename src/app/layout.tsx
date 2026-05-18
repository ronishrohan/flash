import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
