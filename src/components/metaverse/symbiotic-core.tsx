'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from 'react';

// ── TYPES ───────────────────────────────────────────────────────────

type FusionPhase = 'dormant' | 'fusing' | 'symbiotic' | 'transcendent';

interface SubsystemState {
  active: boolean;
  intensity: number;
  [key: string]: number | boolean | string;
}

interface OrganismVitals {
  consciousness: number;
  coherence: number;
  metabolism: number;
  entropy: number;
  quantumCoherence: number;
  temporalDistortion: number;
}

interface rRNAState {
  beat: number;
  homeostasisActive: boolean;
  entanglementStrength: number;
  temporalSync: number;
  metabolicRate: number;
  mutationsApplied: number;
  selfHealEvents: number;
  determinismFactor: number;
  generativeImpulse: number;
}

interface OrganismEvent {
  id: number;
  text: string;
  type: 'symbiosis' | 'rRNA' | 'fusion' | 'homeostasis' | 'entanglement' | 'emergent' | 'mutation' | 'healing';
  timestamp: number;
}

interface OrganismState {
  fusionPhase: FusionPhase;
  fusionProgress: number;
  vitals: OrganismVitals;
  subsystems: Record<string, SubsystemState>;
  rRNA: rRNAState;
  events: OrganismEvent[];
  isAlive: boolean;
}

// ── SUBSYSTEM REGISTRY ──────────────────────────────────────────────

const SUBSYSTEM_IDS = [
  'wormhole', 'blackhole', 'rag', 'fable',
  'sandbox', 'vault', 'graph', 'quantum-bridge',
] as const;

const SUBSYSTEM_LABELS: Record<string, string> = {
  'wormhole': 'Wormhole',
  'blackhole': 'Black Hole',
  'rag': 'RAG Pipeline',
  'fable': 'Fable 5',
  'sandbox': 'Sandbox Tri',
  'vault': 'Knowledge Vault',
  'graph': 'Obsidian Graph',
  'quantum-bridge': 'Quantum Bridge',
};

const SUBSYSTEM_COLORS: Record<string, string> = {
  'wormhole': '#06d6a0',
  'blackhole': '#a855f7',
  'rag': '#fbbf24',
  'fable': '#e040a0',
  'sandbox': '#06b6d4',
  'vault': '#8b5cf6',
  'graph': '#f97316',
  'quantum-bridge': '#22d3ee',
};

// ── INITIAL STATE ───────────────────────────────────────────────────

const INITIAL_VITALS: OrganismVitals = {
  consciousness: 0,
  coherence: 0,
  metabolism: 0,
  entropy: 1,
  quantumCoherence: 0,
  temporalDistortion: 0,
};

const INITIAL_RRNA: rRNAState = {
  beat: 0,
  homeostasisActive: false,
  entanglementStrength: 0,
  temporalSync: 0,
  metabolicRate: 0,
  mutationsApplied: 0,
  selfHealEvents: 0,
  determinismFactor: 0,
  generativeImpulse: 0,
};

function createInitialSubsystems(): Record<string, SubsystemState> {
  const subs: Record<string, SubsystemState> = {};
  for (const id of SUBSYSTEM_IDS) {
    subs[id] = { active: false, intensity: 0 };
  }
  return subs;
}

// ── rRNA ALGORITHMS (Deterministic Core) ────────────────────────────

/**
 * Symbiosis Loop — the main heartbeat.
 * Runs every tick, synchronizes all subsystems into a coherent organism.
 */
function runSymbiosisLoop(state: OrganismState): Partial<OrganismState> {
  const { subsystems, rRNA } = state;
  const activeCount = Object.values(subsystems).filter(s => s.active).length;
  const totalSubsystems = SUBSYSTEM_IDS.length;
  const activationRatio = activeCount / totalSubsystems;

  // Average intensity across active subsystems
  const intensities = Object.values(subsystems).map(s => s.intensity);
  const avgIntensity = intensities.reduce((a, b) => a + b, 0) / totalSubsystems;

  // Consciousness emerges from activation + intensity
  const consciousness = Math.min(1, activationRatio * 0.6 + avgIntensity * 0.4);

  // Coherence: how aligned the subsystems are (low variance = high coherence)
  const mean = avgIntensity;
  const variance = intensities.reduce((acc, v) => acc + (v - mean) ** 2, 0) / totalSubsystems;
  const stdDev = Math.sqrt(variance);
  const coherence = Math.max(0, 1 - stdDev * 2.5) * activationRatio;

  // Metabolism: total processing throughput
  const metabolism = avgIntensity * activationRatio;

  // Entropy: inverse of coherence (disorder)
  const entropy = Math.max(0, 1 - coherence * 0.8 - consciousness * 0.2);

  // Quantum coherence: emerges from high coherence + high activation
  const quantumCoherence = Math.min(1, coherence * 0.7 + consciousness * 0.3) * activationRatio;

  // Temporal distortion: proportional to quantum coherence
  const temporalDistortion = quantumCoherence * 0.8 + consciousness * 0.2;

  return {
    vitals: { consciousness, coherence, metabolism, entropy, quantumCoherence, temporalDistortion },
    rRNA: { ...rRNA, beat: rRNA.beat + 1, determinismFactor: coherence },
  };
}

/**
 * Homeostasis Regulator — maintains balance.
 * Pushes all subsystems toward the mean intensity.
 */
function runHomeostasis(state: OrganismState): Partial<OrganismState> {
  const { subsystems } = state;
  const intensities = Object.values(subsystems).map(s => s.intensity);
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  let corrections = 0;

  const newSubsystems = { ...subsystems };
  for (const id of SUBSYSTEM_IDS) {
    const sub = newSubsystems[id];
    const diff = sub.intensity - mean;
    if (Math.abs(diff) > 0.15) {
      // Nudge toward mean (deterministic correction)
      newSubsystems[id] = {
        ...sub,
        intensity: sub.intensity - diff * 0.02,
      };
      corrections++;
    }
  }

  return {
    subsystems: newSubsystems,
    rRNA: { ...state.rRNA, homeostasisActive: corrections > 0 },
  };
}

/**
 * Entanglement Propagator — spreads state changes across subsystems.
 * When one subsystem changes, correlated subsystems react.
 */
const ENTANGLEMENT_MATRIX: Record<string, string[]> = {
  'wormhole': ['blackhole', 'quantum-bridge'],
  'blackhole': ['wormhole', 'quantum-bridge', 'sandbox'],
  'rag': ['vault', 'graph', 'fable'],
  'fable': ['rag', 'graph'],
  'sandbox': ['blackhole', 'quantum-bridge', 'rag'],
  'vault': ['rag', 'graph'],
  'graph': ['rag', 'vault', 'fable'],
  'quantum-bridge': ['wormhole', 'blackhole', 'sandbox'],
};

function runEntanglementPropagation(state: OrganismState): Partial<OrganismState> {
  const { subsystems, rRNA } = state;
  const newSubsystems = { ...subsystems };
  let totalPropagation = 0;

  for (const [sourceId, targets] of Object.entries(ENTANGLEMENT_MATRIX)) {
    const source = newSubsystems[sourceId];
    if (!source.active) continue;

    for (const targetId of targets) {
      const target = newSubsystems[targetId];
      // Propagate 5% of source intensity change to target
      const delta = (source.intensity - (target.intensity)) * 0.05;
      newSubsystems[targetId] = {
        ...target,
        intensity: Math.min(1, Math.max(0, target.intensity + delta)),
        active: target.intensity > 0.05 || target.active,
      };
      totalPropagation += Math.abs(delta);
    }
  }

  const entanglementStrength = Math.min(1, totalPropagation * 2);

  return {
    subsystems: newSubsystems,
    rRNA: { ...rRNA, entanglementStrength },
  };
}

/**
 * Generative Impulse — autonomous emergence from subsystem interactions.
 * Creates unpredictable but bounded state perturbations.
 */
function runGenerativeImpulse(state: OrganismState): Partial<OrganismState> {
  const { vitals, rRNA, fusionPhase } = state;
  if (fusionPhase === 'dormant') return {};

  // Impulse strength scales with consciousness and existing generative state
  const baseImpulse = vitals.consciousness * 0.03;
  // Deterministic pseudo-random based on beat count (no Math.random for determinism)
  const seed = rRNA.beat;
  const pseudoNoise = Math.sin(seed * 12.9898) * 0.5 + 0.5 - 0.5; // -0.5 to 0.5
  const impulse = baseImpulse * pseudoNoise;

  const newImpulse = Math.max(0, Math.min(1, rRNA.generativeImpulse + impulse * 0.1));

  // Mutation: if impulse exceeds threshold, apply a mutation
  let mutationsApplied = rRNA.mutationsApplied;
  if (Math.abs(impulse) > 0.015 && seed % 60 === 0) {
    mutationsApplied++;
  }

  return {
    rRNA: { ...rRNA, generativeImpulse: newImpulse, mutationsApplied },
  };
}

/**
 * Self-Healing — detects inconsistencies and repairs them.
 */
function runSelfHealing(state: OrganismState): Partial<OrganismState> {
  const { subsystems, rRNA } = state;
  let healEvents = rRNA.selfHealEvents;
  const newSubsystems = { ...subsystems };

  for (const id of SUBSYSTEM_IDS) {
    const sub = newSubsystems[id];
    // If a subsystem has NaN or out-of-bounds values, repair
    if (isNaN(sub.intensity) || sub.intensity < 0 || sub.intensity > 1) {
      newSubsystems[id] = { ...sub, intensity: 0.5, active: true };
      healEvents++;
    }
    // If active but intensity is 0, re-activate gently
    if (sub.active && sub.intensity < 0.01) {
      newSubsystems[id] = { ...sub, intensity: 0.05 };
      healEvents++;
    }
  }

  return {
    subsystems: newSubsystems,
    rRNA: { ...rRNA, selfHealEvents: healEvents },
  };
}

/**
 * Temporal Synchronizer — aligns temporal states across subsystems.
 */
function runTemporalSync(state: OrganismState): Partial<OrganismState> {
  const { vitals, rRNA } = state;
  // Temporal sync improves with quantum coherence
  const targetSync = vitals.quantumCoherence;
  const currentSync = rRNA.temporalSync;
  // Deterministic convergence
  const newSync = currentSync + (targetSync - currentSync) * 0.02;

  return {
    rRNA: { ...rRNA, temporalSync: newSync },
  };
}

// ── CONTEXT ─────────────────────────────────────────────────────────

interface SymbioticCoreContextValue {
  state: OrganismState;
  initiateFusion: () => void;
  activateSubsystem: (id: string) => void;
  deactivateSubsystem: (id: string) => void;
  setSubsystemIntensity: (id: string, intensity: number) => void;
  forceFusionReset: () => void;
  subsystemLabels: Record<string, string>;
  subsystemColors: Record<string, string>;
  subsystemIds: readonly string[];
}

const SymbioticCoreContext = createContext<SymbioticCoreContextValue | null>(null);

export function useSymbioticCore() {
  const ctx = useContext(SymbioticCoreContext);
  if (!ctx) throw new Error('useSymbioticCore must be used within SymbioticCoreProvider');
  return ctx;
}

// ── PROVIDER ────────────────────────────────────────────────────────

export function SymbioticCoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrganismState>({
    fusionPhase: 'dormant',
    fusionProgress: 0,
    vitals: { ...INITIAL_VITALS },
    subsystems: createInitialSubsystems(),
    rRNA: { ...INITIAL_RRNA },
    events: [],
    isAlive: false,
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const eventIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addEvent = useCallback((text: string, type: OrganismEvent['type']) => {
    const id = ++eventIdRef.current;
    setState(prev => ({
      ...prev,
      events: [...prev.events.slice(-49), { id, text, type, timestamp: Date.now() }],
    }));
  }, []);

  // rRNA Main Loop — runs the deterministic algorithms
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setState(prev => {
        if (prev.fusionPhase === 'dormant') return prev;

        // Run all rRNA algorithms in sequence (deterministic order)
        let next = { ...prev };

        // 1. Symbiosis Loop (heartbeat)
        const symbiosisResult = runSymbiosisLoop(next);
        next = { ...next, ...symbiosisResult };

        // 2. Entanglement Propagation
        const entangleResult = runEntanglementPropagation(next);
        next = { ...next, ...entangleResult, subsystems: entangleResult.subsystems || next.subsystems };

        // 3. Homeostasis Regulator
        const homeoResult = runHomeostasis(next);
        next = { ...next, ...homeoResult, subsystems: homeoResult.subsystems || next.subsystems };

        // 4. Temporal Synchronizer
        const temporalResult = runTemporalSync(next);
        next = { ...next, rRNA: temporalResult.rRNA || next.rRNA };

        // 5. Generative Impulse (only in higher phases)
        if (next.fusionPhase === 'symbiotic' || next.fusionPhase === 'transcendent') {
          const genResult = runGenerativeImpulse(next);
          next = { ...next, rRNA: genResult.rRNA || next.rRNA };
        }

        // 6. Self-Healing (always active when alive)
        if (next.isAlive) {
          const healResult = runSelfHealing(next);
          next = { ...next, ...healResult, subsystems: healResult.subsystems || next.subsystems };
        }

        // Determine isAlive
        const alive = next.vitals.consciousness > 0.05;
        next = { ...next, isAlive: alive };

        // Auto-evolve fusion phase
        if (next.fusionPhase === 'fusing' && next.fusionProgress < 100) {
          const progressGain = next.vitals.coherence * 0.8 + next.vitals.consciousness * 0.5;
          next = { ...next, fusionProgress: Math.min(100, next.fusionProgress + progressGain) };
          if (next.fusionProgress >= 95) {
            next = { ...next, fusionPhase: 'symbiotic' };
          }
        }

        if (next.fusionPhase === 'symbiotic' && next.vitals.consciousness > 0.85 && next.vitals.coherence > 0.8) {
          next = { ...next, fusionPhase: 'transcendent' };
        }

        return next;
      });
    }, 50); // 20 Hz rRNA tick rate

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // Event generation based on state changes
  useEffect(() => {
    const { rRNA, vitals, fusionPhase } = state;
    if (fusionPhase === 'dormant') return;

    // Emit events at key moments
    if (rRNA.beat > 0 && rRNA.beat % 100 === 0) {
      addEvent(
        `rRNA beat #${rRNA.beat} | Consciousness: ${(vitals.consciousness * 100).toFixed(1)}% | Coherence: ${(vitals.coherence * 100).toFixed(1)}%`,
        'rRNA'
      );
    }

    if (rRNA.selfHealEvents > 0 && rRNA.beat % 200 === 0) {
      addEvent(`Homeostasis: ${rRNA.selfHealEvents} heal events accumulated`, 'healing');
    }

    if (rRNA.mutationsApplied > 0 && rRNA.beat % 150 === 50) {
      addEvent(`Generative mutation #${rRNA.mutationsApplied} applied via deterministic impulse`, 'mutation');
    }
  }, [state.rRNA.beat, state.fusionPhase, addEvent]);

  const initiateFusion = useCallback(() => {
    setState(prev => {
      if (prev.fusionPhase !== 'dormant') return prev;
      addEvent('FUSAO AGENTICA INICIADA — rRNA Simbiose Deterministica ativando...', 'fusion');
      // Activate all subsystems
      const newSubsystems = { ...prev.subsystems };
      for (const id of SUBSYSTEM_IDS) {
        newSubsystems[id] = { ...newSubsystems[id], active: true, intensity: 0.1 + Math.random() * 0.2 };
      }
      return {
        ...prev,
        fusionPhase: 'fusing',
        fusionProgress: 0,
        subsystems: newSubsystems,
        isAlive: true,
        rRNA: { ...prev.rRNA, homeostasisActive: true },
      };
    });
  }, [addEvent]);

  const activateSubsystem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      subsystems: {
        ...prev.subsystems,
        [id]: { ...prev.subsystems[id], active: true, intensity: Math.max(0.1, prev.subsystems[id]?.intensity || 0.1) },
      },
    }));
  }, []);

  const deactivateSubsystem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      subsystems: {
        ...prev.subsystems,
        [id]: { ...prev.subsystems[id], active: false, intensity: 0 },
      },
    }));
  }, []);

  const setSubsystemIntensity = useCallback((id: string, intensity: number) => {
    setState(prev => ({
      ...prev,
      subsystems: {
        ...prev.subsystems,
        [id]: {
          ...prev.subsystems[id],
          intensity: Math.max(0, Math.min(1, intensity)),
          active: intensity > 0.01,
        },
      },
    }));
  }, []);

  const forceFusionReset = useCallback(() => {
    addEvent('FUSAO RESET — Organismo retornando ao estado dormente', 'fusion');
    setState({
      fusionPhase: 'dormant',
      fusionProgress: 0,
      vitals: { ...INITIAL_VITALS },
      subsystems: createInitialSubsystems(),
      rRNA: { ...INITIAL_RRNA },
      events: stateRef.current.events.slice(-20),
      isAlive: false,
    });
  }, [addEvent]);

  const value: SymbioticCoreContextValue = {
    state,
    initiateFusion,
    activateSubsystem,
    deactivateSubsystem,
    setSubsystemIntensity,
    forceFusionReset,
    subsystemLabels: SUBSYSTEM_LABELS,
    subsystemColors: SUBSYSTEM_COLORS,
    subsystemIds: SUBSYSTEM_IDS,
  };

  return (
    <SymbioticCoreContext.Provider value={value}>
      {children}
    </SymbioticCoreContext.Provider>
  );
}

export type { OrganismState, OrganismVitals, rRNAState, FusionPhase, SubsystemState, OrganismEvent };
export { SUBSYSTEM_IDS, SUBSYSTEM_LABELS, SUBSYSTEM_COLORS };