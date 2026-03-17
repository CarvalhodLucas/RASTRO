const fs = require('fs');
const path = require('path');
const targetPath = path.join(__dirname, 'src/lib/data.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// The bad entry starts with `    {
//         ticker: "ACWI11\nTREND ETF`
const badStart = content.indexOf('    {\\n        ticker: "ACWI11\\nTREND ETF');
const actualBadStart = content.indexOf('    {\\n        ticker: "ACWI11\\r\\n');

// Since the newlines might be mixed, let's use a regex to match from the `{ ticker: "ACWI11` down to the `}\n];` before cryptoAssets
const regex = /,\\s*\\{\\s*ticker:\\s*"ACWI11[\\s\\S]*?\\}\\s*\\];/;
content = content.replace(regex, '\\n];');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Cleaned up the bad entry.');
