const fs = require('fs');
const file = 'c:\\\\Users\\\\Henri\\\\Documents\\\\Programação\\\\Haumea Studies\\\\lib\\\\math-generators.ts';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split(/\\r?\\n/);

const replacement = [
    "    { id: 'fatoracao', name: 'Fatoração', iconName: 'Braces', description: 'Fatorar expressões algébricas', color: 'from-purple-500 to-indigo-500', category: 'algebra' },",
    "    { id: 'logaritmo', name: 'Logaritmos', iconName: 'TrendingUp', description: 'Propriedades e cálculo de logaritmos', color: 'from-blue-500 to-cyan-500', category: 'algebra' },",
    "    { id: 'potenciacao', name: 'Potenciação', iconName: 'Superscript', description: 'Propriedades de potências', color: 'from-slate-500 to-gray-600', category: 'algebra' },",
    "    { id: 'racionalizacao', name: 'Racionalização', iconName: 'Radical', description: 'Racionalizar denominadores', color: 'from-teal-500 to-cyan-500', category: 'algebra' },",
    "    { id: 'fracao', name: 'Frações', iconName: 'Divide', description: 'Operações com frações', color: 'from-amber-500 to-yellow-500', category: 'algebra' },",
    "    { id: 'equacoes_1grau', name: 'Equações 1º Grau', iconName: 'Equal', description: 'Resolver equações lineares', color: 'from-violet-500 to-purple-500', category: 'algebra' },",
    "    { id: 'equacoes_2grau', name: 'Equações 2º Grau', iconName: 'Sigma', description: 'Resolver equações quadráticas', color: 'from-rose-500 to-red-500', category: 'algebra' },",
    "    { id: 'pa_pg', name: 'PA e PG', iconName: 'ListOrdered', description: 'Progressões aritméticas e geométricas', color: 'from-sky-600 to-blue-400', category: 'algebra' },",
    "    { id: 'matrizes', name: 'Matrizes', iconName: 'Grid3X3', description: 'Operações e determinantes', color: 'from-stone-600 to-zinc-400', category: 'algebra' },"
];

lines.splice(51, 9, ...replacement);

fs.writeFileSync(file, lines.join('\\r\\n'), 'utf8');
