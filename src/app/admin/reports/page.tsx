"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ReportData {
  ticker: string;
  status: 'ANALISADO' | 'PENDENTE';
  score?: number | string;
  timestamp: string;
  key: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'today'>('all');
  const [loading, setLoading] = useState(true);

  const scanLocalStorage = () => {
    setLoading(true);
    const foundReports: ReportData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        const data = JSON.parse(value);
        
        // Pattern detection: check for analysis indicators or ticker-like keys
        const isAnalysis = data.score !== undefined || data.rating !== undefined || data.analysis !== undefined || data.aiRating !== undefined;
        const isPriceCache = key.startsWith('price_cache_');
        
        if (isAnalysis || isPriceCache) {
          const ticker = data.ticker || key.replace('price_cache_', '').toUpperCase();
          const timestamp = data.timestamp || data.date || data.lastUpdate || new Date().toISOString();
          const hasFullAnalysis = data.analysis || data.aiReview || data.reportHtmlContent;

          foundReports.push({
            ticker,
            status: hasFullAnalysis ? 'ANALISADO' : 'PENDENTE',
            score: data.score || data.aiRating || '—',
            timestamp: timestamp,
            key: key
          });
        }
      } catch (e) {
        // Not a JSON object or irrelevant data
      }
    }

    setReports(foundReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    // Admin Security Check
    const adminPass = prompt("SISTEMA RASTRO // CHAVE DE ACESSO ADMIN:");
    if (adminPass !== 'RASTRO_ADMIN_2026') {
      alert("ACESSO NEGADO // REDIRECIONANDO...");
      window.location.href = '/';
      return;
    }
    scanLocalStorage();
  }, []);

  const clearCacheItem = (key: string) => {
    if (confirm(`Deseja realmente limpar o cache de ${key}?`)) {
      localStorage.removeItem(key);
      scanLocalStorage();
    }
  };

  const forceFullScan = () => {
    scanLocalStorage();
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'pending') return r.status === 'PENDENTE';
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return r.timestamp.startsWith(today);
    }
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR');
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-8 selection:bg-emerald-500/30">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-emerald-500 text-3xl font-black tracking-tighter uppercase mb-2">
            SYSTEM ADMIN // <span className="text-white">RELATÓRIOS DE INTELIGÊNCIA</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">
            Monitoramento de Cobertura de IA e Integridade de Dados // v1.0.4
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={forceFullScan}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 px-4 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Forçar Varredura Total
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* FILTROS */}
        <div className="flex gap-2 mb-8">
          {(['all', 'pending', 'today'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === f 
                  ? 'bg-emerald-500 border-emerald-500 text-black' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Sem Análise' : 'Atualizados Hoje'}
            </button>
          ))}
        </div>

        {/* TABELA TERMINAL */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ativo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Nota IA</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Última Atualização</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.key} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-white font-black text-sm tracking-tighter">{report.ticker}</span>
                      </td>
                      <td className="px-6 py-4">
                        {report.status === 'ANALISADO' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            ANALISADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            PENDENTE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-black ${report.score !== '—' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                          {report.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatDate(report.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => clearCacheItem(report.key)}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          title="Limpar Cache"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-zinc-600 text-xs italic tracking-widest uppercase">
                      Nenhum relatório encontrado no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-lg">
            <span className="block text-[9px] text-zinc-500 mb-1 font-black uppercase tracking-widest">Base de Dados</span>
            <span className="text-2xl font-black text-white">{reports.length} <span className="text-zinc-700 text-sm">ATIVOS</span></span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-lg">
            <span className="block text-[9px] text-zinc-500 mb-1 font-black uppercase tracking-widest">Cobertura Atual</span>
            <span className="text-2xl font-black text-emerald-500">
              {Math.round((reports.filter(r => r.status === 'ANALISADO').length / (reports.length || 1)) * 100)}%
            </span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-lg">
            <span className="block text-[9px] text-zinc-500 mb-1 font-black uppercase tracking-widest">Status da Memória</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Sincronizado via LocalStorage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
