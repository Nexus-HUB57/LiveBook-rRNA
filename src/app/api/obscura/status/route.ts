/**
 * GET /api/obscura/status — Obscura engine status
 */
import { NextResponse } from 'next/server';
import { getObscuraStatus, obscuraCDPInfo, getMCPTools } from '@/lib/obscura/obscura-engine';

export async function GET() {
  const [status, cdpInfo] = await Promise.all([getObscuraStatus(), obscuraCDPInfo()]);
  const mcpTools = getMCPTools();
  return NextResponse.json({ status, cdpInfo, mcpTools });
}
