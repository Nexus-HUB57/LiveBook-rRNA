'use client';

import { Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GovernanceTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-zinc-200">Governanca</span>
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">Em construcao</Badge>
      </div>
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardContent className="py-16 text-center">
          <Landmark className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 text-sm font-bold mb-1">Sistema de Governanca</h3>
          <p className="text-zinc-600 text-[11px] max-w-md mx-auto">Governanca descentralizada com votacao, propostas e execucao automatica de decisoes.</p>
        </CardContent>
      </Card>
    </div>
  );
}