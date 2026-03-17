const fs = require('fs');
const dataFile = 'c:/Users/Lucas/Documents/RASTRO/src/lib/data.ts';
let content = fs.readFileSync(dataFile, 'utf-8');

// Replace the literal \n separators with real newlines
content = content.replace(/\},[ ]*\\n[ ]*\{/g, '},\n    {');

fs.writeFileSync(dataFile, content);
console.log('Cleaned up literal \\n in data.ts');
