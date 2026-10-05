import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@infosiva/shared-ui/modern";
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
  title: "agent-lab — RAG orchestrator for any codebase",
  description:
    "LangGraph plan → retrieve → synthesize → critique loop over Qdrant vector search. Point it at any repo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><MotionProvider>{children}</MotionProvider></body>
    </html>
  );
}
