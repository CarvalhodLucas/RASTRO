"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trash2, Clock, Search, ArrowUpDown, RefreshCw, Database, ShieldCheck, Home, Users, Bot, Save, Activity, CheckCircle2, FileText, AlertTriangle, FolderCheck, Eye } from 'lucide-react';
import { assetsDatabase } from '@/lib/data';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';

interface ReportStatus {
  [key: string]: 'GERADO' | 'PENDENTE';
}

interface ServerReportFile {
  name: string;
  mtime: string;
  size: number;
  normalizedTicker: string;
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
  const [sortField, setSortField] = useState<'status' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [compSortDirection, setCompSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [reportDataMap, setReportDataMap] = useState<Record<string, any>>({});
  const [reportDates, setReportDates] = useState<Record<string, string>>({});
  const [serverReports, setServerReports] = useState<ServerReportFile[]>([]);
  const [activeTab, setActiveTab] = useState<'ativos' | 'comparador'>('ativos');
  const [activeSubTab, setActiveSubTab] = useState<'associados' | 'sem_relatorio' | 'orfaos'>('associados');
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

  // --- AI ENGINE CONFIG ---
  const PROVIDERS = ['gemini', 'groq', 'groq2', 'openrouter'] as const;
  type Provider = typeof PROVIDERS[number];
  const MODELS_BY_PROVIDER: Record<Provider, string[]> = {
    gemini:      ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'],
    groq:        ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
    groq2:       ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
    openrouter:  ['deepseek/deepseek-v4-flash', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.3-70b-instruct:free', 'google/gemini-2.0-flash-exp:free'],
  };
  const SECTION_LABELS: Record<string, { label: string; page: string }> = {
    resumo:         { label: '📝 Resumo Executivo (Bull/Bear)', page: 'ticker' },
    pulso:          { label: '⚡ Pulso de IA', page: 'ticker' },
    rating:         { label: '🏆 Score de IA', page: 'ticker' },
    saude:          { label: '💊 Saúde Financeira', page: 'ticker' },
    sentimento:     { label: '📊 Sentimento do Mercado', page: 'ticker' },
    chat:           { label: '🤖 Analista RASTRO (Chat do Ativo)', page: 'ticker' },
    portfolio_chat: { label: '🧠 RASTRO Sênior (Chat do Portfólio)', page: 'portfolio' },
    support_chat:   { label: '💬 Chat de Suporte (Institucional)', page: 'admin' },
  };
  const [aiConfig, setAiConfig] = useState<Record<string, { provider: string; model: string }>>({});
  const [aiConfigSaving, setAiConfigSaving] = useState(false);
  const [aiConfigSaved, setAiConfigSaved] = useState(false);

  const loadAiConfig = async () => {
    try {
      const res = await fetch('/api/admin/ai-config');
      const data = await res.json();
      if (data.sections) {
        const simplified: Record<string, { provider: string; model: string }> = {};
        for (const key of Object.keys(data.sections)) {
          simplified[key] = { provider: data.sections[key].provider, model: data.sections[key].model };
        }
        setAiConfig(simplified);
      }
    } catch (e) { console.error('Erro ao carregar AI Config', e); }
  };

  const saveAiConfig = async () => {
    setAiConfigSaving(true);
    try {
      await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: aiConfig }),
      });
      setAiConfigSaved(true);
      setTimeout(() => setAiConfigSaved(false), 3000);
    } catch (e) { console.error('Erro ao salvar AI Config', e); }
    finally { setAiConfigSaving(false); }
  };

  const handleProviderChange = (sectionKey: string, provider: string) => {
    const defaultModel = MODELS_BY_PROVIDER[provider as Provider]?.[0] || '';
    setAiConfig(prev => ({ ...prev, [sectionKey]: { provider, model: defaultModel } }));
  };

  const handleModelChange = (sectionKey: string, model: string) => {
    setAiConfig(prev => ({ ...prev, [sectionKey]: { ...prev[sectionKey], model } }));
  };

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
    const datesMap: Record<string, string> = {};
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
    const tempServerReports: ServerReportFile[] = [];
    try {
      const resp = await fetch('/api/admin/reports-meta');
      const data = await resp.json();
      if (data.files) {
        data.files.forEach((f: any) => {
          const fileName = typeof f === 'string' ? f : f.name;
          const norm = cleanTicker(fileName);
          if (norm) {
            fileNormalized.add(norm);
            const formattedDate = f.mtime ? new Date(f.mtime).toLocaleDateString('pt-BR') : '---';
            datesMap[norm] = formattedDate;
            tempServerReports.push({
              name: fileName,
              mtime: f.mtime,
              size: f.size || 0,
              normalizedTicker: norm
            });
          }
        });
      }
    } catch (e) {
      console.error("Erro ao carregar meta-relatórios:", e);
    }
    setServerReports(tempServerReports);

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
      const hasFile = fileNormalized.has(assetNormalized);
      const reportData = localDataMap[assetNormalized];

      // O status GERADO agora depende diretamente da existência do arquivo físico na pasta public/reports
      const isFullReport = hasFile;

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
    setReportDates(datesMap);
    setReportDataMap(localDataMap);
    setStats({
      total: assetsDatabase.length,
      coverage: coverageCount,
      memory: Math.round(memoryUsage * 100) / 100,
      categories: catStats
    });

    setTimeout(() => setIsRefreshing(false), 600);
  };

  const comparisonData = useMemo(() => {
    const dbCleanTickers = new Set(assetsDatabase.map(a => cleanTicker(a.ticker)));
    
    // 1. Relatórios Órfãos (Files on server that don't match any asset in DB)
    const orphans = serverReports.filter(rep => !dbCleanTickers.has(rep.normalizedTicker));
    
    // 2. Ativos Com Relatório & Sem Relatório
    const associated: Array<{ asset: any; report: ServerReportFile }> = [];
    const missing: any[] = [];
    
    assetsDatabase.forEach(asset => {
      const assetNorm = cleanTicker(asset.ticker);
      const matchingReport = serverReports.find(rep => rep.normalizedTicker === assetNorm);
      
      if (matchingReport) {
        associated.push({ asset, report: matchingReport });
      } else {
        missing.push(asset);
      }
    });
    
    return { orphans, associated, missing };
  }, [serverReports]);

  const sortedAssociated = useMemo(() => {
    const filtered = comparisonData.associated.filter(item => 
      item.asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.report.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      const timeA = a.report.mtime ? new Date(a.report.mtime).getTime() : 0;
      const timeB = b.report.mtime ? new Date(b.report.mtime).getTime() : 0;
      return compSortDirection === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [comparisonData.associated, searchTerm, compSortDirection]);

  const sortedOrphans = useMemo(() => {
    const filtered = comparisonData.orphans.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.normalizedTicker.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      const timeA = a.mtime ? new Date(a.mtime).getTime() : 0;
      const timeB = b.mtime ? new Date(b.mtime).getTime() : 0;
      return compSortDirection === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [comparisonData.orphans, searchTerm, compSortDirection]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deletePhysicalReport = async (fileName: string, tickerNameForLog?: string) => {
    const displayName = tickerNameForLog ? `${tickerNameForLog} (${fileName})` : fileName;
    if (!confirm(`Deseja realmente excluir fisicamente o arquivo "${fileName}" do servidor?\nEsta ação removerá o Relatório 360 de forma definitiva!`)) {
      return;
    }
    
    try {
      const resp = await fetch(`/api/admin/reports-meta?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });
      const data = await resp.json();
      if (data.success) {
        addLog(`DELETADO: Arquivo de relatório ${displayName} removido do servidor.`);
        checkReports();
      } else {
        alert(`Erro ao excluir arquivo: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro de rede ao tentar excluir arquivo do servidor.');
    }
  };

  useEffect(() => {
    if (!hasMounted) return;
    setIsAuthenticated(true);
    checkReports();
    loadAiConfig();
  }, [hasMounted]);

  // Carregar logs do sessionStorage
  useEffect(() => {
    const savedLogs = sessionStorage.getItem('admin_activity_logs');
    if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
  }, []);

  const filteredAssets = useMemo(() => {
    const filtered = assetsDatabase.filter(asset => {
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
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      if (sortField === 'status') {
        const statusA = reportStatus[a.ticker] === 'GERADO' ? 1 : 0;
        const statusB = reportStatus[b.ticker] === 'GERADO' ? 1 : 0;
        return sortDirection === 'desc' ? statusB - statusA : statusA - statusB;
      } else if (sortField === 'date') {
        const dateStrA = reportDates[cleanTicker(a.ticker)] || '';
        const dateStrB = reportDates[cleanTicker(b.ticker)] || '';

        if (!dateStrA && !dateStrB) return 0;
        if (!dateStrA) return 1;
        if (!dateStrB) return -1;

        const parseDate = (dStr: string) => {
          const [day, month, year] = dStr.split('/').map(Number);
          return new Date(year, month - 1, day).getTime();
        };

        const timeA = parseDate(dateStrA);
        const timeB = parseDate(dateStrB);

        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      }
      return 0;
    });
  }, [selectedCategory, searchTerm, sortField, sortDirection, reportStatus, reportDates]);

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

  const handleSort = (field: 'status' | 'date') => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

        {/* AI ENGINE CONFIG PANEL */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">AI Engine Config</h2>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">// Modelos por seção</span>
            </div>
            <button
              onClick={saveAiConfig}
              disabled={aiConfigSaving}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                aiConfigSaved
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-700 hover:bg-emerald-500 hover:border-emerald-500 hover:text-black text-zinc-300'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              {aiConfigSaved ? 'SALVO!' : aiConfigSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {/* GROUP: Página do Ativo */}
          <div className="mb-6">
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-zinc-700 inline-block" />
              Página do Ativo (Ticker)
              <span className="flex-1 h-px bg-zinc-900 inline-block" />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(SECTION_LABELS).filter(k => SECTION_LABELS[k].page === 'ticker').map((sectionKey) => {
                const section = aiConfig[sectionKey];
                if (!section) return null;
                const provider = section.provider as 'gemini' | 'groq' | 'groq2' | 'openrouter';
                const providerColors: Record<string, string> = {
                  gemini:     'border-blue-500/30 bg-blue-500/5',
                  groq:       'border-orange-500/30 bg-orange-500/5',
                  groq2:      'border-orange-500/30 bg-orange-500/5',
                  openrouter: 'border-purple-500/30 bg-purple-500/5',
                };
                return (
                  <div key={sectionKey} className={`border rounded-xl p-4 flex flex-col gap-3 ${providerColors[provider] || 'border-zinc-700 bg-zinc-900/30'}`}>
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">
                      {SECTION_LABELS[sectionKey].label}
                    </p>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Provider</label>
                      <select value={section.provider} onChange={(e) => handleProviderChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        <option value="gemini">🔵 Google Gemini</option>
                        <option value="groq">🟠 Groq API (1)</option>
                        <option value="groq2">🟠 Groq API (2)</option>
                        <option value="openrouter">🟣 OpenRouter</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Modelo</label>
                      <select value={section.model} onChange={(e) => handleModelChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        {(MODELS_BY_PROVIDER[provider] || []).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GROUP: Portfólio */}
          <div>
            <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-emerald-900 inline-block" />
              Página do Portfólio
              <span className="flex-1 h-px bg-emerald-950 inline-block" />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(SECTION_LABELS).filter(k => SECTION_LABELS[k].page === 'portfolio').map((sectionKey) => {
                const section = aiConfig[sectionKey];
                if (!section) return null;
                const provider = section.provider as 'gemini' | 'groq' | 'groq2' | 'openrouter';
                const providerColors: Record<string, string> = {
                  gemini:     'border-blue-500/30 bg-blue-500/5',
                  groq:       'border-orange-500/30 bg-orange-500/5',
                  groq2:      'border-orange-500/30 bg-orange-500/5',
                  openrouter: 'border-emerald-500/30 bg-emerald-500/5',
                };
                return (
                  <div key={sectionKey} className={`border rounded-xl p-4 flex flex-col gap-3 ${providerColors[provider] || 'border-zinc-700 bg-zinc-900/30'}`}>
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">
                      {SECTION_LABELS[sectionKey].label}
                    </p>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Provider</label>
                      <select value={section.provider} onChange={(e) => handleProviderChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        <option value="gemini">🔵 Google Gemini</option>
                        <option value="groq">🟠 Groq API (1)</option>
                        <option value="groq2">🟠 Groq API (2)</option>
                        <option value="openrouter">🟣 OpenRouter</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Modelo</label>
                      <select value={section.model} onChange={(e) => handleModelChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        {(MODELS_BY_PROVIDER[provider] || []).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GROUP: Institucional / Suporte */}
          <div className="mt-6">
            <p className="text-[9px] text-amber-600 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-amber-900 inline-block" />
              Institucional / Suporte
              <span className="flex-1 h-px bg-amber-950 inline-block" />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(SECTION_LABELS).filter(k => SECTION_LABELS[k].page === 'admin').map((sectionKey) => {
                const section = aiConfig[sectionKey];
                if (!section) return null;
                const provider = section.provider as 'gemini' | 'groq' | 'groq2' | 'openrouter';
                const providerColors: Record<string, string> = {
                  gemini:     'border-blue-500/30 bg-blue-500/5',
                  groq:       'border-orange-500/30 bg-orange-500/5',
                  groq2:      'border-orange-500/30 bg-orange-500/5',
                  openrouter: 'border-purple-500/30 bg-purple-500/5',
                };
                return (
                  <div key={sectionKey} className={`border rounded-xl p-4 flex flex-col gap-3 ${providerColors[provider] || 'border-zinc-700 bg-zinc-900/30'}`}>
                    <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest leading-none">
                      {SECTION_LABELS[sectionKey].label}
                    </p>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Provider</label>
                      <select value={section.provider} onChange={(e) => handleProviderChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        <option value="gemini">🔵 Google Gemini</option>
                        <option value="groq">🟠 Groq API (1)</option>
                        <option value="groq2">🟠 Groq API (2)</option>
                        <option value="openrouter">🟣 OpenRouter</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Modelo</label>
                      <select value={section.model} onChange={(e) => handleModelChange(sectionKey, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer">
                        {(MODELS_BY_PROVIDER[provider] || []).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* MAIN NAVIGATION TABS */}
        <div className="flex border-b border-zinc-900 pb-2 gap-6 mb-6">
          <button
            onClick={() => {
              setActiveTab('ativos');
              setSearchTerm('');
            }}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ativos'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Database className="w-4 h-4" />
            Status dos Ativos ({assetsDatabase.length})
          </button>
          
          <button
            onClick={() => {
              setActiveTab('comparador');
              setSearchTerm('');
            }}
            className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'comparador'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            Comparador de Pasta 360 ({serverReports.length} arquivos)
          </button>
        </div>

        {activeTab === 'ativos' ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* FILTERS AND TABLE */}
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
                              onClick={() => handleSort('date')}
                              className={`flex items-center gap-2 mx-auto hover:text-white transition-colors ${sortField === 'date' ? 'text-emerald-500' : 'text-zinc-500'}`}
                            >
                              Data
                              <ArrowUpDown className={`w-3 h-3 ${sortField === 'date' ? 'text-emerald-500' : 'text-zinc-600'}`} />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest leading-none text-center">
                            <button
                              onClick={() => handleSort('status')}
                              className={`flex items-center gap-2 mx-auto hover:text-white transition-colors ${sortField === 'status' ? 'text-emerald-500' : 'text-zinc-500'}`}
                            >
                              Status
                              <ArrowUpDown className={`w-3 h-3 ${sortField === 'status' ? 'text-emerald-500' : 'text-zinc-600'}`} />
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
                                  <span className="text-zinc-500 text-[10px] font-black">
                                    {reportDates[assetNorm] || '---'}
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
                                    {reportDates[assetNorm] && (
                                      <button
                                        onClick={() => {
                                          const fileName = `${assetNorm}.html`;
                                          const exactFile = serverReports.find(r => r.normalizedTicker === assetNorm);
                                          deletePhysicalReport(exactFile?.name || fileName, asset.ticker);
                                        }}
                                        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                        title="Apagar Relatório Físico"
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
                            <td colSpan={7} className="px-6 py-12 text-center text-zinc-600 text-xs italic tracking-widest uppercase font-bold">
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
                    Todas as exclusões físicas no servidor são IRREVERSÍVEIS. A exclusão de um arquivo removerá permanentemente o relatório visualizável pelo usuário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* NEW COMPARATOR VIEW */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* COMPARATOR SUMMARY STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-zinc-900/30 border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-zinc-900/40">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Relatórios Vinculados
                </p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-white italic">{comparisonData.associated.length}</h4>
                  <span className="text-zinc-600 text-[9px] uppercase font-black tracking-wider">ativos no banco</span>
                </div>
              </div>
              
              <div className="bg-zinc-900/30 border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-zinc-900/40">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Ativos Sem Relatório
                </p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-amber-500 italic">{comparisonData.missing.length}</h4>
                  <span className="text-zinc-600 text-[9px] uppercase font-black tracking-wider">pendentes de arquivo</span>
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-zinc-900/40">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${comparisonData.orphans.length > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} /> Relatórios Órfãos (Pasta)
                </p>
                <div className="flex items-baseline gap-2">
                  <h4 className={`text-3xl font-black italic ${comparisonData.orphans.length > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                    {comparisonData.orphans.length}
                  </h4>
                  <span className="text-zinc-600 text-[9px] uppercase font-black tracking-wider">sem ativo correspondente</span>
                </div>
              </div>
            </div>

            {/* SUBTABS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 p-2.5 border border-zinc-800/50 rounded-2xl">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveSubTab('associados');
                    setSearchTerm('');
                  }}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    activeSubTab === 'associados'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Associados ({comparisonData.associated.length})
                </button>
                
                <button
                  onClick={() => {
                    setActiveSubTab('sem_relatorio');
                    setSearchTerm('');
                  }}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    activeSubTab === 'sem_relatorio'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sem Relatório ({comparisonData.missing.length})
                </button>

                <button
                  onClick={() => {
                    setActiveSubTab('orfaos');
                    setSearchTerm('');
                  }}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    activeSubTab === 'orfaos'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Órfãos ({comparisonData.orphans.length})
                </button>
              </div>

              {/* SEARCH FILTER WITHIN SUBTABS */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="FILTRAR LISTA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-colors uppercase placeholder:text-zinc-700 font-mono text-zinc-300"
                />
              </div>
            </div>

            {/* SUBTAB CONTENT */}
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {activeSubTab === 'associados' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Ticker</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Nome do Ativo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Arquivo Físico</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-center">Tamanho</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest leading-none text-center">
                          <button
                            onClick={() => setCompSortDirection(p => p === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-1.5 mx-auto hover:text-white transition-colors text-emerald-500 font-bold"
                          >
                            Data Modificação
                            <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {sortedAssociated.length > 0 ? (
                        sortedAssociated.map((item, index) => (
                          <tr key={item.asset.ticker} className={`transition-colors hover:bg-zinc-800/30 group ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                            <td className="px-6 py-4">
                              <span className="text-white font-black text-sm tracking-tighter">{item.asset.ticker}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-zinc-400 text-xs font-bold uppercase block truncate max-w-[200px]">{item.asset.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-emerald-500 text-xs font-mono">{item.report.name}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-zinc-400 text-xs font-bold font-mono">{formatFileSize(item.report.size)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-zinc-500 text-xs font-mono">{item.report.mtime ? new Date(item.report.mtime).toLocaleString('pt-BR') : '---'}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <a
                                  href={`/reports/${item.report.name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                  title="Visualizar Relatório"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => deletePhysicalReport(item.report.name, item.asset.ticker)}
                                  className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                  title="Excluir Arquivo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-xs italic tracking-widest uppercase font-bold">
                            Nenhum ativo associado encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSubTab === 'sem_relatorio' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Ticker</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Nome do Ativo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Exchange</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Setor</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {(() => {
                        const filtered = comparisonData.missing.filter(asset => 
                          asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        return filtered.length > 0 ? (
                          filtered.map((asset, index) => (
                            <tr key={asset.ticker} className={`transition-colors hover:bg-zinc-800/30 ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                              <td className="px-6 py-4">
                                <span className="text-white font-black text-sm tracking-tighter">{asset.ticker}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-400 text-xs font-bold uppercase block truncate max-w-[250px]">{asset.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-500 text-xs font-bold uppercase">{asset.exchange}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-zinc-500 text-xs font-bold uppercase">{asset.sector || '---'}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[9px] font-black uppercase tracking-[0.1em]">
                                  FALTA ARQUIVO
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 text-xs italic tracking-widest uppercase font-bold">
                              Todos os ativos possuem relatórios na pasta!
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSubTab === 'orfaos' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Nome do Arquivo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Ticker Extraído</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-center">Tamanho</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest leading-none text-center">
                          <button
                            onClick={() => setCompSortDirection(p => p === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-1.5 mx-auto hover:text-white transition-colors text-emerald-500 font-bold"
                          >
                            Data Modificação
                            <ArrowUpDown className="w-3 h-3 text-emerald-500" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {sortedOrphans.length > 0 ? (
                        sortedOrphans.map((file, index) => (
                          <tr key={file.name} className={`transition-colors hover:bg-zinc-800/30 group ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                            <td className="px-6 py-4">
                              <span className="text-zinc-300 text-xs font-mono">{file.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-red-400 font-black text-xs font-mono">{file.normalizedTicker}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-zinc-400 text-xs font-bold font-mono">{formatFileSize(file.size)}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-zinc-500 text-xs font-mono">{file.mtime ? new Date(file.mtime).toLocaleString('pt-BR') : '---'}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[9px] font-black uppercase tracking-[0.1em]">
                                <AlertTriangle className="w-3 h-3" /> ÓRFÃO
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <a
                                  href={`/reports/${file.name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                  title="Visualizar Arquivo"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => deletePhysicalReport(file.name)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                  title="Excluir Arquivo do Servidor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-xs italic tracking-widest uppercase font-bold">
                            Nenhum relatório órfão na pasta
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
