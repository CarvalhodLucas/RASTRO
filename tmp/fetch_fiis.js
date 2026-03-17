const https = require('https');
const fs = require('fs');

const fiis = [
  { t: "KNIP11.SA", n: "Kinea Índices de Preços", s: "Papel", mc: "8.3B", dy: "11.1%" },
  { t: "KNCR11.SA", n: "Kinea Rendimentos Imobiliários", s: "Papel", mc: "5.8B", dy: "12.5%" },
  { t: "HGLG11.SA", n: "CGHG Logística", s: "Logística", mc: "4.5B", dy: "8.2%" },
  { t: "MXRF11.SA", n: "Maxi Renda", s: "Híbrido", mc: "3.2B", dy: "12.0%" },
  { t: "BTLG11.SA", n: "BTG Pactual Logística", s: "Logística", mc: "3.5B", dy: "9.0%" },
  { t: "VISC11.SA", n: "Vinci Shopping Centers", s: "Shoppings", mc: "3.1B", dy: "8.8%" },
  { t: "XPLG11.SA", n: "XP Log", s: "Logística", mc: "3.0B", dy: "9.1%" },
  { t: "CPTS11.SA", n: "Capitânia Securities II", s: "Papel", mc: "2.9B", dy: "10.5%" },
  { t: "IRDM11.SA", n: "Iridium Recebíveis Imobiliários", s: "Papel", mc: "2.8B", dy: "10.2%" },
  { t: "HGRU11.SA", n: "CSHG Renda Urbana", s: "Renda Urbana", mc: "2.5B", dy: "9.0%" },
  { t: "ALZR11.SA", n: "Alianza Trust Renda Imobiliária", s: "Logística/Urbana", mc: "2.5B", dy: "9.5%" },
  { t: "HGBS11.SA", n: "Hedge Brasil Shopping", s: "Shoppings", mc: "2.4B", dy: "8.5%" },
  { t: "BRCR11.SA", n: "BC Fund", s: "Lajes Corporativas", mc: "2.4B", dy: "8.1%" },
  { t: "JSRE11.SA", n: "JS Real Estate", s: "Lajes Corporativas", mc: "2.3B", dy: "7.9%" },
  { t: "PVBI11.SA", n: "VBI Prime Properties", s: "Lajes Corporativas", mc: "2.0B", dy: "7.5%" },
  { t: "TGAR11.SA", n: "TG Ativo Real", s: "Desenvolvimento", mc: "1.9B", dy: "14.5%" },
  { t: "RBRR11.SA", n: "RBR Rendimento High Grade", s: "Papel", mc: "1.8B", dy: "10.0%" },
  { t: "HGCR11.SA", n: "CSHG Recebíveis Imobiliários", s: "Papel", mc: "1.7B", dy: "11.5%" },
  { t: "VRTA11.SA", n: "Fator Verita", s: "Papel", mc: "1.6B", dy: "11.0%" },
  { t: "TRXF11.SA", n: "TRX Real Estate", s: "Renda Urbana", mc: "1.5B", dy: "9.8%" },
  { t: "MALL11.SA", n: "Malls Brasil Plural", s: "Shoppings", mc: "1.4B", dy: "8.9%" },
  { t: "KNRI11.SA", n: "Kinea Renda Imobiliária", s: "Híbrido", mc: "3.8B", dy: "8.3%" },
  { t: "RZAK11.SA", n: "Riza Akin", s: "Papel", mc: "1.4B", dy: "15.0%" },
  { t: "HSML11.SA", n: "HSI Mall", s: "Shoppings", mc: "1.4B", dy: "8.6%" },
  { t: "GARE11.SA", n: "Guardian Logística e Renda Urbana", s: "Híbrido", mc: "1.3B", dy: "11.2%" },
  { t: "VILG11.SA", n: "Vinci Logística", s: "Logística", mc: "1.3B", dy: "8.5%" },
  { t: "DEVA11.SA", n: "Devant Recebíveis", s: "Papel", mc: "1.2B", dy: "11.8%" },
  { t: "HFOF11.SA", n: "Hedge Top FOFII 3", s: "Fundo de Fundos", mc: "1.2B", dy: "10.5%" },
  { t: "KNSC11.SA", n: "Kinea Securities", s: "Papel", mc: "1.2B", dy: "10.8%" },
  { t: "BARI11.SA", n: "Barigui Rendimentos Imobiliários", s: "Papel", mc: "1.1B", dy: "12.0%" }
];

const fetchYahoo = (ticker) => {
  return new Promise((resolve) => {
    https.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const meta = json.chart.result[0].meta;
          resolve(meta);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
};

async function main() {
  const assets = [];
  for (const fii of fiis) {
    const meta = await fetchYahoo(fii.t);
    const price = meta && meta.regularMarketPrice ? parseFloat(meta.regularMarketPrice).toFixed(2) : "0.00";
    
    assets.push(`    {
        ticker: "${fii.t}",
        type: "FIIs",
        name: "${fii.n}",
        price: "${price}",
        variation: "0.0",
        sector: "Fundos Imobiliários",
        exchange: "B3",
        sentiment: 50,
        bullCase: [],
        bearCase: [],
        logo: "https://ui-avatars.com/api/?name=${fii.t.replace('.SA','')}&background=334155&color=fff&bold=true",
        size: 15,
        cgId: "",
        aiPulse: "Análise automatizada pendente.",
        marketCap: "${fii.mc}",
        peRatio: "--",
        dividendYield: "${fii.dy}",
        lastUpdate: new Date().toLocaleDateString('pt-BR')
    }`);
  }
  
  fs.writeFileSync('c:/Users/Lucas/Documents/RASTRO/tmp/new_fiis.txt', assets.join(',\\n'));
}
main();
