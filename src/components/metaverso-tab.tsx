'use client';

import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MetaversoTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-bold text-zinc-200">Metaverso</span>
        <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">Em construcao</Badge>
      </div>
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardContent className="py-16 text-center">
          <Globe className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 text-sm font-bold mb-1">Ambiente Metaverso</h3>
          <p className="text-zinc-600 text-[11px] max-w-md mx-auto">Espaco 3D imersivo para visualizacao e interacao com os agentes do ecossistema. Integracao com WebGL e WebXR.</p>
        </CardContent>
      </Card>
    </div>
  );
}