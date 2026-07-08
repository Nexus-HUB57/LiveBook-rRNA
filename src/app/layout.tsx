import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetaTempo — Um Mundo Atemporal no Metaverso",
  description:
    "Onde o tempo se dissolve, a realidade se expande e cada instante se torna uma eternidade. Explore o metaverso atemporal.",
  keywords: ["metaverso", "atemporal", "realidade virtual", "digital", "metatempo"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MetaTempo — Um Mundo Atemporal no Metaverso",
    description: "Explore o limite entre o possivel e o imaginado no metaverso atemporal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050510] text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}