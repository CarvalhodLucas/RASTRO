const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to find each asset object in b3Assets array
// This is tricky because the file is huge.
// I'll use a safer approach: line by line or simpler regex if possible.

// Actually, I'll just use a script that parses the file content and modifies the objects.
// Since it's a TS file exporting arrays, I can try to find where b3Assets starts and ends.

const b3Start = content.indexOf('export const b3Assets: Asset[] = [');
const b3End = content.indexOf('];', b3Start);

let b3Part = content.substring(b3Start, b3End + 2);

// Replace asset objects
// A simple regex approach for each object:
b3Part = b3Part.replace(/\{[\s\S]*?ticker:\s*"([^"]+)"[\s\S]*?\}/g, (match, ticker) => {
    if (match.includes('type:')) return match; // Already has type

    let type = "Ações";
    if (match.includes('sector: "ETF"')) {
        type = "ETFs";
    } else if (ticker.endsWith("11.SA")) {
        // Simple heuristic for B3: 11 is usually FII or Unit. 
        // User asked for Ações, FIIs, ETFs.
        // If it's not ETF, and ends in 11, we'll call it FIIs for the purpose of this filter.
        type = "FIIs";
    }

    // Insert type: "..." after ticker or at the end
    return match.replace(/(ticker:\s*"[^"]+",)/, `$1\n        type: "${type}",`);
});

const newContent = content.substring(0, b3Start) + b3Part + content.substring(b3End + 2);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Populated type property for B3 assets.');
