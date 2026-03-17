const fs = require('fs');
const path = require('path');
const targetPath = path.join(__dirname, 'src/lib/data.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const start = content.indexOf('    {\\n        ticker: "ACWI11');
const start2 = content.indexOf('    {\\r\\n        ticker: "ACWI11');
const actualStart = start !== -1 ? start : start2;

if (actualStart !== -1) {
    const end = content.indexOf('];', actualStart);
    if (end !== -1) {
        content = content.slice(0, actualStart).trimEnd() + '\\n];' + content.slice(end + 2);
        fs.writeFileSync(targetPath, content, 'utf8');
        console.log('Cleaned up successfully.');
    } else {
        console.log('Could not find end.');
    }
} else {
    console.log('Could not find start.');
}
