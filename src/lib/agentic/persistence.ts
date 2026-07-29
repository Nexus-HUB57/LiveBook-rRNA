/**
 * CHIMERA v4.0 — Agentic Persistence
 * Persists AgentLoop execution results (tasks, tool calls, steps, memories) to Prisma/SQLite.
 * All calls are designed to be fire-and-forget — errors are logged but never thrown.
 */

import { db } from '@/lib/db';
import type { Task, ToolCall, LoopStep, MemoryEntry, AgentLoopResult } from './types';

/**
 * Persist an AgenticTask record with execution results.
 * Returns the task ID (reuses the in-memory task ID for traceability).
 */
export async function persistTask(
  task: Task,
  result: AgentLoopResult,
): Promise<string> {
  const record = await db.agenticTask.create({
    data: {
      id: task.id,
      parentId: task.parentId ?? null,
      agentId: task.agentId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: result.success ? 'done' : 'failed',
      model: task.assignedModel,
      provider: task.assignedProvider,
      plan: task.plan ? JSON.stringify(task.plan) : null,
      result: JSON.stringify({ finalAnswer: result.finalAnswer }),
      error: result.success ? null : result.finalAnswer,
      metadata: task.metadata ? JSON.stringify(task.metadata) : '{}',
      totalSteps: result.steps.length,
      totalTokens: result.totalTokensUsed,
      totalCostUsd: result.costUsd,
      durationMs: result.totalDurationMs,
      completedAt: new Date(),
    },
  });
  return record.id;
}

/**
 * Persist a single ToolCall record.
 */
export async function persistToolCall(toolCall: ToolCall): Promise<void> {
  await db.agenticToolCall.create({
    data: {
      id: toolCall.id,
      taskId: toolCall.taskId,
      agentId: toolCall.agentId,
      toolId: toolCall.toolId,
      toolName: toolCall.toolId,
      arguments: JSON.stringify(toolCall.arguments),
      status: toolCall.status,
      result: toolCall.result != null ? JSON.stringify(toolCall.result) : null,
      error: toolCall.error ?? null,
      durationMs: toolCall.durationMs ?? 0,
      tokensUsed: toolCall.tokensUsed ?? 0,
    },
  });
}

/**
 * Persist a single LoopStep as an AgenticTaskStep record.
 */
export async function persistStep(
  step: LoopStep,
  taskId: string,
): Promise<void> {
  const statusMap: Record<LoopStep['type'], string> = {
    thinking: 'pending',
    tool_call: 'running',
    tool_result: 'success',
    observation: 'success',
    handoff: 'success',
    final_answer: 'success',
  };

  await db.agenticTaskStep.create({
    data: {
      taskId,
      stepNumber: step.iteration,
      action: `[${step.type}] ${step.content.slice(0, 120)}`,
      reasoning: step.content,
      observation: step.type === 'tool_result' || step.type === 'observation'
        ? step.content
        : null,
      status: statusMap[step.type] ?? 'pending',
      tokensUsed: step.tokensUsed ?? 0,
    },
  });
}

/**
 * Persist a single MemoryEntry as an AgenticMemory record.
 */
export async function persistMemory(memory: MemoryEntry): Promise<void> {
  await db.agenticMemory.create({
    data: {
      agentId: memory.agentId,
      taskId: memory.taskId ?? null,
      memoryType: memory.type,
      content: memory.content,
      importance: memory.importance,
      accessCount: memory.accessCount,
      metadata: memory.metadata ? JSON.stringify(memory.metadata) : '{}',
      expiresAt: memory.expiresAt ? new Date(memory.expiresAt) : null,
    },
  });
}

/**
 * Orchestrates full execution persistence:
 *  1. Persist the task record
 *  2. Persist each step that contains a tool call
 *  3. Persist all steps
 *  4. Returns the persisted task ID
 *
 * Designed to be called fire-and-forget. Errors are caught internally
 * and logged to console — they never propagate to the caller.
 */
export async function persistFullExecution(
  task: Task,
  result: AgentLoopResult,
): Promise<string> {
  try {
    // 1. Persist the task
    const taskId = await persistTask(task, result);

    // 2. Persist tool calls and steps in parallel batches
    const toolCallPromises: Promise<void>[] = [];
    const stepPromises: Promise<void>[] = [];

    for (const step of result.steps) {
      if (step.toolCall) {
        toolCallPromises.push(
          persistToolCall(step.toolCall).catch(() => {}),
        );
      }
      stepPromises.push(
        persistStep(step, taskId).catch(() => {}),
      );
    }

    await Promise.all([...toolCallPromises, ...stepPromises]);

    return taskId;
  } catch (err) {
    console.error('[CHIMERA] persistFullExecution failed:', err);
    // Return the original task ID so callers still have a reference
    return task.id;
  }
}
