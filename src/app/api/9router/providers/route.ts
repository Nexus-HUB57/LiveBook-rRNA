import { NextResponse } from 'next/server';
import { listProviders, providerCount, providerCategories } from '@/lib/9router-engine/provider-registry';
import { getProviderStatus, getEngineInfo } from '@/lib/9router-bridge';

/** GET /api/9router/providers — List all providers with status */
export async function GET() {
  const providers = getProviderStatus();
  const engine = getEngineInfo();

  return NextResponse.json({
    engine,
    providers,
    summary: {
      total: providers.length,
      configured: providers.filter(p => p.configured).length,
      byFormat: providers.reduce((acc, p) => {
        acc[p.format] = (acc[p.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: providers.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    timestamp: new Date().toISOString(),
  });
}
