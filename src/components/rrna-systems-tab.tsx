'use client';

import { Atom } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RrnaSystemsTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Atom className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-bold text-zinc-200">rRNA Systems</span>
        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">Em construcao</Badge>
      </div>
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardContent className="py-16 text-center">
          <Atom className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 text-sm font-bold mb-1">rRNA Molecular Systems</h3>
          <p className="text-zinc-600 text-[11px] max-w-md mx-auto">Sistemas de analise molecular inspirados em rRNA para processamento biologico de informacao.</p>
        </CardContent>
      </Card>
    </div>
  );
}