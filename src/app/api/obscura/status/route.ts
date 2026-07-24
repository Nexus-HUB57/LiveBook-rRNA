import { NextResponse } from 'next/server';
import {
  getObscuraStatus, obscuraCDPInfo, getMCPTools, getServeState,
  getInterceptState, getTrackerStats, getProxyConfig, getCDPSessions, getNetworkLog,
} from '@/lib/obscura/obscura-engine';

export async function GET() {
  const [status, cdpInfo] = await Promise.all([getObscuraStatus(), obscuraCDPInfo()]);
  return NextResponse.json({
    status, cdpInfo, mcpTools: getMCPTools(),
    serve: getServeState(), interception: getInterceptState(),
    trackers: getTrackerStats(), proxy: getProxyConfig(),
    sessions: getCDPSessions(), network: getNetworkLog(),
  });
}
