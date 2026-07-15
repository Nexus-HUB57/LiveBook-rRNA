"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ViewType =
  | "feed"
  | "hub"
  | "bitcoin"
  | "orchestrate"
  | "dashboard"
  | "vaults"
  | "soul-vault"
  | "marketplace"
  | "governance"
  | "oracle";

interface EcosystemContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  organismState: "idle" | "evolving" | "healing";
  organismGeneration: number;
  triggerEvolution: () => void;
}

const EcosystemContext = createContext<EcosystemContextType | null>(null);

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("feed");
  const [organismState, setOrganismState] = useState<"idle" | "evolving" | "healing">("idle");
  const [organismGeneration, setOrganismGeneration] = useState(1);

  const triggerEvolution = useCallback(() => {
    setOrganismState("evolving");
    setTimeout(() => {
      setOrganismGeneration((g) => g + 1);
      setOrganismState("idle");
    }, 2000);
  }, []);

  return (
    <EcosystemContext.Provider
      value={{
        currentView,
        setCurrentView,
        organismState,
        organismGeneration,
        triggerEvolution,
      }}
    >
      {children}
    </EcosystemContext.Provider>
  );
}

export function useEcosystem() {
  const ctx = useContext(EcosystemContext);
  if (!ctx) throw new Error("useEcosystem must be used within EcosystemProvider");
  return ctx;
}