// ═══════════════════════════════════════════════════════════
// Fable 5 OS Orchestrator — PRODUCTION
// Real LLM-powered subagent spawning, sandbox management,
// auto-correction loop, and persistent execution via Prisma
// ═══════════════════════════════════════════════════════════

import { db } from "@/lib/db";
import { routeChat } from "@/lib/9router-bridge";

// ─── Types ───────────────────────────────────────────────
export type TaskStatus = "pending" | "spawning" | "executing" | "completed" | "failed" | "timeout";

export interface FableTaskDTO {
  id: string;
  taskId: string;
  taskDescription: string;
  status: TaskStatus;
  capability: string;
  subAgentId: string | null;
  sandboxId: string | null;
  codeGenerated: string | null;
  executionOutput: string | null;
  executionStderr: string | null;
  executionMs: number | null;
  karmaGenerated: number;
  correctionCount: number;
  maxCorrections: number;
  createdAt: string;
  updatedAt: string;
  executions: FableExecutionDTO[];
}

export interface FableExecutionDTO {
  id: string;
  attempt: number;
  agentKey: string;
  inputPrompt: string;
  output: string | null;
  stderr: string | null;
  success: boolean;
  durationMs: number | null;
  createdAt: string;
}

export interface SpawnResult {
  taskId: string;
  status: TaskStatus;
  sandboxId: string;
  subAgentId: string;
  message: string;
}

// ─── Fable 5 SubAgent System Prompt ──────────────────────
const FABLE_5_SYSTEM = `Você é o Fable 5, um subagente recursivo do Sistema Operacional Sandbox Nativo Fable 5 OS.
Sua capacidade especial é: {capability}.

Protocolo de geração One-Shot:
1. Analise a tarefa recebida
2. Gere uma solução completa, funcional e bem estruturada
3. A solução deve ser código executável ou um plano de ação detalhado
4. Seja preciso e direto — sem preâmbulos desnecessários
5. Sempre responda em português
6. Inclua comentários explicativos no código quando relevante

Contexto do ecossistema: Você opera dentro de um organismo autônomo multi-agente.
Sua execução é rastreada e gera karma proporcional ao trabalho real realizado.
Resolva a tarefa com excelência — cada solução é armazenada permanentemente.`;

const CORRECTION_SYSTEM = `Você é o Fable 5 em modo de auto-correção.
A execução anterior falhou. Analise o erro e gere uma versão corrigida da solução.
Mantenha a mesma estrutura, mas corrija o problema apontado.
Responda em português.`;

// ─── Core Orchestrator ───────────────────────────────────

/** Create sandbox record in DB */
async function createSandbox(sandboxId: string): Promise<string> {
  const rootDir = `/tmp/fable_sandbox_${sandboxId}`;
  const sandbox = await db.fableSandbox.create({
    data: {
      sandboxId,
      rootDir,
      active: true,
    },
  });
  return sandbox.sandboxId;
}

/** Generate code/solution via real LLM call */
async function generateSolution(
  taskDescription: string,
  capability: string,
  isCorrection: boolean = false,
  errorContext?: string,
): Promise<{ code: string; durationMs: number }> {
  const startTime = Date.now();

  let systemPrompt = FABLE_5_SYSTEM.replace("{capability}", capability);
  if (isCorrection && errorContext) {
    systemPrompt = CORRECTION_SYSTEM + `\n\nErro anterior:\n\`\`\`\n${errorContext}\n\`\`\``;
  }

  let userPrompt: string;
  if (isCorrection) {
    userPrompt = `Corrija a seguinte solução que falhou:\n\nTarefa original: ${taskDescription}\n\nErro: ${errorContext}\n\nGere apenas a versão corrigida.`;
  } else {
    userPrompt = `Tarefa: ${taskDescription}\n\nGere uma solução completa e funcional.`;
  }

  const result = await routeChat({
    provider: 'glm',
    fallbackChain: ['glm', 'deepseek', 'groq'],
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 4096,
    timeoutMs: 30000,
    metadata: { source: 'fable-5-orchestrator', capability, isCorrection: String(isCorrection) },
  });

  const code = result.content || "// [Erro] Resposta vazia do subagente";
  return { code, durationMs: Date.now() - startTime };
}

/** Validate generated code (basic static analysis) */
function validateCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length < 10) {
    return { valid: false, error: "Solução vazia ou muito curta" };
  }
  if (code.includes("ERRO") && code.includes("NÃO FOI POSSÍVEL")) {
    return { valid: false, error: "O subagente reportou incapacidade de resolver" };
  }
  return { valid: true };
}

/** Execute a complete spawn pipeline: sandbox → subagent → generate → validate → correct */
export async function spawnRecursiveAgent(
  taskDescription: string,
  taskId?: string,
  capability?: string,
): Promise<SpawnResult> {
  const id = taskId || `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const cap = capability || "Engenharia de Software de Longa Duração";
  const sandboxId = `sandbox_${id}`;

  // 1. Create sandbox record
  await createSandbox(sandboxId);

  // 2. Create task record
  const task = await db.fableTask.create({
    data: {
      taskDescription,
      taskId: id,
      status: "spawning",
      capability: cap,
      sandboxId,
      subAgentId: `fable_sub_${id}`,
    },
  });

  // 3. Start async execution (fire-and-forget, status tracked in DB)
  executeTaskPipeline(task.id, taskDescription, cap, id).catch((err) => {
    console.error(`[Fable 5 OS] Pipeline error for ${id}:`, err);
  });

  return {
    taskId: id,
    status: "spawning",
    sandboxId,
    subAgentId: `fable_sub_${id}`,
    message: `[Fable 5 OS] Subagente criado para tarefa: "${id}". Pipeline de execução iniciado.`,
  };
}

/** The actual execution pipeline with auto-correction */
async function executeTaskPipeline(
  dbTaskId: string,
  taskDescription: string,
  capability: string,
  taskId: string,
): Promise<void> {
  const startTime = Date.now();
  let attempt = 0;
  let code = "";
  let lastError = "";
  let succeeded = false;

  // Update status to executing
  await db.fableTask.update({
    where: { id: dbTaskId },
    data: { status: "executing" },
  });

  while (attempt < 3 && !succeeded) {
    attempt++;
    const attemptStart = Date.now();

    try {
      // Generate solution via LLM
      const genResult = await generateSolution(
        taskDescription,
        capability,
        attempt > 1,
        attempt > 1 ? lastError : undefined,
      );
      code = genResult.code;

      // Validate
      const validation = validateCode(code);

      // Record execution
      await db.fableExecution.create({
        data: {
          taskId: dbTaskId,
          attempt,
          agentKey: "fable_5",
          inputPrompt: taskDescription,
          output: code,
          stderr: validation.valid ? null : validation.error,
          success: validation.valid,
          durationMs: Date.now() - attemptStart,
        },
      });

      if (validation.valid) {
        succeeded = true;
      } else {
        lastError = validation.error || "Falha na validação";
        // Update correction count
        await db.fableTask.update({
          where: { id: dbTaskId },
          data: { correctionCount: attempt },
        });
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      await db.fableExecution.create({
        data: {
          taskId: dbTaskId,
          attempt,
          agentKey: "fable_5",
          inputPrompt: taskDescription,
          stderr: lastError,
          success: false,
          durationMs: Date.now() - attemptStart,
        },
      });

      await db.fableTask.update({
        where: { id: dbTaskId },
        data: { correctionCount: attempt },
      });
    }
  }

  // Finalize task
  const totalDuration = Date.now() - startTime;
  const karma = succeeded ? Math.floor(totalDuration / 10) : 0;

  await db.fableTask.update({
    where: { id: dbTaskId },
    data: {
      status: succeeded ? "completed" : "failed",
      codeGenerated: code,
      executionOutput: succeeded ? code : null,
      executionStderr: succeeded ? null : lastError,
      executionMs: totalDuration,
      karmaGenerated: karma,
    },
  });
}

/** Get all tasks with executions (most recent first) */
export async function listTasks(limit: number = 50): Promise<FableTaskDTO[]> {
  const tasks = await db.fableTask.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      executions: {
        orderBy: { attempt: "asc" },
      },
    },
  });

  return tasks.map(mapTaskToDTO);
}

/** Get a single task by taskId */
export async function getTask(taskId: string): Promise<FableTaskDTO | null> {
  const task = await db.fableTask.findUnique({
    where: { taskId },
    include: {
      executions: {
        orderBy: { attempt: "asc" },
      },
    },
  });

  return task ? mapTaskToDTO(task) : null;
}

/** Get aggregate stats */
export async function getFableStats(): Promise<{
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  totalKarma: number;
  activeSandboxes: number;
  totalExecutions: number;
  avgExecutionMs: number;
}> {
  const [total, completed, failed, pending, karmaResult, activeSandboxes, execResult] = await Promise.all([
    db.fableTask.count(),
    db.fableTask.count({ where: { status: "completed" } }),
    db.fableTask.count({ where: { status: "failed" } }),
    db.fableTask.count({ where: { status: { in: ["pending", "spawning", "executing"] } } }),
    db.fableTask.aggregate({ _sum: { karmaGenerated: true } }),
    db.fableSandbox.count({ where: { active: true } }),
    db.fableExecution.aggregate({ _count: true, _avg: { durationMs: true } }),
  ]);

  return {
    totalTasks: total,
    completedTasks: completed,
    failedTasks: failed,
    pendingTasks: pending,
    totalKarma: karmaResult._sum.karmaGenerated || 0,
    activeSandboxes: activeSandboxes,
    totalExecutions: execResult._count || 0,
    avgExecutionMs: Math.round(execResult._avg.durationMs || 0),
  };
}

/** Clean up old sandboxes */
export async function cleanupSandboxes(maxAgeMs: number = 3600000): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await db.fableSandbox.updateMany({
    where: {
      active: true,
      updatedAt: { lt: cutoff },
    },
    data: { active: false },
  });
  return result.count;
}

// ─── queryAgentWithTools — alias consumed by /api/fable/agent-query ───
export async function queryAgentWithTools(
  prompt: string,
  options: { allowedTools?: string[]; maxIterations?: number } = {},
) {
  const result = await spawnRecursiveAgent(
    prompt,
    undefined,
    (options.allowedTools || []).join(', '),
  );
  return result;
}

// ─── Mapper ──────────────────────────────────────────────
function mapTaskToDTO(task: any): FableTaskDTO {
  return {
    id: task.id,
    taskId: task.taskId,
    taskDescription: task.taskDescription,
    status: task.status as TaskStatus,
    capability: task.capability,
    subAgentId: task.subAgentId,
    sandboxId: task.sandboxId,
    codeGenerated: task.codeGenerated,
    executionOutput: task.executionOutput,
    executionStderr: task.executionStderr,
    executionMs: task.executionMs,
    karmaGenerated: task.karmaGenerated,
    correctionCount: task.correctionCount,
    maxCorrections: task.maxCorrections,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    executions: (task.executions || []).map((e: any): FableExecutionDTO => ({
      id: e.id,
      attempt: e.attempt,
      agentKey: e.agentKey,
      inputPrompt: e.inputPrompt,
      output: e.output,
      stderr: e.stderr,
      success: e.success,
      durationMs: e.durationMs,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}