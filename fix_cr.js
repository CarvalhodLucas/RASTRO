const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log(JSON.stringify(lines[5000])); // line 5001
console.log(JSON.stringify(lines[5001])); // line 5002

// Remove all \r globally since it's causing issues inside string literals
content = content.replace(/\\r/g, '');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed all carriage returns from data.ts');
