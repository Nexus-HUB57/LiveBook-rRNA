'use client';

import { useState, useEffect } from 'react';
import { Atom, Search, FileText, Database, Cpu, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RAGResult {
  title: string;
  source: string;
  agent: string;
  score: number;
  chunkType: string;
}

const PIPELINE_STAGES = [
  { name: 'Extract', desc: 'Chunking recursivo estilo Langchain', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Encode', desc: 'TF-IDF + N-gram expansion', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Retrieve', desc: 'BM25 scoring com field boosting', icon: Search, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { name: 'Rerank', desc: 'Cross-encoder re-ranking por relevancia', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { name: 'Augment', desc: 'Context window com source attribution', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { name: 'Generate', desc: 'Sintese LLM com RAG prompt template', icon: Cpu, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
];

export default function RrnaSystemsTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGResult[]>([]);
  const [answer, setAnswer] = useState('');
  const [pipeline, setPipeline] = useState<{ documentsScanned: number; retrieved: number; reranked: number; contextChars: number } | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const executeQuery = async () => {
    if (!query.trim() || isQuerying) return;
    setIsQuerying(true);
    setResults([]);
    setAnswer('');
    setPipeline(null);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 }),
      });
      const data = await res.json();
      setResults(data.retrieved || []);
      setAnswer(data.answer || '');
      setPipeline(data.pipeline || null);
    } catch {
      setAnswer('Erro ao conectar com o motor RAG. Verifique se o servidor esta rodando.');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Atom className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-bold text-zinc-200">rRNA Systems</span>
        <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">Pipeline 6 Estagios</Badge>
      </div>

      {/* Pipeline Visualization */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Atom className="w-3.5 h-3.5 text-rose-400" /> Pipeline RAG rRNA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {PIPELINE_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <motion.div key={stage.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className={cn("p-3 rounded-xl border text-center space-y-1.5", stage.bg)}>
                    <Icon className={cn("w-5 h-5 mx-auto", stage.color)} />
                    <div className="text-[10px] font-bold text-zinc-200">{stage.name}</div>
                    <div className="text-[9px] text-zinc-500 leading-tight">{stage.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Query Interface */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Consulta RAG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeQuery()}
                placeholder="Pergunte sobre orquestracao, Bitcoin, RAG, agentes..."
                className="h-9 pl-8 text-[11px] bg-zinc-800/50 border-zinc-700/60" />
            </div>
            <Button size="sm" className="h-9 text-[11px] bg-rose-600 hover:bg-rose-500 text-white" onClick={executeQuery} disabled={isQuerying}>
              {isQuerying ? 'Buscando...' : 'Consultar'}
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {(results.length > 0 || answer) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {pipeline && (
                  <div className="flex gap-3 text-[9px] text-zinc-600">
                    <span>Documentos: {pipeline.documentsScanned}</span>
                    <span>Recuperados: {pipeline.retrieved}</span>
                    <span>Rerankeds: {pipeline.reranked}</span>
                    <span>Contexto: {pipeline.contextChars} chars</span>
                  </div>
                )}
                {answer && (
                  <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/20">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Resposta</div>
                    <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{answer}</div>
                  </div>
                )}
                {results.length > 0 && (
                  <div className="space-y-1.5">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/20 border border-zinc-700/10 hover:border-zinc-700/30 transition-colors">
                        <span className="text-[9px] text-zinc-600 font-mono w-4 text-right">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-zinc-300 font-medium truncate">{r.title}</div>
                          <div className="text-[9px] text-zinc-600">{r.agent} · {r.source}</div>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/20 bg-amber-500/5">
                          {r.score}
                        </Badge>
                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}