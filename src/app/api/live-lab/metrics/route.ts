import { NextResponse } from 'next/server';
import { metrics } from '@/lib/observability';

export async function GET() {
  const promText = metrics.getMetricsPrometheus();
  return new NextResponse(promText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
