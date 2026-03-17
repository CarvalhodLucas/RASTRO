const fs = require('fs');
const path = require('path');

const etfsRaw = `ACWI11
TREND ETF MSCI ACWI
ALUG11
INVESTO ETF MSCI REAL ESTATE
AREA11
AUVP Renda Automática
AURO11
BUENA VISTA NEOS GOLD HIGH INCOME INDEX FUNDO DE ÍNDICE DE RESPONSABILIDADE LIMITADA
AUVP11
BTG Pactual TEVA AUVP Ações Fundamentos
B5P211
IT NOW IMA-B5
BBOI11
BB ETF ÍNDICE FUTURO DE BOI GORDO B3
BBOV11
B ETF IBOVESPA FUNDO DE ÍNDICE
BBSD11
BB ETF S&P DIVIDENDOS BRASIL FUNDO DE ÍNDICE
BEST11
INVESTO BRAZIL BESST QUALITY FUNDO DE ÍNDICE
BITH11
Bitcoin Verde
BITI11
IT NOW BLOOMBERG GALAXY BITCOIN
BOVA11
ISHARES IBOVESPA FUNDO DE ÍNDICE
BOVB11
ETF BRADESCO IBOVESPA FDO DE INDICE
BOVV11
IT NOW IBOVESPA FUNDO DE ÍNDICE
BOVX11
TREND IBOVX
BRAX11
ISHARES IBRX - ÍNDICE BRASIL (IBRX-100) FDO ÍNDICE
CASA11
Buena Vista Neos Real Estate High Income ETF
CHIP11
Investo ETF US Listed Semiconductor 25 Index
CMDB11
BTG Pactual Teva Ações Commodities Brasil FDI
COIN11
Buena Vista Neos Bitcoin High Income ETF
CRPT11
CRIPTO20 EMP
DEBB11
BTG PACTUAL TEVA DEBÊNTURES DI FUNDO DE ÍNDICE
DIVD11
It Now IDIV Renda Dividendos Fundo de Índice
DIVO11
IT NOW IDIV FUNDO DE ÍNDICE
DOLA11
BB ETF Índice Futuro de Dólar S&P/B3 Fundo de Índice
ECOO11
ISHARES ÍNDICE CARBONO EFIC. (ICO2) BRASIL-FDO ÍND
ESGB11
BTG PACTUAL ESG FUNDO DE ÍNDICE S&P/B3 BRAZIL ES
ETHE11
HASHDEX NASDAQ ETHEREUM REFERENCE PRICE
ETHY11
Buena Vista DEX Vettafi Neos Ethereum High Income ETF
FIND11
IT NOW IFNC FUNDO DE ÍNDICE
FIXA11
Renda Fixa Pré Índice Futuro de Taxas de Juros S&P/B3
GENB11
ETF BTG GENB
GOLD11
Trend ETF LBMA Ouro FI Indice IE
GOVE11
IT NOW IGCT FUNDO DE ÍNDICE
GPUS11
Investo GP ETF S&P 500 Fundo de Índice
HASH11
HASHDEX NASDAQ CRYPTO
HODL11
Investo ETF Marketvector Bitcoin Benchmark Rate Fundo de Índice
IB5M11
It Now IMA-B5+
IDKA11
ETF It Now IRF-M P3
IMAB11
It Now ID ETF IMA-B Fundo de Índice
IRFM11
It Now IRF-M P2 Fundo de Índice
IVVB11
ISHARES S&P 500 FDO INV COTAS FDO INDICE
IWMI11
Buena Vista Neos Russell 2000 High Income ETF
JOGO11
Investo ETF GL VI GA & ES Fundo Investimento De Índice IE
LFTB11
INVESTO ETF M B TREASURY 760 DAY TARGET DURATION
LFTS11
Teva Tesouro Selic
LVOL11
NU IBOV SMART LOW VOLATILITY B3
MATB11
IT NOW IMAT FUNDO DE ÍNDICE
NASD11
TREND ETF NASDAQ 100
NDIV11
Nu Renda Ibov Smart Dividendos
NSDV11
NU IBOV Smart Dividendos
NTNS11
INVESTO TEVA TESOURO IPCA+ 0 A 4 ANOS ETF – FUNDO DE INVESTIMENTO DE ÍNDICE
NUCL11
INVESTO MVIS GLOBAL URANIUM & NUCLEAR ENERGY ETF
PACB11
BTG PACTUAL TEVA TESOURO IPCA ULTRA LONGO CE FUNDO DE ÍNDICE
PIBB11
IT NOW PIBB IBRX-50 - FUNDO DE ÍNDICE
QBTC11
QR CME CF BITCOIN REFERENCE RATE
QETH11
QR CME CF ETHER REFERENCE RATE
QQQI11
ETF BV QQQI
QQQQ11
Buena Vista Nasdaq-100 High Beta Index Fundo de Índice
SMAC11
IT NOW SMALL FDO ÍNDICE
SMAL11
ISHARES BMFBOVESPA SMALL CAP FUNDO DE ÍNDICE
SPXB11
BTG PACTUAL S&P 500 FUNDO DE ÍNDICE
SPXI11
IT NOW S&P500 TRN FUNDO DE INDICE
SPXR11
ETF It Now S&P 500 Futures Quanto BRL
SPYI11
BUENA VISTA US HIGH INCOME ETF FDO ÍNDICE
SVAL11
INVESTO ETF S&P SMALLCAP 600 VALUE
TECK11
NOW NYSE FANG+TM FUNDO DE ÍNDICE
TIRB11
BTG PACTUAL TEVA DIVIDENDOS ATIVOS REAIS LISTADOS FUNDO DE ÍNDICE
TRIG11
ETF Trigono Teva Ações Micro Cap/Small Cap FDI
USAL11
Trend ETF CRSP U.S. Large CAP Fundo de Invest. de Índice
USTK11
INVESTO ETF MSCI US TECHNOLOGY FDO INV IND INV EXT
UTEC11
TREND US TEC
UTLL11
INVESTO B3 UTILIDADE PÚBLICA FUNDO DE ÍNDICE
VWRA11
INVESTO FTSE ALL-WORLD FUNDO DE ÍNDICE
WEB311
SMART HASH
WRLD11
Investo FTSE Global Equities ETF FDI
XBOV11
CAIXA ETF IBOVESPA FUNDO DE INDICE
XFIX11
TREND ETF IFIX FUNDO DE ÍNDICE
XINA11
TREND ETF MSCI CHINA FDO. INV. ÍNDICE - INV. EXT.`;

const lines = etfsRaw.trim().split('\n').map(l => l.trim()).filter(l => l);

const newAssets = [];
for (let i = 0; i < lines.length; i += 2) {
    let ticker = lines[i];
    if (!ticker.endsWith('.SA')) ticker += '.SA';
    const name = lines[i + 1];

    // Base logo for ETFs - using b3 for simplicity, or we can use the domain logic

    newAssets.push(`    {
        ticker: "${ticker}",
        name: "${name}",
        price: "0.00",
        variation: "0.0",
        sector: "ETF",
        exchange: "B3",
        sentiment: 50,
        bullCase: [],
        bearCase: [],
        logo: "https://icons.duckduckgo.com/ip3/b3.com.br.ico",
        size: 10,
        cgId: "",
        aiPulse: "Acompanha índice de mercado.",
        marketCap: "--",
        peRatio: "--",
        dividendYield: "--",
        lastUpdate: "10/03/2026"
    }`);
}

const targetPath = path.join(__dirname, 'src/lib/data.ts');
const content = fs.readFileSync(targetPath, 'utf8');

// Find the end of export const b3Assets = [...]
// We'll search for the `];` that precedes `export const cryptoAssets`
const cryptoIdx = content.indexOf('export const cryptoAssets');
const endOfB3Idx = content.lastIndexOf('];', cryptoIdx);

if (endOfB3Idx !== -1) {
    // Insert new assets before the ];
    // Get the character before ]; to see if we need a comma
    let textBefore = content.slice(0, endOfB3Idx).trimEnd();
    if (!textBefore.endsWith(',')) {
        textBefore += ',';
    }

    const newContent = textBefore + '\\n' + newAssets.join(',\\n') + '\\n' + content.slice(endOfB3Idx);
    fs.writeFileSync(targetPath, newContent, 'utf8');
    console.log('Successfully inserted ' + newAssets.length + ' ETFs.');
} else {
    console.log('Failed to find insertion point.');
}
