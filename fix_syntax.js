const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The issue is that the text file literally has `},\n    {`
// We need to replace it.
content = content.replace(/\\},\\\\n    \\{/g, '},\n    {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax errors.');
