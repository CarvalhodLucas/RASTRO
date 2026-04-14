export const getMarketStatus = (asset: any) => {
    try {
        const ticker = asset?.ticker?.toUpperCase() || "";
        const isCrypto = asset?.isCrypto ||
            ticker.includes("BTC") ||
            ticker.includes("ETH") ||
            ticker.includes("USDT") ||
            (!ticker.includes(".SA") && !asset?.fundamentalData);

        if (isCrypto) {
            return { isOpen: true, label: "LIVE 24/7", countdown: "" };
        }

        const brTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const hours = brTime.getHours();
        const minutes = brTime.getMinutes();
        const day = brTime.getDay();
        const currentTime = hours * 60 + minutes;

        const isWeekend = day === 0 || day === 6;
        const hasNumbers = /\d/.test(ticker);
        const isB3 = ticker.includes(".SA") || hasNumbers;
        const isUS = !isB3;

        const openTime = isUS ? 630 : 600; // EUA 10h30, B3 10h
        const closeTime = 1020; // 17h

        const isOpen = !isWeekend && currentTime >= openTime && currentTime < closeTime;

        let countdown = "";
        if (!isOpen) {
            let diff;
            if (isWeekend || currentTime >= closeTime) {
                const daysToAdd = day === 5 ? 3 : day === 6 ? 2 : 1;
                const nextOpen = (daysToAdd * 1440) + openTime;
                diff = nextOpen - currentTime;
            } else {
                diff = openTime - currentTime;
            }
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            countdown = `${h}h ${m}min`;
        }

        return { isOpen, countdown, label: isUS ? "NYSE/NASDAQ" : "B3" };
    } catch (e) {
        return { isOpen: true, countdown: "", label: "B3" };
    }
};

export const calculateSolidityScore = (assetData: any) => {
    if (!assetData) return 0;

    const isCrypto = assetData.isCrypto;
    let score = 0;

    if (isCrypto) {
        const ticker = assetData.ticker?.toUpperCase() || "";
        if (ticker.includes("BTC")) score += 40;
        else if (ticker.includes("ETH")) score += 35;
        else if (ticker.includes("SOL") || ticker.includes("BNB") || ticker.includes("USDT")) score += 25;
        else score += 15;

        const variation = Math.abs(parseFloat(assetData.variation) || 0);
        if (variation < 2) score += 30;
        else if (variation < 5) score += 20;
        else if (variation < 10) score += 10;

        score += 30; // Base para ativos top listados
    } else {
        if (!assetData.fundamentalData) return 0;
        const { roe, dy, margin } = assetData.fundamentalData;
        const currentPrice = parseFloat(assetData.price) || 0;
        const grahamPrice = parseFloat(assetData.valuation?.graham) || 0;

        if (parseFloat(roe) > 15) score += 30;
        else if (parseFloat(roe) > 8) score += 15;

        if (parseFloat(dy) > 6) score += 20;
        else if (parseFloat(dy) > 2) score += 10;

        if (currentPrice > 0 && grahamPrice > 0) {
            if (currentPrice < grahamPrice) score += 30;
            else if (currentPrice < grahamPrice * 1.2) score += 15;
        }

        if (parseFloat(margin) > 10) score += 20;
        else if (parseFloat(margin) > 5) score += 10;
    }

    return Math.min(score, 100);
};

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const getSentimentDetails = (value: number) => {
    if (value <= 25) return { label: 'Medo Extremo', textColor: 'text-red-500', bgColor: 'bg-red-500/10' };
    if (value <= 44) return { label: 'Medo', textColor: 'text-orange-400', bgColor: 'bg-orange-400/10' };
    if (value <= 55) return { label: 'Neutro', textColor: 'text-slate-400', bgColor: 'bg-slate-400/10' };
    if (value <= 75) return { label: 'Ganância', textColor: 'text-green-400', bgColor: 'bg-green-400/10' };
    return { label: 'Ganância Extrema', textColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
};

export const cleanAIText = (text: string) => {
    if (!text) return "";
    return text
        .replace(/\*\*/g, '') 
        .replace(/\*/g, '')   
        .replace(/#/g, '')    
        .replace(/^[-•]\s+/gm, '') 
        .trim();
};

export const hashCode = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return h;
};

export const formatValue = (value: number | string, asset: any) => {
    if (value === "N/D" || value === null || value === undefined) return "N/A";
    
    let numValue: any = value;
    if (typeof value === 'string') {
        const cleanStr = value.replace(/[^\d.,-]/g, "");
        if (cleanStr.includes(',')) {
            numValue = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
        } else {
            numValue = parseFloat(cleanStr);
        }
    }
        
    if (isNaN(numValue)) return "0.00";

    const currencyType = asset?.currency === '$' ? 'USD' : 'BRL';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currencyType,
        minimumFractionDigits: 2
    }).format(numValue);
};

export const formatCompactNumber = (value: number, asset: any) => {
    if (!value || value === 0) return "--";
    const symbol = asset?.currency || "R$";
    if (value >= 1e12) return `${symbol} ${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${symbol} ${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${symbol} ${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${symbol} ${(value / 1e3).toFixed(1)}K`;
    return `${symbol} ${value.toFixed(2)}`;
};
