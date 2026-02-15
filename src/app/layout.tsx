import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Manager - Biblioteca de Prompts para IA",
  description: "Gestiona, organiza y reutiliza prompts para ChatGPT, Copilot, Gemini y más. Crea, categoriza y versiona tus prompts de IA.",
  keywords: ["prompts", "IA", "ChatGPT", "Copilot", "Gemini", "prompt library", "AI prompts"],
  authors: [{ name: "Prompt Manager" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Prompt Manager",
    description: "Biblioteca de prompts para IA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Manager",
    description: "Biblioteca de prompts para IA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
