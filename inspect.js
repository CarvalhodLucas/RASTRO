const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'data.ts');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("Line 5001 characters:");
const line = lines[5000];
for (let i = 0; i < line.length; i++) {
    console.log(line[i], line.charCodeAt(i));
}
