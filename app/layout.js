import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Splits — How far are you from the cut?",
  description:
    "Paste your swim times and see the standard you are closest to, by how much, how each event has moved, and your Power Index — from USA Swimming's published sheets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-water font-sans text-ink">{children}</body>
    </html>
  );
}
