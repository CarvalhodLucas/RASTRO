const fs = require('fs');

const dataTsContent = fs.readFileSync('c:/Users/Lucas/Documents/RASTRO/src/lib/data.ts', 'utf-8');

// A very simple regex to extract the b3Assets block and read tickers.
// Since data.ts exports b3Assets, we can try to require it if we transpile, or just run a simple regex match for FIIs.
// Actually, let's just match all ticker, name, sector strings that look like a FII.

const fiiRegex = /ticker:\s*"([^"]+11\.SA)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?sector:\s*"([^"]+)"/g;

let match;
const fiis = [];
while ((match = fiiRegex.exec(dataTsContent)) !== null) {
    fiis.push({
        ticker: match[1],
        name: match[2],
        sector: match[3]
    });
}

console.log(JSON.stringify(fiis, null, 2));
