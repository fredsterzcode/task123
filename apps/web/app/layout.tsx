import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navigation from "./components/Navigation";

export const metadata: Metadata = {
  title: "RealCheck - AI-Powered Interview Monitoring",
  description: "Monitor live video calls and detect AI-assisted behavior in real-time",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gray-50 min-h-screen"}>
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-96px)] px-4">
          <div className="w-full max-w-5xl mx-auto py-12">
            {children}
          </div>
        </main>
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
            <p>&copy; 2024 RealCheck. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
