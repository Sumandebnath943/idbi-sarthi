import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IDBI SARTHI — AI Relationship Manager Copilot",
  description: "IDBI SARTHI (Smart AI Relationship & Trust Hub Intelligence) — an AI-powered Relationship Manager Copilot combining Customer 360, Financial Health Scoring, Loan Recommendation, Risk Prediction, Explainable AI, RAG Knowledge Base, and Next Best Action recommendations.",
  keywords: ["IDBI", "IDBI SARTHI", "AI Banking", "Relationship Manager", "RAG", "Explainable AI", "Financial Health Score"],
  authors: [{ name: "IDBI Hackathon Team" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" theme="light" />
      </body>
    </html>
  );
}
