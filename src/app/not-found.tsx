'use client';

import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080b0d] text-zinc-100 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-zinc-200 mb-2">404</h1>
          <p className="text-sm text-zinc-400">
            Rota nao encontrada no ecossistema CHIMERA. Esta dimensao nao existe ou foi desativada.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retornar ao Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}