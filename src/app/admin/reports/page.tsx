"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, CheckCircle2, Clock, Search, ArrowUpDown, RefreshCw, Activity, Database, Percent, ShieldCheck, Zap, Home, Users } from 'lucide-react';
import { assetsDatabase, Asset } from '@/lib/data';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

interface ReportStatus {
  [key: string]: 'GERADO' | 'PENDENTE';
}

// Global utility for ticker normalization
const cleanTicker = (k: string) => {
  if (!k) return '';
  let c = k.toUpperCase().trim();

  // 1. Remove parênteses e extensões comuns
  c = c.replace(/[()]/g, '');
  c = c.replace(/\.(HTML|HTM|PDF)$/, '');

  // 2. Remove todos os prefixos de cache conhecidos
  c = c.replace(/^(AI_RATING_|ANALYSIS_|REPORT_|CHAT_HISTORY_|SENTIMENT_CACHE_|HEALTH_CACHE_|FAIR_PRICE_CACHE_|PULSE_CACHE_|ONCHAIN_CACHE_|SOLIDITY_EVAL_|PRICE_CACHE_)/, '');

  // 3. Remove sufixo de versão de cache (ex: _V12345)
  c = c.replace(/_V\d+$/, '');

  // 4. Remove sufixos de mercado apenas no final da string
  c = c.replace(/\.SA$/, '');
  c = c.replace(/-?USD$/, '');

  // 5. Limpa símbolos e separa números se necessário (PETR4 -> PETR4)
  c = c.replace(/[^A-Z0-9]/g, '');

  return c;
};

export default function AdminReportsPage() {
  const { user, hasMounted } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'B3' | 'EUA' | 'Criptomoedas'>('Todos');
  const [reportStatus, setReportStatus] = useState<ReportStatus>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [reportDataMap, setReportDataMap] = useState<Record<string, any>>({});
  const [availableReportFiles, setAvailableReportFiles] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    coverage: 0,
    memory: 0,
    categories: {
      B3: { total: 0, current: 0 },
      EUA: { total: 0, current: 0 },
      Cripto: { total: 0, current: 0 }
    }
  });

  const addLog = (action: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newLog = `[${timestamp}] ${action}`;
    const updatedLogs = [newLog, ...activityLogs].slice(0, 8);
    setActivityLogs(updatedLogs);
    sessionStorage.setItem('admin_activity_logs', JSON.stringify(updatedLogs));
  };

  const checkReports = async () => {
    setIsRefreshing(true);
    const status: ReportStatus = {};
    let coverageCount = 0;
    let memoryUsage = 0;
    const catStats = {
      B3: { total: 0, current: 0 },
      EUA: { total: 0, current: 0 },
      Cripto: { total: 0, current: 0 }
    };

    // Scan localStorage once to gather all analyzed tickers
    const analyzedNormalizedTickers = new Set<string>();
    const localDataMap: Record<string, any> = {};

    // 1. Fetch available report files from server
    const fileNormalized = new Set<string>();
    try {
      const resp = await fetch('/api/admin/reports-meta');
      const data = await resp.json();
      if (data.files) {
        data.files.forEach((f: string) => {
          const norm = cleanTicker(f);
          if (norm) fileNormalized.add(norm);
        });
        setAvailableReportFiles(fileNormalized);
      }
    } catch (e) {
      console.error("Erro ao carregar meta-relatórios:", e);
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const keyUpper = key.toUpperCase();
      const isReportKey = keyUpper.startsWith('AI_RATING_') ||
        keyUpper.startsWith('ANALYSIS_') ||
        keyUpper.startsWith('REPORT_') ||
        keyUpper.startsWith('CHAT_HISTORY_') ||
        keyUpper.startsWith('HEALTH_CACHE_') ||
        keyUpper.startsWith('SENTIMENT_CACHE_') ||
        keyUpper.startsWith('FAIR_PRICE_CACHE_') ||
        keyUpper.startsWith('PULSE_CACHE_') ||
        keyUpper.startsWith('SOLIDITY_EVAL_');

      if (isReportKey) {
        const normalized = cleanTicker(key);
        if (normalized) {
          analyzedNormalizedTickers.add(normalized);
          const rawData = localStorage.getItem(key) || "";

          // Inicializa se não existir
          if (!localDataMap[normalized]) {
            localDataMap[normalized] = { _totalLength: 0 };
          }

          try {
            const parsed = JSON.parse(rawData);
            // Faz MERGE dos dados para não perder o texto quando encontrar o score
            localDataMap[normalized] = {
              ...localDataMap[normalized],
              ...parsed,
              _totalLength: localDataMap[normalized]._totalLength + rawData.length
            };
          } catch (e) {
            localDataMap[normalized]._totalLength += rawData.length;
          }
        }
      }
    }

    console.log('Chaves encontradas:', analyzedNormalizedTickers.size);

    assetsDatabase.forEach(asset => {
      // Logic for categorization (B3, EUA, Cripto)
      let category: keyof typeof catStats = 'B3';
      if (asset.exchange === 'NASDAQ' || asset.exchange === 'NYSE') {
        category = 'EUA';
      } else if (!!asset.cgId || asset.sector === 'Criptomoedas') {
        category = 'Cripto';
      } else if (asset.exchange === 'B3' || asset.ticker.endsWith('.SA')) {
        category = 'B3';
      }

      catStats[category].total++;

      const assetNormalized = cleanTicker(asset.ticker);
      const hasAi = analyzedNormalizedTickers.has(assetNormalized);
      const hasFile = fileNormalized.has(assetNormalized);
      const reportData = localDataMap[assetNormalized];

      // O usuário deseja que o status "GERADO" dependa da existência de um arquivo de relatório.
      // Se houver IA E houver o arquivo correspondente, marcamos como GERADO.
      // Caso contrário (apenas pulse ou sem nada), fica PENDENTE.
      const isFullReport = hasAi && hasFile;

      if (isFullReport) {
        status[asset.ticker] = 'GERADO';
      } else {
        status[asset.ticker] = 'PENDENTE';
      }

      if (isFullReport) {
        coverageCount++;
        const dataStr = typeof reportData === 'string' ? reportData : JSON.stringify(reportData || {});
        memoryUsage += (dataStr.length * 2) / 1024;
        catStats[category].current++;
      }
    });

    setReportStatus(status);
    setReportDataMap(localDataMap);
    setStats({
      total: assetsDatabase.length,
      coverage: coverageCount,
      memory: Math.round(memoryUsage * 100) / 100,
      categories: catStats
    });

    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    if (!hasMounted) return;

    // Admin via custom auth system
    if (user?.email === 'carvalhodlucas@hotmail.com') {
      setIsAuthenticated(true);
      checkReports();
      return;
    }

    // Fallback: Manual password prompt
    const adminPass = prompt("SISTEMA RASTRO // CHAVE DE ACESSO ADMIN:");
    if (adminPass === 'RASTRO_ADMIN_2026') {
      setIsAuthenticated(true);
      checkReports();
    } else {
      alert("ACESSO NEGADO // REDIRECIONANDO...");
      router.push('/');
    }
  }, [hasMounted, user, router]);

  // Carregar logs do sessionStorage
  useEffect(() => {
    const savedLogs = sessionStorage.getItem('admin_activity_logs');
    if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
  }, []);

  // Handle SSR / Initial Mount avoid hydration mismatches
  if (!hasMounted) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  // Not authenticated yet - show nothing or a loading state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-zinc-500 animate-pulse font-black uppercase tracking-[0.3em]">
          VERIFICANDO CREDENCIAIS...
        </div>
      </div>
    );
  }

  const deleteReport = (ticker: string) => {
    const baseTicker = cleanTicker(ticker);
    const keys = [
      `ai_rating_${baseTicker}`,
      `analysis_${baseTicker}`,
      `report_${baseTicker}`,
      `chat_history_${baseTicker}`,
      `health_cache_${baseTicker}`,
      `sentiment_cache_${baseTicker}`,
      `fair_price_cache_${baseTicker}`,
      `pulse_cache_${baseTicker}`,
      `onchain_cache_${baseTicker}`,
      `solidity_eval_${baseTicker}`,
      `price_cache_${baseTicker}`
    ];

    if (confirm(`Deseja realmente apagar o relatório de ${ticker}?`)) {
      keys.forEach(key => localStorage.removeItem(key));
      addLog(`REMOVIDO: Relatório de ${ticker} excluído.`);
      checkReports();
    }
  };

  const handleResetAsset = (ticker: string) => {
    const baseTicker = cleanTicker(ticker);
    const keys = [
      `ai_rating_${baseTicker}`,
      `analysis_${baseTicker}`,
      `report_${baseTicker}`,
      `chat_history_${baseTicker}`,
      `health_cache_${baseTicker}`,
      `sentiment_cache_${baseTicker}`,
      `fair_price_cache_${baseTicker}`,
      `pulse_cache_${baseTicker}`,
      `onchain_cache_${baseTicker}`,
      `solidity_eval_${baseTicker}`,
      `price_cache_${baseTicker}`
    ];
    // Adiciona também chaves com sufixo de versão se existirem no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (cleanTicker(key) === baseTicker) {
        keys.push(key);
      }
    }

    if (confirm(`Deseja resetar TODOS os dados (IA, Preço e Análise) de ${ticker}?`)) {
      keys.forEach(key => localStorage.removeItem(key));
      addLog(`RESETADO: Dados e cache de ${ticker} resetados.`);
      checkReports();
    }
  };

  const clearAllReports = () => {
    if (confirm("ATENÇÃO: Deseja apagar TODOS os relatórios e caches de preço? Esta ação é irreversível.")) {
      const keys = Object.keys(localStorage);
      let count = 0;
      keys.forEach(key => {
        if (key.includes('ai_rating') || key.includes('price_cache') || key.includes('analysis') || key.startsWith('chat_history_')) {
          localStorage.removeItem(key);
          count++;
        }
      });
      alert(`${count} chaves removidas do sistema. Reiniciando...`);
      window.location.reload();
    }
  };

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder(null);
  };

  const filteredAssets = assetsDatabase
    .filter(asset => {
      // Category Filter
      let matchesCategory = true;
      if (selectedCategory === 'B3') {
        matchesCategory = asset.exchange === 'B3' || asset.ticker.endsWith('.SA');
      } else if (selectedCategory === 'EUA') {
        matchesCategory = asset.exchange === 'NASDAQ' || asset.exchange === 'NYSE';
      } else if (selectedCategory === 'Criptomoedas') {
        matchesCategory = !!asset.cgId || asset.sector === 'Criptomoedas';
      }

      // Search Filter
      const matchesSearch = asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (!sortOrder) return 0;
      const statusA = reportStatus[a.ticker] ? 1 : 0;
      const statusB = reportStatus[b.ticker] ? 1 : 0;
      return sortOrder === 'desc' ? statusB - statusA : statusA - statusB;
    });

  const coveragePercentage = stats.total > 0 ? Math.round((stats.coverage / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-8 selection:bg-emerald-500/30" suppressHydrationWarning={true}>
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-900 pb-8 gap-6">
        <div>
          <h1 className="text-emerald-500 text-3xl font-black tracking-tighter uppercase mb-2 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            SYSTEM ADMIN // <span className="text-white">REPORTS DASHBOARD</span>
          </h1>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">
            Monitoramento de Cobertura de Inteligência Artificial // v1.8.2
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={clearAllReports}
            className="px-6 py-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all group flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Todos
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all group flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            Usuários
          </button>

          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all group flex items-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            Ver Site
          </button>

          <button
            onClick={checkReports}
            disabled={isRefreshing}
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50 group flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Refrescar Tudo
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* MAIN COVERAGE */}
          <div className="md:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 p-6 rounded-2xl relative overflow-hidden group shadow-xl transition-all hover:bg-zinc-900/50">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-16 h-16" />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-zinc-500 text-[10px] items-center font-black uppercase tracking-widest mb-1 flex gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Cobertura de Inteligência
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-white tracking-tighter italic">
                    {stats.coverage} <span className="text-zinc-700 text-2xl">/ {stats.total}</span>
                  </h3>
                </div>
              </div>

              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest transition-colors ${coveragePercentage < 30 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                  coveragePercentage > 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-500'
                }`}>
                {coveragePercentage}% coverage
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-zinc-800/50 h-3 rounded-full overflow-hidden border border-zinc-900">
                <div
                  className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] ${coveragePercentage < 30 ? 'bg-yellow-500 shadow-yellow-500/20' :
                      coveragePercentage > 70 ? 'bg-emerald-500 shadow-emerald-500/20' :
                        'bg-blue-500 shadow-blue-500/20'
                    }`}
                  style={{ width: `${coveragePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-zinc-600 italic">
                <span>0% baseline</span>
                <span>target 100%</span>
              </div>
            </div>
          </div>

          {/* CATEGORY HEALTH */}
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex gap-2 items-center">
                <Activity className="w-3 h-3 text-emerald-500" /> Saúde da Base de Dados
              </p>
              <span className="text-[10px] font-black text-white tracking-widest uppercase">
                Total: <span className="text-emerald-500">{coveragePercentage}%</span> concluído
              </span>
            </div>

            <div className="space-y-4">
              {/* B3 */}
              <div className="group/bar">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-zinc-400">Brasil (B3)</span>
                  <div className="flex gap-3">
                    <span className="text-white">🤖 {stats.categories.B3.current} / {stats.categories.B3.total}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-blue-500 h-full transition-all duration-1000 group-hover/bar:shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover/bar:bg-blue-400"
                    style={{ width: `${stats.categories.B3.total > 0 ? (stats.categories.B3.current / stats.categories.B3.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* US */}
              <div className="group/bar">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-zinc-400">EUA (NYSE/NASDAQ)</span>
                  <div className="flex gap-3">
                    <span className="text-white">🤖 {stats.categories.EUA.current} / {stats.categories.EUA.total}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-emerald-500 h-full transition-all duration-1000 group-hover/bar:shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/bar:bg-emerald-400"
                    style={{ width: `${stats.categories.EUA.total > 0 ? (stats.categories.EUA.current / stats.categories.EUA.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* CRIPTO */}
              <div className="group/bar">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-zinc-400">Criptomoedas</span>
                  <div className="flex gap-3">
                    <span className="text-white">🤖 {stats.categories.Cripto.current} / {stats.categories.Cripto.total}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-orange-500 h-full transition-all duration-1000 group-hover/bar:shadow-[0_0_10px_rgba(249,115,22,0.5)] group-hover/bar:bg-orange-400"
                    style={{ width: `${stats.categories.Cripto.total > 0 ? (stats.categories.Cripto.current / stats.categories.Cripto.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="w-12 h-12" />
            </div>
            <p className="text-zinc-500 text-[10px] items-center font-black uppercase tracking-widest mb-1 flex gap-2">
              <Database className="w-3 h-3 text-emerald-500" /> Ativos Totais
            </p>
            <h3 className="text-4xl font-black text-white tracking-tighter">{stats.total}</h3>
            <p className="text-zinc-600 text-[9px] mt-2 uppercase">Mapeados na base de dados</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-12 h-12" />
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1 flex gap-2">
              <Activity className="w-3 h-3 text-emerald-500" /> Memória Local
            </p>
            <h3 className="text-4xl font-black text-white tracking-tighter">{stats.memory} <span className="text-xl text-zinc-600">KB</span></h3>
            <p className="text-zinc-600 text-[9px] mt-2 uppercase">Volume de cache ocupado</p>
          </div>
        </div>

        {/* FILTERS AND TABLE */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              {(['Todos', 'B3', 'EUA', 'Criptomoedas'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="BUSCAR ATIVO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-colors uppercase placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* MAIN TABLE */}
            <div className="lg:col-span-3">
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Ticker</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Ativo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Nota</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest leading-none text-center">
                          <button
                            onClick={toggleSort}
                            className={`flex items-center gap-2 mx-auto hover:text-white transition-colors ${sortOrder ? 'text-emerald-500' : 'text-zinc-500'}`}
                          >
                            Status
                            <ArrowUpDown className={`w-3 h-3 ${sortOrder ? 'text-emerald-500' : 'text-zinc-600'}`} />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map((asset, index) => {
                          const assetNorm = cleanTicker(asset.ticker);
                          const reportData = reportDataMap[assetNorm];
                          const score = reportData?.score || reportData?.rating || '---';

                          return (
                            <tr
                              key={asset.ticker}
                              className={`transition-colors group ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'} hover:bg-zinc-800/50`}
                            >
                              <td className="px-6 py-4">
                                <span className="text-white font-black text-sm tracking-tighter">{asset.ticker}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-400 text-xs font-bold uppercase truncate max-w-[150px] block">
                                  {asset.name}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                  {asset.exchange === 'B3' || asset.ticker.endsWith('.SA') ? 'B3' :
                                    asset.exchange === 'NASDAQ' || asset.exchange === 'NYSE' ? 'EUA' : 'CRIPTO'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${score !== '---' ? 'text-emerald-500' : 'text-zinc-700'}`}>
                                  {score}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  {(() => {
                                    const currentStatus = reportStatus[asset.ticker];

                                    if (currentStatus === 'GERADO') {
                                      return (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                          <span className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.1em]">GERADO</span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 border border-zinc-700/30 rounded-full">
                                          <Clock className="w-3 h-3 text-zinc-500" />
                                          <span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.1em]">PENDENTE</span>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    onClick={() => handleResetAsset(asset.ticker)}
                                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                    title="Resetar Dados e IA"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                  {reportStatus[asset.ticker] && (
                                    <button
                                      onClick={() => deleteReport(asset.ticker)}
                                      className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                      title="Apagar Relatório"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-xs italic tracking-widest uppercase font-bold">
                            Nenhum ativo encontrado para os filtros selecionados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SIDEBAR LOGS */}
            <div className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Atividade Recente</h4>
                </div>

                <div className="space-y-4">
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log, i) => (
                      <div key={i} className="text-[9px] leading-relaxed border-l border-zinc-800 pl-3">
                        <p className="text-zinc-500 italic mb-0.5">{log.split(']')[0]}]</p>
                        <p className="text-zinc-300 font-bold uppercase tracking-tight">{log.split(']')[1]}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-zinc-700 text-[9px] uppercase font-black tracking-widest">Nenhuma atividade registrada na sessão</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">Aviso de Segurança</h4>
                <p className="text-[9px] text-zinc-500 leading-normal uppercase">
                  Todas as exclusões são IRREVERSÍVEIS. A exclusão de um relatório forçará a IA a gerar uma nova análise na próxima visualização do ativo pelo usuário.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
