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
  title: "CHIMERA — Multi-Agent Fusion Engine",
  description:
    "CHIMERA Orchestration Engine — GLM-5.2 744B MoE, auto-cura reativa 6 fases, Expert Cortex 19k experts, 5 AI Agents, tRPC v11, streaming SSE nativo.",
  keywords: [
    "chimera",
    "multi-agent fusion",
    "colibri engine",
    "GLM-5.2",
    "self-healing",
    "expert cortex",
    "tRPC",
    "agentic AI",
    "nexus hub",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CHIMERA — Multi-Agent Fusion Engine",
    description:
      "Multi-Agent Fusion Engine com Colibri (GLM-5.2 744B MoE), auto-cura reativa, Expert Cortex, tRPC v11, 5 AI Agents. Producao ao vivo.",
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