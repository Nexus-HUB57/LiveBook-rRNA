'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080b0d] text-zinc-100 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-200 mb-2">Erro no Sistema</h1>
          <p className="text-sm text-zinc-400 mb-1">
            Uma anomalia foi detectada no ecossistema. O motor de auto-cura sera acionado automaticamente.
          </p>
          {error.digest && (
            <p className="text-[10px] text-zinc-600 font-mono mt-2">Digest: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-red-600 hover:bg-red-500 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button asChild variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-200">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}