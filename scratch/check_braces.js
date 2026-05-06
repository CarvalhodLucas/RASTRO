
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lucas de Carvalho/Documents/Sites/RASTRO/src/app/api/onchain/route.ts', 'utf8');

let open = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i+1];

    if (inComment) {
        if (inComment === 'single' && char === '\n') inComment = false;
        if (inComment === 'multi' && char === '*' && nextChar === '/') {
            inComment = false;
            i++;
        }
    } else if (inString) {
        if (char === '\\') i++;
        else if (char === stringChar) inString = false;
    } else {
        if (char === '/' && nextChar === '/') inComment = 'single';
        else if (char === '/' && nextChar === '*') { inComment = 'multi'; i++; }
        else if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
        }
        else if (char === '{') open++;
        else if (char === '}') open--;
    }
    if (char === '\n') lineNum++;
}

console.log(`Final open count: ${open}`);
console.log(`In string: ${inString} (${stringChar})`);
console.log(`In comment: ${inComment}`);
