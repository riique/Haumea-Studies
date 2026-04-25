const fs = require('fs');
const file = 'c:\\\\Users\\\\Henri\\\\Documents\\\\Programação\\\\Haumea Studies\\\\lib\\\\math-generators.ts';
let t = fs.readFileSync(file, 'utf8');

// Use regex matches to bypass invalid UTF-8 strings
t = t.replace(/\/\/ .*lgebra([\r\n]+)/g, '// Álgebra$1');
t = t.replace(/name: '.*lgebra'/g, "name: 'Álgebra'");

fs.writeFileSync(file, t, 'utf8');
