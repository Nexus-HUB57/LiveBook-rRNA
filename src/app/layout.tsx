import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/providers/trpc-provider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fusao LLM 2401 — Agente Generativo Orquestrador Ativo",
  description:
    "Ecosystem Dashboard com 2,402 projetos indie, 5 AI Agents, RAG rRNA pipeline, tRPC Nativo. Agente Generativo Orquestrador Ativo — resolutivo, vivo, em producao.",
  keywords: [
    "ai agents",
    "ecosystem dashboard",
    "tRPC",
    "RAG rRNA",
    "agentic AI",
    "fusao llm",
    "nexus hub",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Fusao LLM 2401 — Agente Generativo Orquestrador Ativo",
    description:
      "Agente Generativo Orquestrador Ativo com Chatbot Devs Full-Stack, tRPC Nativo, RAG rRNA pipeline. Producao em Ambiente Real ao Vivo.",
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
        className={`${ibmPlexMono.variable} antialiased flex flex-col min-h-screen`}
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}