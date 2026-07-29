/**
 * CHIMERA v4.0 — MCP Demo Server
 * Provides demo tool definitions and handler functions for testing MCP tool discovery.
 */

// ─── MCP Tool Definition Format ───

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ─── Tool Definitions (MCP format) ───

export const DEMO_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a given city. Returns temperature, condition, and humidity.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'The city name to get weather for' },
      },
      required: ['city'],
    },
  },
  {
    name: 'calculate',
    description: 'Evaluate a simple mathematical expression and return the result. Supports +, -, *, /, parentheses, and common Math functions.',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'A math expression to evaluate, e.g. "2 + 3 * 4" or "Math.sqrt(16)"' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_time',
    description: 'Get the current date and time for a given timezone. Defaults to UTC if no timezone is provided.',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: { type: 'string', description: 'IANA timezone string, e.g. "America/New_York", "Europe/London"' },
      },
    },
  },
];

// ─── Handler Types ───

type ToolHandler = (args: Record<string, unknown>) => Promise<Record<string, unknown>>;

// ─── Handler Implementations ───

/** Safely evaluate a simple math expression */
function safeMathEval(expression: string): number {
  // Only allow: digits, operators (+-*/%), parentheses, spaces, dots, and Math.* functions
  const sanitized = expression.trim();
  const allowedPattern = /^[\d+\-*/%.()\s,Math.sqrtpowlceiltflopQAB]+$/;

  // Validate against dangerous patterns
  const dangerous = ['eval', 'function', 'constructor', 'prototype', '__proto__',
    'import', 'require', 'process', 'global', 'window', 'document', 'fetch',
    'async', 'await', 'return', 'var ', 'let ', 'const '];
  for (const d of dangerous) {
    if (sanitized.includes(d)) {
      throw new Error(`Expression contains disallowed pattern: ${d}`);
    }
  }

  // Use Function constructor in a restricted scope
  const fn = new Function(
    'Math',
    `"use strict"; return (${sanitized});`
  );
  const result = fn(Math);

  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('Expression did not produce a valid finite number');
  }
  return result;
}

const getWeatherHandler: ToolHandler = async (args) => {
  const city = args.city as string;
  if (!city || typeof city !== 'string') {
    throw new Error('"city" is required and must be a string');
  }
  return {
    city,
    temp: '25C',
    condition: 'sunny',
    humidity: 60,
  };
};

const calculateHandler: ToolHandler = async (args) => {
  const expression = args.expression as string;
  if (!expression || typeof expression !== 'string') {
    throw new Error('"expression" is required and must be a string');
  }
  const result = safeMathEval(expression);
  return { expression, result };
};

const getTimeHandler: ToolHandler = async (args) => {
  const timezone = (args.timezone as string) || 'UTC';
  return {
    timezone,
    datetime: new Date().toISOString(),
  };
};

// ─── Handler Map ───

export type MCPDemoHandlers = Record<string, ToolHandler>;

export function createMCPDemoHandlers(): MCPDemoHandlers {
  return {
    get_weather: getWeatherHandler,
    calculate: calculateHandler,
    get_time: getTimeHandler,
  };
}
