const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Use string split and join instead of regex to avoid escaping errors
content = content.split('}, \\n    {').join('},\n    {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax by plain string replacement.');
