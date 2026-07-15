'use client';

import { Dna } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RecuperacaoTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Dna className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-zinc-200">Recuperacao</span>
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Em construcao</Badge>
      </div>
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardContent className="py-16 text-center">
          <Dna className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 text-sm font-bold mb-1">Sistema de Recuperacao</h3>
          <p className="text-zinc-600 text-[11px] max-w-md mx-auto">Recuperacao de dados, backup automatico e restauracao de estado dos agentes.</p>
        </CardContent>
      </Card>
    </div>
  );
}