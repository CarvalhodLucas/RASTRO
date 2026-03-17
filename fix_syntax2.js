const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The file contains `}, \n    {` literally
content = content.replace(/\\},\\s*\\\\n\\s*\\{/g, '},\n    {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax errors in data.ts.');
