import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitPro - Plataforma de Gestão de Treinos",
  description: "Plataforma completa para personal trainers e academias gerenciarem treinos, acompanharem progresso e conectarem com seus alunos de forma profissional.",
  keywords: "personal trainer, academia, treinos, fitness, gestão de alunos",
  authors: [{ name: "FitPro Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitPro"
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://fitpro.com",
    title: "FitPro - Plataforma de Gestão de Treinos",
    description: "Plataforma completa para personal trainers e academias",
    siteName: "FitPro"
  },
  twitter: {
    card: "summary_large_image",
    title: "FitPro - Plataforma de Gestão de Treinos",
    description: "Plataforma completa para personal trainers e academias"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FitPro" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}