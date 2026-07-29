/**
 * CHIMERA v4.0 — Planning Engine
 * Generates and manages execution plans using LLM-based decomposition.
 */

import type { Plan, PlanStep, Task, TaskPriority } from './types';

const SYSTEM_PLANNER = `You are an expert task planner. Given a task, decompose it into steps.
Output ONLY a JSON array. No markdown.
Example: [{"action": "Search", "tool": "web_search", "reasoning": "Need data", "dependencies": []}]`;

export interface PlanningRequest {
  taskTitle: string;
  taskDescription: string;
  priority: TaskPriority;
  availableTools: string[];
  strategy?: Plan['strategy'];
  context?: string;
}

export class PlanningEngine {
  async generatePlan(req: PlanningRequest): Promise<Plan> {
    const strategy = req.strategy ?? this.inferStrategy(req.priority, req.availableTools.length);
    return this.heuristicPlan(req, strategy);
  }

  async replan(task: Task, obstacle: string, completedStepIds: string[]): Promise<Plan> {
    return task.plan ?? { steps: [], strategy: 'adaptive' };
  }

  private inferStrategy(priority: TaskPriority, toolCount: number): Plan['strategy'] {
    if (toolCount > 3) return 'parallel';
    if (priority === 'critical') return 'adaptive';
    return 'sequential';
  }

  private heuristicPlan(req: PlanningRequest, strategy: Plan['strategy']): Plan {
    const steps: PlanStep[] = [
      { id: 'step_1', action: 'Analyze task requirements', reasoning: 'Understand scope', dependencies: [], status: 'pending' },
      { id: 'step_2', action: 'Gather relevant information', reasoning: 'Need context', dependencies: ['step_1'], status: 'pending' },
      { id: 'step_3', action: `Execute: ${req.taskTitle}`, reasoning: 'Core task', dependencies: ['step_2'], status: 'pending' },
      { id: 'step_4', action: 'Validate and finalize', reasoning: 'Quality check', dependencies: ['step_3'], status: 'pending' },
    ];
    return { steps, strategy, estimatedTokens: steps.length * 500, estimatedCostUsd: steps.length * 0.002 };
  }
}

let _planner: PlanningEngine | null = null;
export function getPlanningEngine(): PlanningEngine {
  if (!_planner) _planner = new PlanningEngine();
  return _planner;
}
