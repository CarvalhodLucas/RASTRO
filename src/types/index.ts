export interface AiRatingData {
    score: number;
    verdict: string;
    summary: string;
    pillars: any[];
    fiiMetrics?: any;
    etfMetrics?: any;
    cryptoMetrics?: any;
    stockMetrics?: any;
    extractedDY?: string;
    extractedPrice?: string;
    lastUpdate: number;
    reportHash?: string;
}

export interface AiSentimentData {
    score: number;
    label: string;
    analysis: string;
}

export interface AiPulseData {
    pulse: string;
}

export interface AiAnalysisData {
    bullCase?: { title: string; desc: string }[];
    bearCase?: { title: string; desc: string }[];
    error?: boolean;
    message?: string;
}

export interface AiHealthData {
    roe?: string;
    pl?: string;
    pvp?: string;
    dy?: string;
    margin?: string;
    debt?: string;
    healthInsights?: string;
}

export interface FairPriceData {
    fairPrice: number;
    upside: number;
}
