import { NextRequest, NextResponse } from 'next/server';
import {
  getInterceptState, setInterceptionEnabled, addInterceptRule,
  removeInterceptRule, toggleInterceptRule, clearInterceptHistory,
} from '@/lib/obscura/obscura-engine';

export async function GET() {
  return NextResponse.json(getInterceptState());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, enabled, pattern, name, resTypes, interceptAction, fulfillBody, fulfillStatus, ruleId } = body;

    switch (action) {
      case 'toggle':
        setInterceptionEnabled(enabled ?? true);
        return NextResponse.json({ success: true, ...getInterceptState() });
      case 'add-rule': {
        if (!pattern || !name) return NextResponse.json({ error: 'pattern and name required' }, { status: 400 });
        const rule = addInterceptRule({ name, pattern, resourceTypes: resTypes, action: interceptAction ?? 'block', fulfillBody, fulfillStatus, enabled: true });
        return NextResponse.json({ success: true, rule });
      }
      case 'remove-rule':
        if (!ruleId) return NextResponse.json({ error: 'ruleId required' }, { status: 400 });
        return NextResponse.json({ success: removeInterceptRule(ruleId) });
      case 'toggle-rule':
        if (!ruleId || enabled === undefined) return NextResponse.json({ error: 'ruleId and enabled required' }, { status: 400 });
        return NextResponse.json({ success: toggleInterceptRule(ruleId, enabled) });
      case 'clear-history':
        clearInterceptHistory();
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}