/**
 * Math Question Generators - Haumea Math
 * Geração 100% local de questões matemáticas (sem consumo de API)
 */

// Tipos base
export interface MathQuestion {
    id: string
    topic: TopicType
    question: string // LaTeX formatted
    answer: string | number
    answerDisplay: string // LaTeX formatted for display
    difficulty: 'easy' | 'medium' | 'hard'
    hint?: string
    steps?: string[] // Resolução passo a passo (LaTeX)
    choices?: string[] // Alternativas para múltipla escolha (LaTeX)
}

export type TopicType =
    | 'fatoracao'
    | 'logaritmo'
    | 'notacao_cientifica'
    | 'conversao_unidades'
    | 'trigonometria'
    | 'racionalizacao'
    | 'equacoes_1grau'
    | 'equacoes_2grau'
    | 'fracao'
    | 'potenciacao'
    | 'pa_pg'
    | 'funcoes'
    | 'geometria_analitica'
    | 'geometria_plana'
    | 'geometria_espacial'
    | 'probabilidade'
    | 'combinatoria'
    | 'porcentagem_juros'
    | 'estatistica'
    | 'matrizes'

export interface TopicConfig {
    id: TopicType
    name: string
    iconName: string // Nome do ícone Lucide
    description: string
    color: string
    category: 'algebra' | 'geometria' | 'analise' | 'estatistica_prob'
}

export const TOPICS: TopicConfig[] = [
    // Álgebra
    { id: 'fatoracao', name: 'Fatoração', iconName: 'Braces', description: 'Produtos notáveis e fatoração', color: 'from-blue-600 to-indigo-500', category: 'algebra' },
    { id: 'logaritmo', name: 'Logaritmos', iconName: 'Calculator', description: 'Propriedades e equações logarítmicas', color: 'from-sky-500 to-blue-500', category: 'algebra' },
    { id: 'potenciacao', name: 'Potenciação', iconName: 'TrendingUp', description: 'Regras de expoentes e raízes', color: 'from-indigo-500 to-purple-500', category: 'algebra' },
    { id: 'racionalizacao', name: 'Racionalização', iconName: 'Divide', description: 'Eliminando raízes do denominador', color: 'from-violet-500 to-fuchsia-500', category: 'algebra' },
    { id: 'fracao', name: 'Frações', iconName: 'PieChart', description: 'Operações com números racionais', color: 'from-blue-400 to-cyan-500', category: 'algebra' },
    { id: 'equacoes_1grau', name: 'Equações do 1º Grau', iconName: 'Scale', description: 'Resolvendo para x em equações lineares', color: 'from-slate-600 to-slate-400', category: 'algebra' },
    { id: 'equacoes_2grau', name: 'Equações do 2º Grau', iconName: 'Calculator', description: 'Bhaskara e raízes quadráticas', color: 'from-zinc-500 to-stone-400', category: 'algebra' },
    { id: 'pa_pg', name: 'PA e PG', iconName: 'ArrowUpRight', description: 'Progressões aritméticas e geométricas', color: 'from-teal-500 to-emerald-500', category: 'algebra' },
    { id: 'matrizes', name: 'Matrizes', iconName: 'LayoutGrid', description: 'Operações e determinantes', color: 'from-blue-700 to-indigo-700', category: 'algebra' },

    // Análise / Funções
    { id: 'funcoes', name: 'Funções', iconName: 'Activity', description: 'Domínio, imagem, composição e inversa', color: 'from-emerald-600 to-green-400', category: 'analise' },
    { id: 'trigonometria', name: 'Trigonometria', iconName: 'Triangle', description: 'Sen, Cos, Tan e ângulos notáveis', color: 'from-red-500 to-pink-500', category: 'analise' },
    { id: 'notacao_cientifica', name: 'Notação Científica', iconName: 'Atom', description: 'Operações com potências de 10', color: 'from-green-500 to-emerald-500', category: 'analise' },
    { id: 'conversao_unidades', name: 'Conversão de Unidades', iconName: 'ArrowLeftRight', description: 'Converter entre unidades físicas', color: 'from-yellow-500 to-orange-500', category: 'analise' },
    { id: 'porcentagem_juros', name: 'Porcentagem e Juros', iconName: 'Percent', description: 'Porcentagem, juros simples e compostos', color: 'from-lime-600 to-green-500', category: 'analise' },

    // Geometria
    { id: 'geometria_analitica', name: 'Geometria Analítica', iconName: 'Axis3d', description: 'Distância, reta, circunferência', color: 'from-orange-600 to-amber-400', category: 'geometria' },
    { id: 'geometria_plana', name: 'Geometria Plana', iconName: 'Triangle', description: 'Áreas, perímetros e Teorema de Pitágoras', color: 'from-orange-500 to-yellow-400', category: 'geometria' },
    { id: 'geometria_espacial', name: 'Geometria Espacial', iconName: 'Axis3d', description: 'Volumes e área total de sólidos', color: 'from-amber-600 to-orange-500', category: 'geometria' },

    // Estatística & Probabilidade
    { id: 'probabilidade', name: 'Probabilidade', iconName: 'Dices', description: 'Eventos e cálculo de probabilidades', color: 'from-fuchsia-600 to-pink-400', category: 'estatistica_prob' },
    { id: 'combinatoria', name: 'Análise Combinatória', iconName: 'Layers', description: 'Arranjo, combinação e permutação', color: 'from-indigo-600 to-violet-400', category: 'estatistica_prob' },
    { id: 'estatistica', name: 'Estatística', iconName: 'BarChart3', description: 'Média, mediana, moda e desvio', color: 'from-cyan-600 to-teal-400', category: 'estatistica_prob' },
]

export const TOPIC_CATEGORIES = [
    { id: 'algebra' as const, name: 'Álgebra' },
    { id: 'analise' as const, name: 'Análise & Funções' },
    { id: 'geometria' as const, name: 'Geometria' },
    { id: 'estatistica_prob' as const, name: 'Estatística & Probabilidade' },
]

// Utilidades
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function gcd(a: number, b: number): number {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) {
        const t = b
        b = a % b
        a = t
    }
    return a
}

function simplifyFraction(num: number, den: number): [number, number] {
    const g = gcd(num, den)
    return [num / g, den / g]
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 15)
}

// ===== VARIACAO DE ENUNCIADOS =====

type LeadRewriteRule = {
    pattern: RegExp
    replacements: string[]
}

const QUESTION_OPENERS = [
    '',
    '',
    'Desafio rapido:',
    'Exercicio:',
    'Treino guiado:',
    'Questao direta:',
    'Hora de praticar:',
    'Atividade do dia:',
    'Pratica orientada:',
    'Foco no vestibular:',
    'Aplique os conceitos:',
    'Resolucao objetiva:',
    'Concentre-se no enunciado:',
]

const TOPIC_OPENERS: Record<TopicType, string[]> = {
    fatoracao: ['Algebra em foco:', 'Treino de fatoracao:', 'Expressao para fatorar:'],
    logaritmo: ['Logaritmos na pratica:', 'Treino de propriedades logaritmicas:', 'Resolva com base em logaritmos:'],
    notacao_cientifica: ['Notacao cientifica em acao:', 'Padrao de potencias de 10:', 'Treino de escala numerica:'],
    conversao_unidades: ['Conversao de unidades:', 'Atencao aos fatores de conversao:', 'Transforme para a unidade pedida:'],
    trigonometria: ['Trigonometria aplicada:', 'Use relacoes trigonometricas:', 'Treino com angulos e razoes:'],
    racionalizacao: ['Racionalizacao de denominadores:', 'Manipulacao de radicais:', 'Simplifique os radicais:'],
    equacoes_1grau: ['Equacao linear:', 'Resolucao algebrica direta:', 'Isole a variavel:'],
    equacoes_2grau: ['Equacao quadratica:', 'Raizes da equacao:', 'Treino de segundo grau:'],
    fracao: ['Operacoes com fracoes:', 'Numerador e denominador em foco:', 'Simplifique fracoes:'],
    potenciacao: ['Propriedades de potencias:', 'Expoentes em pratica:', 'Treino de potenciacao:'],
    pa_pg: ['Progressao numerica:', 'Sequencias e padroes:', 'PA e PG em pratica:'],
    funcoes: ['Funcoes em destaque:', 'Analise funcional:', 'Manipule a funcao pedida:'],
    geometria_analitica: ['Plano cartesiano:', 'Geometria analitica:', 'Pontos, retas e distancias:'],
    geometria_plana: ['Geometria plana:', 'Áreas e perímetros:', 'Figuras planas em foco:'],
    geometria_espacial: ['Geometria espacial:', 'Solidos geometricos:', 'Volumes e áreas totais:'],
    probabilidade: ['Probabilidade aplicada:', 'Eventos e chances:', 'Conte os casos favoraveis:'],
    combinatoria: ['Contagem combinatoria:', 'Principio multiplicativo:', 'Arranjos, combinacoes e permutacoes:'],
    porcentagem_juros: ['Porcentagem e juros:', 'Variacao percentual:', 'Financas matematicas:'],
    estatistica: ['Estatistica descritiva:', 'Medidas de tendencia central:', 'Interpretacao de dados:'],
    matrizes: ['Matrizes e operacoes:', 'Algebra matricial:', 'Calculo com matrizes:'],
}

const CLOSERS_BY_DIFFICULTY: Record<MathQuestion['difficulty'], string[]> = {
    easy: ['', '', 'Informe apenas a resposta final.'],
    medium: ['', 'Responda na forma mais simples.', 'Apresente somente o resultado final.'],
    hard: ['Organize a resposta final de forma clara.', 'Se possivel, deixe na forma reduzida.', 'Apresente o resultado com rigor.'],
}

const LEAD_REWRITE_RULES: LeadRewriteRule[] = [
    {
        pattern: /^calcule e deixe em nota[cç][aã]o cient[iií]fica/i,
        replacements: [
            'Determine e escreva em notacao cientifica',
            'Efetue e expresse em notacao cientifica',
            'Calcule e apresente em notacao cientifica',
            'Resolva e registre em notacao cientifica',
        ]
    },
    {
        pattern: /^calcule\b/i,
        replacements: [
            'Determine',
            'Encontre',
            'Obtenha',
            'Avalie',
            'Calcule',
        ]
    },
    {
        pattern: /^resolva a equa\S*/i,
        replacements: [
            'Resolva a equacao',
            'Determine as solucoes da equacao',
            'Encontre as raizes da equacao',
            'Obtenha as solucoes da equacao',
        ]
    },
    {
        pattern: /^resolva\b/i,
        replacements: [
            'Resolva',
            'Determine',
            'Encontre',
            'Obtenha',
            'Ache',
        ]
    },
    {
        pattern: /^fatore\b/i,
        replacements: [
            'Fatore',
            'Decomponha',
            'Escreva na forma fatorada',
            'Reescreva fatorando',
        ]
    },
    {
        pattern: /^simplifique\b/i,
        replacements: [
            'Simplifique',
            'Reduza',
            'Reescreva na forma mais simples',
            'Transforme na forma simplificada',
        ]
    },
    {
        pattern: /^converta\b/i,
        replacements: [
            'Converta',
            'Transforme',
            'Reescreva',
            'Passe',
        ]
    },
    {
        pattern: /^escreva\b/i,
        replacements: [
            'Escreva',
            'Represente',
            'Expresse',
            'Apresente',
        ]
    },
    {
        pattern: /^encontre\b/i,
        replacements: [
            'Encontre',
            'Determine',
            'Obtenha',
            'Calcule',
        ]
    },
    {
        pattern: /^determine\b/i,
        replacements: [
            'Determine',
            'Encontre',
            'Obtenha',
            'Calcule',
        ]
    },
    {
        pattern: /^de quantas formas\b/i,
        replacements: [
            'De quantas formas',
            'De quantas maneiras distintas',
            'De quantos modos',
            'Quantas formas diferentes',
        ]
    },
    {
        pattern: /^uma urna tem\b/i,
        replacements: [
            'Uma urna tem',
            'Considere uma urna com',
            'Em uma urna ha',
            'Dada uma urna com',
        ]
    },
    {
        pattern: /^ao lan(?:c|ç)ar\b/i,
        replacements: [
            'Ao lancar',
            'No lancamento de',
            'Lancando',
        ]
    },
]

function rewriteQuestionLead(question: string): string {
    for (const rule of LEAD_REWRITE_RULES) {
        if (rule.pattern.test(question)) {
            return question.replace(rule.pattern, randomChoice(rule.replacements))
        }
    }
    return question
}

function diversifyQuestionText(
    question: string,
    topic: TopicType,
    difficulty: MathQuestion['difficulty']
): string {
    let variant = rewriteQuestionLead(question.trim())

    const openerPool = [...QUESTION_OPENERS, ...TOPIC_OPENERS[topic]]
    const opener = randomChoice(openerPool)
    if (opener) {
        variant = `${opener} ${variant}`
    }

    const closer = randomChoice(CLOSERS_BY_DIFFICULTY[difficulty])
    if (closer) {
        const separator = /[.!?]$/.test(variant) ? ' ' : '. '
        variant = `${variant}${separator}${closer}`
    }

    return variant
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([:;,.!?])/g, '$1')
        .trim()
}

// ===== GERADORES =====

// 1. FATORAÇÃO
function generateFatoracao(): MathQuestion {
    const type = randomChoice(['diferenca_quadrados', 'trinomio_perfeito', 'fator_comum'])

    if (type === 'diferenca_quadrados') {
        const a = randomInt(2, 8)
        const b = randomInt(2, 8)
        const expanded = `${a * a}x^2 - ${b * b}`
        const factored = `(${a}x + ${b})(${a}x - ${b})`
        return {
            id: generateId(),
            topic: 'fatoracao',
            question: `Fatore a expressão: $$${expanded}$$`,
            answer: factored,
            answerDisplay: `$$${factored}$$`,
            difficulty: 'medium',
            hint: 'Esta é uma diferença de quadrados: a² - b² = (a+b)(a-b)'
        }
    } else if (type === 'trinomio_perfeito') {
        const a = randomInt(1, 5)
        const b = randomInt(1, 6)
        const sign = randomChoice(['+', '-'])
        const middle = 2 * a * b
        const expanded = `${a * a}x^2 ${sign} ${middle}x + ${b * b}`
        const factored = sign === '+' ? `(${a}x + ${b})^2` : `(${a}x - ${b})^2`
        return {
            id: generateId(),
            topic: 'fatoracao',
            question: `Fatore a expressão: $$${expanded}$$`,
            answer: factored,
            answerDisplay: `$$${factored}$$`,
            difficulty: 'medium',
            hint: 'Este é um trinômio quadrado perfeito: a² ± 2ab + b² = (a ± b)²'
        }
    } else {
        const factor = randomInt(2, 6)
        const a = randomInt(1, 5)
        const b = randomInt(1, 5)
        const expanded = `${factor * a}x + ${factor * b}`
        const factored = `${factor}(${a}x + ${b})`
        return {
            id: generateId(),
            topic: 'fatoracao',
            question: `Fatore a expressão: $$${expanded}$$`,
            answer: factored,
            answerDisplay: `$$${factored}$$`,
            difficulty: 'easy',
            hint: 'Identifique o fator comum entre os termos'
        }
    }
}

// 2. LOGARITMOS
function generateLogaritmo(): MathQuestion {
    const type = randomChoice(['definicao', 'produto', 'quociente', 'potencia'])

    if (type === 'definicao') {
        const bases = [2, 3, 4, 5, 10]
        const base = randomChoice(bases)
        const exp = randomInt(1, 4)
        const result = Math.pow(base, exp)
        return {
            id: generateId(),
            topic: 'logaritmo',
            question: `Calcule: $$\\log_{${base}}(${result})$$`,
            answer: exp,
            answerDisplay: `$$${exp}$$`,
            difficulty: 'easy',
            hint: `Se log_b(x) = y, então b^y = x. Qual potência de ${base} resulta em ${result}?`
        }
    } else if (type === 'produto') {
        const base = randomChoice([2, 10])
        const a = randomInt(2, 5)
        const b = randomInt(2, 5)
        const answer = `\\log_{${base}}(${a}) + \\log_{${base}}(${b})`
        return {
            id: generateId(),
            topic: 'logaritmo',
            question: `Simplifique usando propriedades: $$\\log_{${base}}(${a} \\cdot ${b})$$`,
            answer: answer,
            answerDisplay: `$$${answer}$$`,
            difficulty: 'medium',
            hint: 'log(a·b) = log(a) + log(b)'
        }
    } else if (type === 'quociente') {
        const base = randomChoice([2, 10])
        const a = randomInt(4, 16)
        const b = randomInt(2, 4)
        const answer = `\\log_{${base}}(${a}) - \\log_{${base}}(${b})`
        return {
            id: generateId(),
            topic: 'logaritmo',
            question: `Simplifique usando propriedades: $$\\log_{${base}}\\left(\\frac{${a}}{${b}}\\right)$$`,
            answer: answer,
            answerDisplay: `$$${answer}$$`,
            difficulty: 'medium',
            hint: 'log(a/b) = log(a) - log(b)'
        }
    } else {
        const base = randomChoice([2, 3, 10])
        const a = randomInt(2, 5)
        const n = randomInt(2, 4)
        const answer = `${n} \\cdot \\log_{${base}}(${a})`
        return {
            id: generateId(),
            topic: 'logaritmo',
            question: `Simplifique usando propriedades: $$\\log_{${base}}(${a}^{${n}})$$`,
            answer: answer,
            answerDisplay: `$$${answer}$$`,
            difficulty: 'medium',
            hint: 'log(a^n) = n·log(a)'
        }
    }
}

// 3. NOTAÇÃO CIENTÍFICA
function generateNotacaoCientifica(): MathQuestion {
    const type = randomChoice(['converter_para', 'converter_de', 'multiplicacao', 'divisao'])

    if (type === 'converter_para') {
        const mantissa = randomInt(1, 9)
        const exp = randomInt(3, 8)
        const number = mantissa * Math.pow(10, exp)
        const formatted = number.toLocaleString('pt-BR')
        return {
            id: generateId(),
            topic: 'notacao_cientifica',
            question: `Escreva em notação científica: $$${formatted}$$`,
            answer: `${mantissa} \\times 10^{${exp}}`,
            answerDisplay: `$$${mantissa} \\times 10^{${exp}}$$`,
            difficulty: 'easy',
            hint: 'Mova a vírgula até ter um número entre 1 e 10'
        }
    } else if (type === 'converter_de') {
        const mantissa = randomInt(1, 9) + randomInt(1, 9) / 10
        const exp = randomInt(-4, -1)
        const number = mantissa * Math.pow(10, exp)
        return {
            id: generateId(),
            topic: 'notacao_cientifica',
            question: `Converta para forma decimal: $$${mantissa} \\times 10^{${exp}}$$`,
            answer: number,
            answerDisplay: `$$${number}$$`,
            difficulty: 'easy',
            hint: 'Expoente negativo = mover vírgula para esquerda'
        }
    } else if (type === 'multiplicacao') {
        const m1 = randomInt(2, 5)
        const e1 = randomInt(2, 5)
        const m2 = randomInt(2, 5)
        const e2 = randomInt(2, 5)
        const resultM = m1 * m2
        const resultE = e1 + e2
        // Normalizar se necessário
        let finalM = resultM
        let finalE = resultE
        while (finalM >= 10) {
            finalM /= 10
            finalE += 1
        }
        return {
            id: generateId(),
            topic: 'notacao_cientifica',
            question: `Calcule e deixe em notação científica: $$(${m1} \\times 10^{${e1}}) \\cdot (${m2} \\times 10^{${e2}})$$`,
            answer: `${finalM} \\times 10^{${finalE}}`,
            answerDisplay: `$$${finalM} \\times 10^{${finalE}}$$`,
            difficulty: 'medium',
            hint: 'Multiplique as mantissas e some os expoentes'
        }
    } else {
        const m1 = randomInt(4, 9)
        const e1 = randomInt(5, 8)
        const m2 = randomInt(2, 4)
        const e2 = randomInt(2, 4)
        const resultM = m1 / m2
        const resultE = e1 - e2
        return {
            id: generateId(),
            topic: 'notacao_cientifica',
            question: `Calcule: $$\\frac{${m1} \\times 10^{${e1}}}{${m2} \\times 10^{${e2}}}$$`,
            answer: `${resultM} \\times 10^{${resultE}}`,
            answerDisplay: `$$${resultM} \\times 10^{${resultE}}$$`,
            difficulty: 'medium',
            hint: 'Divida as mantissas e subtraia os expoentes'
        }
    }
}

// 4. CONVERSÃO DE UNIDADES
function generateConversaoUnidades(): MathQuestion {
    const type = randomChoice(['velocidade', 'área', 'volume', 'comprimento'])

    if (type === 'velocidade') {
        // km/h para m/s (dividir por 3.6)
        const direction = randomChoice(['km_to_m', 'm_to_km'])
        if (direction === 'km_to_m') {
            const kmh = randomChoice([36, 72, 90, 108, 180, 360])
            const ms = kmh / 3.6
            return {
                id: generateId(),
                topic: 'conversao_unidades',
                question: `Converta para m/s: $$${kmh} \\text{ km/h}$$`,
                answer: ms,
                answerDisplay: `$$${ms} \\text{ m/s}$$`,
                difficulty: 'easy',
                hint: 'Divida por 3,6 para converter km/h em m/s'
            }
        } else {
            const ms = randomChoice([5, 10, 15, 20, 25, 30])
            const kmh = ms * 3.6
            return {
                id: generateId(),
                topic: 'conversao_unidades',
                question: `Converta para km/h: $$${ms} \\text{ m/s}$$`,
                answer: kmh,
                answerDisplay: `$$${kmh} \\text{ km/h}$$`,
                difficulty: 'easy',
                hint: 'Multiplique por 3,6 para converter m/s em km/h'
            }
        }
    } else if (type === 'área') {
        const m2 = randomChoice([1, 2, 5, 10])
        const cm2 = m2 * 10000
        const direction = randomChoice(['m_to_cm', 'cm_to_m'])
        if (direction === 'm_to_cm') {
            return {
                id: generateId(),
                topic: 'conversao_unidades',
                question: `Converta para cm²: $$${m2} \\text{ m}^2$$`,
                answer: cm2,
                answerDisplay: `$$${cm2} \\text{ cm}^2$$`,
                difficulty: 'medium',
                hint: '1 m² = 10.000 cm² (100²)'
            }
        } else {
            return {
                id: generateId(),
                topic: 'conversao_unidades',
                question: `Converta para m²: $$${cm2} \\text{ cm}^2$$`,
                answer: m2,
                answerDisplay: `$$${m2} \\text{ m}^2$$`,
                difficulty: 'medium',
                hint: '10.000 cm² = 1 m²'
            }
        }
    } else if (type === 'volume') {
        const L = randomChoice([1, 2, 3, 5])
        const mL = L * 1000
        const cm3 = mL // 1 mL = 1 cm³
        return {
            id: generateId(),
            topic: 'conversao_unidades',
            question: `Converta para cm³ (ou mL): $$${L} \\text{ L}$$`,
            answer: mL,
            answerDisplay: `$$${mL} \\text{ cm}^3 \\text{ (ou mL)}$$`,
            difficulty: 'easy',
            hint: '1 L = 1000 mL = 1000 cm³'
        }
    } else {
        const km = randomChoice([1, 2, 5, 10])
        const m = km * 1000
        return {
            id: generateId(),
            topic: 'conversao_unidades',
            question: `Converta para metros: $$${km} \\text{ km}$$`,
            answer: m,
            answerDisplay: `$$${m} \\text{ m}$$`,
            difficulty: 'easy',
            hint: '1 km = 1000 m'
        }
    }
}

// 5. TRIGONOMETRIA
function generateTrigonometria(): MathQuestion {
    const angles = [
        { deg: 30, sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}' },
        { deg: 45, sin: '\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '1' },
        { deg: 60, sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '\\sqrt{3}' },
        { deg: 0, sin: '0', cos: '1', tan: '0' },
        { deg: 90, sin: '1', cos: '0', tan: '\\text{não existe}' },
    ]

    const angle = randomChoice(angles)
    const func = randomChoice(['sin', 'cos', 'tan'] as const)
    const funcName = { sin: '\\sin', cos: '\\cos', tan: '\\tan' }[func]
    const value = angle[func]

    // Redução ao primeiro quadrante
    const useReduction = Math.random() > 0.5 && angle.deg !== 0 && angle.deg !== 90

    if (useReduction) {
        const quadrant = randomChoice([2, 3, 4])
        let newAngle: number
        let sign: string

        if (quadrant === 2) {
            newAngle = 180 - angle.deg
            sign = func === 'sin' ? '+' : '-'
        } else if (quadrant === 3) {
            newAngle = 180 + angle.deg
            sign = func === 'tan' ? '+' : '-'
        } else {
            newAngle = 360 - angle.deg
            sign = func === 'cos' ? '+' : '-'
        }

        const adjustedValue = sign === '-' ? `-${value}` : value

        return {
            id: generateId(),
            topic: 'trigonometria',
            question: `Calcule: $$${funcName}(${newAngle}°)$$`,
            answer: adjustedValue,
            answerDisplay: `$$${adjustedValue}$$`,
            difficulty: 'hard',
            hint: `Reduza ${newAngle}° ao 1º quadrante e considere o sinal no ${quadrant}º quadrante`
        }
    }

    return {
        id: generateId(),
        topic: 'trigonometria',
        question: `Calcule: $$${funcName}(${angle.deg}°)$$`,
        answer: value,
        answerDisplay: `$$${value}$$`,
        difficulty: 'easy',
        hint: 'Use a tabela de ângulos notáveis'
    }
}

// 6. RACIONALIZAÇÃO
function generateRacionalizacao(): MathQuestion {
    const type = randomChoice(['simples', 'conjugado'])

    if (type === 'simples') {
        const a = randomInt(1, 6)
        const b = randomChoice([2, 3, 5, 7])
        const answer = `\\frac{${a}\\sqrt{${b}}}{${b}}`
        return {
            id: generateId(),
            topic: 'racionalizacao',
            question: `Racionalize o denominador: $$\\frac{${a}}{\\sqrt{${b}}}$$`,
            answer: answer,
            answerDisplay: `$$${answer}$$`,
            difficulty: 'easy',
            hint: 'Multiplique numerador e denominador por √b'
        }
    } else {
        const a = randomInt(1, 5)
        const b = randomInt(1, 4)
        const sign = randomChoice(['+', '-'])
        const otherSign = sign === '+' ? '-' : '+'
        // Conjugado de (a + √b) é (a - √b)
        const denom = a * a - b // (a+√b)(a-√b) = a² - b
        const numerator = sign === '+' ? `${a} ${otherSign} \\sqrt{${b}}` : `${a} ${otherSign} \\sqrt{${b}}`
        return {
            id: generateId(),
            topic: 'racionalizacao',
            question: `Racionalize: $$\\frac{1}{${a} ${sign} \\sqrt{${b}}}$$`,
            answer: `\\frac{${numerator}}{${Math.abs(denom)}}`,
            answerDisplay: `$$\\frac{${numerator}}{${Math.abs(denom)}}$$`,
            difficulty: 'medium',
            hint: 'Multiplique pelo conjugado do denominador'
        }
    }
}

// 7. EQUAÇÕES 1º GRAU
function generateEquacao1Grau(): MathQuestion {
    const a = randomInt(2, 8)
    const b = randomInt(-10, 10)
    const x = randomInt(-5, 10)
    const c = a * x + b

    const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`

    return {
        id: generateId(),
        topic: 'equacoes_1grau',
        question: `Resolva a equação: $$${a}x ${bStr} = ${c}$$`,
        answer: x,
        answerDisplay: `$$x = ${x}$$`,
        difficulty: 'easy',
        hint: 'Isole o x: passe o termo independente para o outro lado e divida pelo coeficiente'
    }
}

// 8. EQUAÇÕES 2º GRAU
function generateEquacao2Grau(): MathQuestion {
    // Gerar raízes inteiras para facilitar
    const x1 = randomInt(-5, 5)
    const x2 = randomInt(-5, 5)

    // (x - x1)(x - x2) = x² - (x1+x2)x + x1*x2
    const a = 1
    const b = -(x1 + x2)
    const c = x1 * x2

    const bStr = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`

    const roots = x1 <= x2 ? `x = ${x1} \\text{ ou } x = ${x2}` : `x = ${x2} \\text{ ou } x = ${x1}`

    return {
        id: generateId(),
        topic: 'equacoes_2grau',
        question: `Resolva a equação: $$x^2 ${bStr} ${cStr} = 0$$`,
        answer: roots,
        answerDisplay: `$$${roots}$$`,
        difficulty: x1 === x2 ? 'easy' : 'medium',
        hint: 'Use a fórmula de Bhaskara: x = (-b ± √Δ) / 2a, onde Δ = b² - 4ac'
    }
}

// 9. FRAÇÕES
function generateFracao(): MathQuestion {
    const type = randomChoice(['soma', 'subtracao', 'multiplicacao', 'divisao'])

    const [n1, d1] = [randomInt(1, 5), randomInt(2, 6)]
    const [n2, d2] = [randomInt(1, 5), randomInt(2, 6)]

    if (type === 'soma') {
        const num = n1 * d2 + n2 * d1
        const den = d1 * d2
        const [sn, sd] = simplifyFraction(num, den)
        return {
            id: generateId(),
            topic: 'fracao',
            question: `Calcule: $$\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}$$`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$\\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'Encontre o MMC dos denominadores e some os numeradores ajustados'
        }
    } else if (type === 'subtracao') {
        const num = n1 * d2 - n2 * d1
        const den = d1 * d2
        const [sn, sd] = simplifyFraction(num, den)
        return {
            id: generateId(),
            topic: 'fracao',
            question: `Calcule: $$\\frac{${n1}}{${d1}} - \\frac{${n2}}{${d2}}$$`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$\\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'Encontre o MMC dos denominadores e subtraia os numeradores ajustados'
        }
    } else if (type === 'multiplicacao') {
        const num = n1 * n2
        const den = d1 * d2
        const [sn, sd] = simplifyFraction(num, den)
        return {
            id: generateId(),
            topic: 'fracao',
            question: `Calcule: $$\\frac{${n1}}{${d1}} \\times \\frac{${n2}}{${d2}}$$`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$\\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'Multiplique numerador por numerador e denominador por denominador'
        }
    } else {
        const num = n1 * d2
        const den = d1 * n2
        const [sn, sd] = simplifyFraction(num, den)
        return {
            id: generateId(),
            topic: 'fracao',
            question: `Calcule: $$\\frac{${n1}}{${d1}} \\div \\frac{${n2}}{${d2}}$$`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$\\frac{${sn}}{${sd}}$$`,
            difficulty: 'medium',
            hint: 'Divisão de frações: multiplique pela inversa da segunda fração'
        }
    }
}

// 10. POTENCIAÇÃO
function generatePotenciacao(): MathQuestion {
    const type = randomChoice(['produto_mesma_base', 'quociente_mesma_base', 'potencia_potencia', 'expoente_negativo'])

    if (type === 'produto_mesma_base') {
        const base = randomInt(2, 5)
        const e1 = randomInt(2, 5)
        const e2 = randomInt(2, 5)
        return {
            id: generateId(),
            topic: 'potenciacao',
            question: `Simplifique: $$${base}^{${e1}} \\cdot ${base}^{${e2}}$$`,
            answer: `${base}^{${e1 + e2}}`,
            answerDisplay: `$$${base}^{${e1 + e2}}$$`,
            difficulty: 'easy',
            hint: 'Mesma base: some os expoentes'
        }
    } else if (type === 'quociente_mesma_base') {
        const base = randomInt(2, 5)
        const e1 = randomInt(4, 8)
        const e2 = randomInt(1, 3)
        return {
            id: generateId(),
            topic: 'potenciacao',
            question: `Simplifique: $$\\frac{${base}^{${e1}}}{${base}^{${e2}}}$$`,
            answer: `${base}^{${e1 - e2}}`,
            answerDisplay: `$$${base}^{${e1 - e2}}$$`,
            difficulty: 'easy',
            hint: 'Mesma base: subtraia os expoentes'
        }
    } else if (type === 'potencia_potencia') {
        const base = randomInt(2, 4)
        const e1 = randomInt(2, 4)
        const e2 = randomInt(2, 3)
        return {
            id: generateId(),
            topic: 'potenciacao',
            question: `Simplifique: $$(${base}^{${e1}})^{${e2}}$$`,
            answer: `${base}^{${e1 * e2}}`,
            answerDisplay: `$$${base}^{${e1 * e2}}$$`,
            difficulty: 'easy',
            hint: 'Potência de potência: multiplique os expoentes'
        }
    } else {
        const base = randomInt(2, 5)
        const exp = randomInt(1, 3)
        const result = Math.pow(base, exp)
        return {
            id: generateId(),
            topic: 'potenciacao',
            question: `Calcule: $$${base}^{-${exp}}$$`,
            answer: `\\frac{1}{${result}}`,
            answerDisplay: `$$\\frac{1}{${result}}$$`,
            difficulty: 'medium',
            hint: 'Expoente negativo = inverso da base elevada ao expoente positivo'
        }
    }
}

// ===== NOVOS GERADORES =====

// 11. PA e PG
function generatePaPg(): MathQuestion {
    const type = randomChoice(['pa_termo', 'pa_soma', 'pg_termo', 'pg_soma'])

    if (type === 'pa_termo') {
        const a1 = randomInt(1, 10)
        const r = randomInt(2, 6)
        const n = randomInt(5, 15)
        const an = a1 + (n - 1) * r
        return {
            id: generateId(),
            topic: 'pa_pg',
            question: `Em uma PA com $a_1 = ${a1}$ e razão $r = ${r}$, encontre $a_{${n}}$.`,
            answer: an,
            answerDisplay: `$$a_{${n}} = ${an}$$`,
            difficulty: 'easy',
            hint: 'Use a fórmula do termo geral: aₙ = a₁ + (n-1)·r',
            steps: [
                `Fórmula do termo geral: $$a_n = a_1 + (n - 1) \\cdot r$$`,
                `Substituindo: $$a_{${n}} = ${a1} + (${n} - 1) \\cdot ${r}$$`,
                `$$a_{${n}} = ${a1} + ${n - 1} \\cdot ${r}$$`,
                `$$a_{${n}} = ${a1} + ${(n - 1) * r} = ${an}$$`
            ]
        }
    } else if (type === 'pa_soma') {
        const a1 = randomInt(1, 5)
        const r = randomInt(2, 4)
        const n = randomInt(5, 10)
        const an = a1 + (n - 1) * r
        const soma = (a1 + an) * n / 2
        return {
            id: generateId(),
            topic: 'pa_pg',
            question: `Calcule a soma dos ${n} primeiros termos da PA: $$(${a1},\\; ${a1 + r},\\; ${a1 + 2 * r},\\; ...)$$`,
            answer: soma,
            answerDisplay: `$$S_{${n}} = ${soma}$$`,
            difficulty: 'medium',
            hint: 'Sₙ = (a₁ + aₙ) · n / 2. Primeiro encontre aₙ.',
            steps: [
                `Primeiro, calcule $a_{${n}}$: $$a_{${n}} = ${a1} + (${n}-1) \\cdot ${r} = ${an}$$`,
                `Fórmula da soma: $$S_n = \\frac{(a_1 + a_n) \\cdot n}{2}$$`,
                `$$S_{${n}} = \\frac{(${a1} + ${an}) \\cdot ${n}}{2} = \\frac{${a1 + an} \\cdot ${n}}{2} = ${soma}$$`
            ]
        }
    } else if (type === 'pg_termo') {
        const a1 = randomInt(1, 4)
        const q = randomInt(2, 3)
        const n = randomInt(3, 6)
        const an = a1 * Math.pow(q, n - 1)
        return {
            id: generateId(),
            topic: 'pa_pg',
            question: `Em uma PG com $a_1 = ${a1}$ e razão $q = ${q}$, encontre $a_{${n}}$.`,
            answer: an,
            answerDisplay: `$$a_{${n}} = ${an}$$`,
            difficulty: 'easy',
            hint: 'Use a fórmula do termo geral: aₙ = a₁ · q^(n-1)',
            steps: [
                `Fórmula: $$a_n = a_1 \\cdot q^{n-1}$$`,
                `$$a_{${n}} = ${a1} \\cdot ${q}^{${n - 1}}$$`,
                `$$a_{${n}} = ${a1} \\cdot ${Math.pow(q, n - 1)} = ${an}$$`
            ]
        }
    } else {
        const a1 = randomInt(1, 3)
        const q = randomInt(2, 3)
        const n = randomInt(3, 5)
        const soma = a1 * (Math.pow(q, n) - 1) / (q - 1)
        return {
            id: generateId(),
            topic: 'pa_pg',
            question: `Calcule a soma dos ${n} primeiros termos da PG: $$(${a1},\\; ${a1 * q},\\; ${a1 * q * q},\\; ...)$$`,
            answer: soma,
            answerDisplay: `$$S_{${n}} = ${soma}$$`,
            difficulty: 'medium',
            hint: 'Sₙ = a₁ · (qⁿ - 1) / (q - 1)',
            steps: [
                `Fórmula: $$S_n = a_1 \\cdot \\frac{q^n - 1}{q - 1}$$`,
                `$$S_{${n}} = ${a1} \\cdot \\frac{${q}^{${n}} - 1}{${q} - 1}$$`,
                `$$S_{${n}} = ${a1} \\cdot \\frac{${Math.pow(q, n)} - 1}{${q - 1}} = ${a1} \\cdot \\frac{${Math.pow(q, n) - 1}}{${q - 1}} = ${soma}$$`
            ]
        }
    }
}

// 12. FUNÇÕES
function generateFuncoes(): MathQuestion {
    const type = randomChoice(['avaliar', 'composicao', 'inversa'])

    if (type === 'avaliar') {
        const a = randomInt(2, 5)
        const b = randomInt(-5, 5)
        const x = randomInt(-3, 5)
        const result = a * x + b
        const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`
        return {
            id: generateId(),
            topic: 'funcoes',
            question: `Dada $f(x) = ${a}x ${bStr}$, calcule $f(${x})$.`,
            answer: result,
            answerDisplay: `$$f(${x}) = ${result}$$`,
            difficulty: 'easy',
            hint: 'Substitua o valor de x na função',
            steps: [
                `$$f(x) = ${a}x ${bStr}$$`,
                `$$f(${x}) = ${a} \\cdot (${x}) ${bStr}$$`,
                `$$f(${x}) = ${a * x} ${bStr} = ${result}$$`
            ]
        }
    } else if (type === 'composicao') {
        const a1 = randomInt(2, 4)
        const b1 = randomInt(1, 3)
        const a2 = randomInt(1, 3)
        const b2 = randomInt(-3, 3)
        const x = randomInt(1, 4)
        const gx = a2 * x + b2
        const fogx = a1 * gx + b1
        const b1Str = b1 >= 0 ? `+ ${b1}` : `- ${Math.abs(b1)}`
        const b2Str = b2 >= 0 ? `+ ${b2}` : `- ${Math.abs(b2)}`
        return {
            id: generateId(),
            topic: 'funcoes',
            question: `Se $f(x) = ${a1}x ${b1Str}$ e $g(x) = ${a2}x ${b2Str}$, calcule $(f \\circ g)(${x})$.`,
            answer: fogx,
            answerDisplay: `$$(f \\circ g)(${x}) = ${fogx}$$`,
            difficulty: 'medium',
            hint: '(f∘g)(x) = f(g(x)). Primeiro calcule g(x), depois aplique em f.',
            steps: [
                `Primeiro, calcule $g(${x})$: $$g(${x}) = ${a2} \\cdot ${x} ${b2Str} = ${gx}$$`,
                `Agora aplique em $f$: $$f(g(${x})) = f(${gx}) = ${a1} \\cdot ${gx} ${b1Str} = ${fogx}$$`
            ]
        }
    } else {
        const a = randomInt(2, 5)
        const b = randomInt(1, 8)
        const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`
        return {
            id: generateId(),
            topic: 'funcoes',
            question: `Encontre a inversa de $f(x) = ${a}x ${bStr}$.`,
            answer: `\\frac{x - ${b}}{${a}}`,
            answerDisplay: `$$f^{-1}(x) = \\frac{x - ${b}}{${a}}$$`,
            difficulty: 'medium',
            hint: 'Troque x por y, isole y: y = ax + b â†’ x = ay + b â†’ y = (x - b)/a',
            steps: [
                `Seja $y = ${a}x ${bStr}$`,
                `Troque $x$ e $y$: $$x = ${a}y ${bStr}$$`,
                `Isole $y$: $$x - ${b} = ${a}y$$`,
                `$$y = \\frac{x - ${b}}{${a}}$$`,
                `Portanto: $$f^{-1}(x) = \\frac{x - ${b}}{${a}}$$`
            ]
        }
    }
}

// 13. GEOMETRIA ANALÍTICA
function generateGeometriaAnalitica(): MathQuestion {
    const type = randomChoice(['distancia', 'ponto_medio', 'coef_angular'])

    if (type === 'distancia') {
        const x1 = randomInt(0, 5)
        const y1 = randomInt(0, 5)
        const x2 = randomInt(0, 8)
        const y2 = randomInt(0, 8)
        const dx = x2 - x1
        const dy = y2 - y1
        const d2 = dx * dx + dy * dy
        const d = Math.sqrt(d2)
        const isInt = Number.isInteger(d)
        const ansDisplay = isInt ? `$$d = ${d}$$` : `$$d = \\sqrt{${d2}}$$`
        const ans = isInt ? d : `\\sqrt{${d2}}`
        return {
            id: generateId(),
            topic: 'geometria_analitica',
            question: `Calcule a distância entre os pontos $A(${x1}, ${y1})$ e $B(${x2}, ${y2})$.`,
            answer: ans,
            answerDisplay: ansDisplay,
            difficulty: 'easy',
            hint: 'd = √[(x₂-x₁)² + (y₂-y₁)²]',
            steps: [
                `Fórmula: $$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$`,
                `$$d = \\sqrt{(${x2} - ${x1})^2 + (${y2} - ${y1})^2}$$`,
                `$$d = \\sqrt{${dx}^2 + ${dy}^2} = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${d2}}${isInt ? ` = ${d}` : ''}$$`
            ]
        }
    } else if (type === 'ponto_medio') {
        const x1 = randomInt(0, 10)
        const y1 = randomInt(0, 10)
        const x2 = randomInt(0, 10)
        const y2 = randomInt(0, 10)
        const mx2 = x1 + x2
        const my2 = y1 + y2
        const mxInt = mx2 % 2 === 0
        const myInt = my2 % 2 === 0
        const mxStr = mxInt ? `${mx2 / 2}` : `\\frac{${mx2}}{2}`
        const myStr = myInt ? `${my2 / 2}` : `\\frac{${my2}}{2}`
        return {
            id: generateId(),
            topic: 'geometria_analitica',
            question: `Encontre o ponto médio entre $A(${x1}, ${y1})$ e $B(${x2}, ${y2})$.`,
            answer: `(${mxStr}, ${myStr})`,
            answerDisplay: `$$M = \\left(${mxStr},\\; ${myStr}\\right)$$`,
            difficulty: 'easy',
            hint: 'M = ((x₁+x₂)/2, (y₁+y₂)/2)',
            steps: [
                `Fórmula: $$M = \\left(\\frac{x_1 + x_2}{2},\\; \\frac{y_1 + y_2}{2}\\right)$$`,
                `$$M = \\left(\\frac{${x1} + ${x2}}{2},\\; \\frac{${y1} + ${y2}}{2}\\right)$$`,
                `$$M = \\left(${mxStr},\\; ${myStr}\\right)$$`
            ]
        }
    } else {
        const x1 = randomInt(0, 5)
        const y1 = randomInt(0, 5)
        const x2 = randomInt(x1 + 1, 10)
        const y2 = randomInt(0, 10)
        const dy = y2 - y1
        const dx = x2 - x1
        const g = gcd(Math.abs(dy), Math.abs(dx))
        const [sn, sd] = [dy / g, dx / g]
        const isInt = sd === 1
        const ansStr = isInt ? `${sn}` : `\\frac{${sn}}{${sd}}`
        return {
            id: generateId(),
            topic: 'geometria_analitica',
            question: `Calcule o coeficiente angular da reta que passa por $A(${x1}, ${y1})$ e $B(${x2}, ${y2})$.`,
            answer: isInt ? sn : ansStr,
            answerDisplay: `$$m = ${ansStr}$$`,
            difficulty: 'easy',
            hint: 'm = (y₂ - y₁) / (x₂ - x₁)',
            steps: [
                `Fórmula: $$m = \\frac{y_2 - y_1}{x_2 - x_1}$$`,
                `$$m = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = \\frac{${dy}}{${dx}}${!isInt && g > 1 ? ` = \\frac{${sn}}{${sd}}` : ''}${isInt ? ` = ${sn}` : ''}$$`
            ]
        }
    }
}

// 14. GEOMETRIA PLANA
function generateGeometriaPlana(): MathQuestion {
    const type = randomChoice(['área_retangulo', 'perimetro_retangulo', 'pitagoras', 'área_trapezio'])

    if (type === 'área_retangulo') {
        const base = randomInt(3, 18)
        const altura = randomInt(2, 12)
        const área = base * altura
        return {
            id: generateId(),
            topic: 'geometria_plana',
            question: `Calcule a área de um retangulo com base ${base} cm e altura ${altura} cm.`,
            answer: área,
            answerDisplay: `$$A = ${área}\\text{ cm}^2$$`,
            difficulty: 'easy',
            hint: 'Use A = b x h.',
            steps: [
                `Formula: $$A = b \\cdot h$$`,
                `$$A = ${base} \\cdot ${altura} = ${área}$$`
            ]
        }
    } else if (type === 'perimetro_retangulo') {
        const base = randomInt(4, 20)
        const altura = randomInt(2, 10)
        const perimetro = 2 * (base + altura)
        return {
            id: generateId(),
            topic: 'geometria_plana',
            question: `Calcule o perimetro de um retangulo com base ${base} cm e altura ${altura} cm.`,
            answer: perimetro,
            answerDisplay: `$$P = ${perimetro}\\text{ cm}$$`,
            difficulty: 'easy',
            hint: 'Some os quatro lados: P = 2(b + h).',
            steps: [
                `Formula: $$P = 2(b + h)$$`,
                `$$P = 2(${base} + ${altura}) = 2 \\cdot ${base + altura} = ${perimetro}$$`
            ]
        }
    } else if (type === 'pitagoras') {
        const triple = randomChoice([
            [3, 4, 5],
            [5, 12, 13],
            [8, 15, 17],
            [7, 24, 25]
        ] as [number, number, number][])

        const mode = randomChoice(['hipotenusa', 'cateto'])
        const [a, b, c] = triple

        if (mode === 'hipotenusa') {
            return {
                id: generateId(),
                topic: 'geometria_plana',
                question: `Em um triangulo retangulo com catetos ${a} cm e ${b} cm, calcule a hipotenusa.`,
                answer: c,
                answerDisplay: `$$c = ${c}\\text{ cm}$$`,
                difficulty: 'medium',
                hint: 'Use o Teorema de Pitágoras: c^2 = a^2 + b^2.',
                steps: [
                    `$$c^2 = a^2 + b^2$$`,
                    `$$c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}$$`,
                    `$$c = \\sqrt{${c * c}} = ${c}$$`
                ]
            }
        }

        return {
            id: generateId(),
            topic: 'geometria_plana',
            question: `Em um triangulo retangulo com hipotenusa ${c} cm e um cateto ${a} cm, calcule o outro cateto.`,
            answer: b,
            answerDisplay: `$$b = ${b}\\text{ cm}$$`,
            difficulty: 'medium',
            hint: 'Isole o cateto: b^2 = c^2 - a^2.',
            steps: [
                `$$b^2 = c^2 - a^2$$`,
                `$$b^2 = ${c}^2 - ${a}^2 = ${c * c} - ${a * a} = ${b * b}$$`,
                `$$b = \\sqrt{${b * b}} = ${b}$$`
            ]
        }
    } else {
        const baseMaior = randomInt(10, 20)
        const baseMenor = randomInt(4, 9)
        let altura = randomInt(2, 10)
        if (((baseMaior + baseMenor) * altura) % 2 !== 0) {
            altura = altura === 10 ? 9 : altura + 1
        }
        const área = ((baseMaior + baseMenor) * altura) / 2
        return {
            id: generateId(),
            topic: 'geometria_plana',
            question: `Calcule a área de um trapezio com bases ${baseMaior} cm e ${baseMenor} cm, e altura ${altura} cm.`,
            answer: área,
            answerDisplay: `$$A = ${área}\\text{ cm}^2$$`,
            difficulty: 'medium',
            hint: 'Use A = ((B + b) x h) / 2.',
            steps: [
                `Formula: $$A = \\frac{(B + b) \\cdot h}{2}$$`,
                `$$A = \\frac{(${baseMaior} + ${baseMenor}) \\cdot ${altura}}{2} = \\frac{${baseMaior + baseMenor} \\cdot ${altura}}{2} = ${área}$$`
            ]
        }
    }
}

// 15. GEOMETRIA ESPACIAL
function generateGeometriaEspacial(): MathQuestion {
    const type = randomChoice(['volume_cubo', 'área_total_cubo', 'volume_paralelepipedo', 'volume_cilindro'])

    if (type === 'volume_cubo') {
        const aresta = randomInt(2, 9)
        const volume = Math.pow(aresta, 3)
        return {
            id: generateId(),
            topic: 'geometria_espacial',
            question: `Calcule o volume de um cubo de aresta ${aresta} cm.`,
            answer: volume,
            answerDisplay: `$$V = ${volume}\\text{ cm}^3$$`,
            difficulty: 'easy',
            hint: 'Use V = a^3.',
            steps: [
                `Formula: $$V = a^3$$`,
                `$$V = ${aresta}^3 = ${volume}$$`
            ]
        }
    } else if (type === 'área_total_cubo') {
        const aresta = randomInt(2, 10)
        const áreaTotal = 6 * Math.pow(aresta, 2)
        return {
            id: generateId(),
            topic: 'geometria_espacial',
            question: `Calcule a área total de um cubo de aresta ${aresta} cm.`,
            answer: áreaTotal,
            answerDisplay: `$$A_t = ${áreaTotal}\\text{ cm}^2$$`,
            difficulty: 'easy',
            hint: 'Um cubo tem 6 faces quadradas: At = 6a^2.',
            steps: [
                `Formula: $$A_t = 6a^2$$`,
                `$$A_t = 6 \\cdot ${aresta}^2 = 6 \\cdot ${aresta * aresta} = ${áreaTotal}$$`
            ]
        }
    } else if (type === 'volume_paralelepipedo') {
        const comprimento = randomInt(3, 12)
        const largura = randomInt(2, 10)
        const altura = randomInt(2, 9)
        const volume = comprimento * largura * altura
        return {
            id: generateId(),
            topic: 'geometria_espacial',
            question: `Calcule o volume de um paralelepipedo de dimensoes ${comprimento} cm x ${largura} cm x ${altura} cm.`,
            answer: volume,
            answerDisplay: `$$V = ${volume}\\text{ cm}^3$$`,
            difficulty: 'easy',
            hint: 'Use V = comprimento x largura x altura.',
            steps: [
                `Formula: $$V = c \\cdot l \\cdot h$$`,
                `$$V = ${comprimento} \\cdot ${largura} \\cdot ${altura} = ${volume}$$`
            ]
        }
    } else {
        const raio = randomInt(1, 6)
        const altura = randomInt(2, 10)
        const volume = 3 * raio * raio * altura
        return {
            id: generateId(),
            topic: 'geometria_espacial',
            question: `Calcule o volume de um cilindro de raio ${raio} cm e altura ${altura} cm. Use \\(\\pi = 3\\).`,
            answer: volume,
            answerDisplay: `$$V = ${volume}\\text{ cm}^3$$`,
            difficulty: 'medium',
            hint: 'Use V = pi r^2 h e substitua pi por 3.',
            steps: [
                `Formula: $$V = \\pi r^2 h$$`,
                `Com \\(\\pi = 3\\): $$V = 3 \\cdot ${raio}^2 \\cdot ${altura} = 3 \\cdot ${raio * raio} \\cdot ${altura} = ${volume}$$`
            ]
        }
    }
}

// 16. PROBABILIDADE
function generateProbabilidade(): MathQuestion {
    const type = randomChoice(['simples', 'complementar', 'dados'])

    if (type === 'simples') {
        const total = randomChoice([10, 20, 30, 50])
        const favoraveis = randomInt(1, total - 1)
        const g = gcd(favoraveis, total)
        const [sn, sd] = [favoraveis / g, total / g]
        return {
            id: generateId(),
            topic: 'probabilidade',
            question: `Uma urna tem ${total} bolas. Se ${favoraveis} são vermelhas, qual a probabilidade de sortear uma bola vermelha?`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$P = \\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'P = casos favoráveis / total de casos',
            steps: [
                `$$P = \\frac{\\text{favoráveis}}{\\text{total}} = \\frac{${favoraveis}}{${total}}${g > 1 ? ` = \\frac{${sn}}{${sd}}` : ''}$$`
            ]
        }
    } else if (type === 'complementar') {
        const total = randomChoice([10, 20, 50])
        const naoFav = randomInt(1, total - 1)
        const fav = total - naoFav
        const g = gcd(fav, total)
        const [sn, sd] = [fav / g, total / g]
        return {
            id: generateId(),
            topic: 'probabilidade',
            question: `De ${total} alunos, ${naoFav} NÃO gostam de matemática. Qual a probabilidade de escolher um aluno que gosta?`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$P = \\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'Use P(A) = 1 - P(Ā), ou calcule diretamente os favoráveis',
            steps: [
                `Alunos que gostam: $${total} - ${naoFav} = ${fav}$`,
                `$$P = \\frac{${fav}}{${total}}${g > 1 ? ` = \\frac{${sn}}{${sd}}` : ''}$$`
            ]
        }
    } else {
        const faces = 6
        const condition = randomChoice(['par', 'impar', 'maior3', 'primo'])
        let fav: number
        let desc: string
        if (condition === 'par') { fav = 3; desc = 'um número par' }
        else if (condition === 'impar') { fav = 3; desc = 'um número ímpar' }
        else if (condition === 'maior3') { fav = 3; desc = 'um número maior que 3' }
        else { fav = 3; desc = 'um número primo (2, 3 ou 5)' }
        const g = gcd(fav, faces)
        const [sn, sd] = [fav / g, faces / g]
        return {
            id: generateId(),
            topic: 'probabilidade',
            question: `Ao lançar um dado honesto, qual a probabilidade de sair ${desc}?`,
            answer: `\\frac{${sn}}{${sd}}`,
            answerDisplay: `$$P = \\frac{${sn}}{${sd}}$$`,
            difficulty: 'easy',
            hint: 'Dado: 6 faces. Conte os casos favoráveis.',
            steps: [
                `Total de resultados: $6$`,
                `Casos favoráveis (${desc}): $${fav}$`,
                `$$P = \\frac{${fav}}{${faces}} = \\frac{${sn}}{${sd}}$$`
            ]
        }
    }
}

// 15. ANÁLISE COMBINATÓRIA
function factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return result
}

function generateCombinatoria(): MathQuestion {
    const type = randomChoice(['permutacao', 'combinacao', 'arranjo'])

    if (type === 'permutacao') {
        const n = randomInt(3, 7)
        const result = factorial(n)
        return {
            id: generateId(),
            topic: 'combinatoria',
            question: `De quantas formas distintas podemos organizar ${n} pessoas em uma fila?`,
            answer: result,
            answerDisplay: `$$P_{${n}} = ${result}$$`,
            difficulty: n <= 5 ? 'easy' : 'medium',
            hint: `Permutação simples: P(n) = n!`,
            steps: [
                `Permutação simples: $$P_n = n!$$`,
                `$$P_{${n}} = ${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' \\times ')} = ${result}$$`
            ]
        }
    } else if (type === 'combinacao') {
        const n = randomInt(4, 8)
        const k = randomInt(2, Math.min(4, n - 1))
        const result = factorial(n) / (factorial(k) * factorial(n - k))
        return {
            id: generateId(),
            topic: 'combinatoria',
            question: `De quantas formas podemos escolher ${k} pessoas de um grupo de ${n}? (ordem não importa)`,
            answer: result,
            answerDisplay: `$$C_{${n},${k}} = ${result}$$`,
            difficulty: 'medium',
            hint: 'Combinação: C(n,k) = n! / (k! · (n-k)!)',
            steps: [
                `$$C_{n,k} = \\frac{n!}{k! \\cdot (n-k)!}$$`,
                `$$C_{${n},${k}} = \\frac{${n}!}{${k}! \\cdot ${n - k}!} = \\frac{${factorial(n)}}{${factorial(k)} \\cdot ${factorial(n - k)}} = ${result}$$`
            ]
        }
    } else {
        const n = randomInt(4, 7)
        const k = randomInt(2, Math.min(3, n - 1))
        const result = factorial(n) / factorial(n - k)
        return {
            id: generateId(),
            topic: 'combinatoria',
            question: `De quantas formas podemos escolher ${k} pessoas de um grupo de ${n} para presidente e vice? (ordem importa)`,
            answer: result,
            answerDisplay: `$$A_{${n},${k}} = ${result}$$`,
            difficulty: 'medium',
            hint: 'Arranjo: A(n,k) = n! / (n-k)!',
            steps: [
                `$$A_{n,k} = \\frac{n!}{(n-k)!}$$`,
                `$$A_{${n},${k}} = \\frac{${n}!}{(${n}-${k})!} = \\frac{${factorial(n)}}{${factorial(n - k)}} = ${result}$$`
            ]
        }
    }
}

// 16. PORCENTAGEM E JUROS
function generatePorcentagemJuros(): MathQuestion {
    const type = randomChoice(['porcentagem_de', 'porcentagem_aumento', 'juros_simples', 'juros_compostos'])

    if (type === 'porcentagem_de') {
        const pct = randomChoice([5, 10, 15, 20, 25, 30, 40, 50])
        const valor = randomChoice([100, 200, 300, 500, 800, 1000])
        const result = valor * pct / 100
        return {
            id: generateId(),
            topic: 'porcentagem_juros',
            question: `Calcule ${pct}% de ${valor}.`,
            answer: result,
            answerDisplay: `$$${result}$$`,
            difficulty: 'easy',
            hint: 'x% de V = (x/100) · V',
            steps: [
                `$$${pct}\\% \\text{ de } ${valor} = \\frac{${pct}}{100} \\times ${valor}$$`,
                `$$= ${pct / 100} \\times ${valor} = ${result}$$`
            ]
        }
    } else if (type === 'porcentagem_aumento') {
        const pct = randomChoice([10, 15, 20, 25, 30, 50])
        const valor = randomChoice([100, 200, 400, 500, 800])
        const result = valor * (1 + pct / 100)
        return {
            id: generateId(),
            topic: 'porcentagem_juros',
            question: `Um produto de R\\$${valor} teve aumento de ${pct}%. Qual o novo preço?`,
            answer: result,
            answerDisplay: `$$R\\$${result}$$`,
            difficulty: 'easy',
            hint: 'Novo valor = valor · (1 + taxa/100)',
            steps: [
                `Fator de aumento: $$1 + \\frac{${pct}}{100} = ${1 + pct / 100}$$`,
                `$$${valor} \\times ${1 + pct / 100} = ${result}$$`
            ]
        }
    } else if (type === 'juros_simples') {
        const C = randomChoice([500, 1000, 2000, 5000])
        const i = randomChoice([2, 5, 10])
        const t = randomInt(2, 6)
        const J = C * (i / 100) * t
        const M = C + J
        return {
            id: generateId(),
            topic: 'porcentagem_juros',
            question: `Calcule o montante de um capital de R\\$${C} aplicado a juros simples de ${i}% a.m. durante ${t} meses.`,
            answer: M,
            answerDisplay: `$$M = R\\$${M}$$`,
            difficulty: 'medium',
            hint: 'J = C · i · t e M = C + J',
            steps: [
                `Juros: $$J = C \\cdot i \\cdot t = ${C} \\cdot ${i / 100} \\cdot ${t} = ${J}$$`,
                `Montante: $$M = C + J = ${C} + ${J} = ${M}$$`
            ]
        }
    } else {
        const C = randomChoice([1000, 2000, 5000])
        const i = randomChoice([10, 20])
        const t = randomInt(2, 3)
        const M = C * Math.pow(1 + i / 100, t)
        return {
            id: generateId(),
            topic: 'porcentagem_juros',
            question: `Calcule o montante de R\\$${C} a juros compostos de ${i}% a.m. por ${t} meses.`,
            answer: M,
            answerDisplay: `$$M = R\\$${M}$$`,
            difficulty: 'hard',
            hint: 'M = C · (1 + i)^t',
            steps: [
                `$$M = C \\cdot (1 + i)^t$$`,
                `$$M = ${C} \\cdot (1 + ${i / 100})^{${t}}$$`,
                `$$M = ${C} \\cdot ${1 + i / 100}^{${t}} = ${C} \\cdot ${Math.pow(1 + i / 100, t)}$$`,
                `$$M = ${M}$$`
            ]
        }
    }
}

// 17. ESTATÍSTICA
function generateEstatistica(): MathQuestion {
    const type = randomChoice(['media', 'mediana', 'moda'])

    if (type === 'media') {
        const n = randomInt(4, 6)
        const values = Array.from({ length: n }, () => randomInt(2, 20))
        const sum = values.reduce((a, b) => a + b, 0)
        const media = sum / n
        const isInt = Number.isInteger(media)
        return {
            id: generateId(),
            topic: 'estatistica',
            question: `Calcule a média aritmética: $$\\{${values.join(',\\; ')}\\}$$`,
            answer: isInt ? media : parseFloat(media.toFixed(2)),
            answerDisplay: `$$\\bar{x} = ${isInt ? media : media.toFixed(2)}$$`,
            difficulty: 'easy',
            hint: 'Média = soma de todos / quantidade',
            steps: [
                `$$\\bar{x} = \\frac{${values.join(' + ')}}{${n}}$$`,
                `$$\\bar{x} = \\frac{${sum}}{${n}} = ${isInt ? media : media.toFixed(2)}$$`
            ]
        }
    } else if (type === 'mediana') {
        const n = randomChoice([5, 7])
        const values = Array.from({ length: n }, () => randomInt(1, 20))
        const sorted = [...values].sort((a, b) => a - b)
        const mediana = sorted[Math.floor(n / 2)]
        return {
            id: generateId(),
            topic: 'estatistica',
            question: `Encontre a mediana: $$\\{${values.join(',\\; ')}\\}$$`,
            answer: mediana,
            answerDisplay: `$$Md = ${mediana}$$`,
            difficulty: 'easy',
            hint: 'Ordene os valores e encontre o elemento central',
            steps: [
                `Ordenando: $$\\{${sorted.join(',\\; ')}\\}$$`,
                `Com ${n} elementos, a mediana é o ${Math.floor(n / 2) + 1}º valor`,
                `$$Md = ${mediana}$$`
            ]
        }
    } else {
        const moda = randomInt(3, 15)
        const freq = randomInt(3, 5)
        const values: number[] = []
        for (let i = 0; i < freq; i++) values.push(moda)
        const extras = randomInt(3, 5)
        for (let i = 0; i < extras; i++) {
            let v: number
            do { v = randomInt(1, 20) } while (v === moda)
            values.push(v)
        }
        // Embaralhar
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]]
        }
        return {
            id: generateId(),
            topic: 'estatistica',
            question: `Encontre a moda: $$\\{${values.join(',\\; ')}\\}$$`,
            answer: moda,
            answerDisplay: `$$Mo = ${moda}$$`,
            difficulty: 'easy',
            hint: 'A moda é o valor que mais se repete',
            steps: [
                `Contagem de frequência:`,
                `O valor $${moda}$ aparece $${freq}$ vezes (mais que qualquer outro)`,
                `$$Mo = ${moda}$$`
            ]
        }
    }
}

// 18. MATRIZES
function generateMatrizes(): MathQuestion {
    const type = randomChoice(['det_2x2', 'soma_2x2', 'multiplicacao_escalar'])

    if (type === 'det_2x2') {
        const a = randomInt(-5, 5)
        const b = randomInt(-5, 5)
        const c = randomInt(-5, 5)
        const d = randomInt(-5, 5)
        const det = a * d - b * c
        return {
            id: generateId(),
            topic: 'matrizes',
            question: `Calcule o determinante: $$\\begin{vmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{vmatrix}$$`,
            answer: det,
            answerDisplay: `$$\\det = ${det}$$`,
            difficulty: 'easy',
            hint: 'det = a·d - b·c (diagonal principal menos diagonal secundária)',
            steps: [
                `$$\\det = a \\cdot d - b \\cdot c$$`,
                `$$\\det = (${a}) \\cdot (${d}) - (${b}) \\cdot (${c})$$`,
                `$$\\det = ${a * d} - ${b * c} = ${det}$$`
            ]
        }
    } else if (type === 'soma_2x2') {
        const a1 = randomInt(-5, 5), b1 = randomInt(-5, 5)
        const c1 = randomInt(-5, 5), d1 = randomInt(-5, 5)
        const a2 = randomInt(-5, 5), b2 = randomInt(-5, 5)
        const c2 = randomInt(-5, 5), d2 = randomInt(-5, 5)
        return {
            id: generateId(),
            topic: 'matrizes',
            question: `Calcule: $$\\begin{pmatrix} ${a1} & ${b1} \\\\ ${c1} & ${d1} \\end{pmatrix} + \\begin{pmatrix} ${a2} & ${b2} \\\\ ${c2} & ${d2} \\end{pmatrix}$$`,
            answer: `(${a1 + a2},${b1 + b2};${c1 + c2},${d1 + d2})`,
            answerDisplay: `$$\\begin{pmatrix} ${a1 + a2} & ${b1 + b2} \\\\ ${c1 + c2} & ${d1 + d2} \\end{pmatrix}$$`,
            difficulty: 'easy',
            hint: 'Some os elementos de mesma posição',
            steps: [
                `Some cada posição correspondente:`,
                `$$\\begin{pmatrix} ${a1}+${a2} & ${b1}+${b2} \\\\ ${c1}+${c2} & ${d1}+${d2} \\end{pmatrix} = \\begin{pmatrix} ${a1 + a2} & ${b1 + b2} \\\\ ${c1 + c2} & ${d1 + d2} \\end{pmatrix}$$`
            ]
        }
    } else {
        const k = randomInt(2, 5)
        const a = randomInt(-5, 5), b = randomInt(-5, 5)
        const c = randomInt(-5, 5), d = randomInt(-5, 5)
        return {
            id: generateId(),
            topic: 'matrizes',
            question: `Calcule: $$${k} \\cdot \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}$$`,
            answer: `(${k * a},${k * b};${k * c},${k * d})`,
            answerDisplay: `$$\\begin{pmatrix} ${k * a} & ${k * b} \\\\ ${k * c} & ${k * d} \\end{pmatrix}$$`,
            difficulty: 'easy',
            hint: 'Multiplique cada elemento da matriz pelo escalar',
            steps: [
                `Multiplique cada elemento por $${k}$:`,
                `$$\\begin{pmatrix} ${k} \\cdot ${a} & ${k} \\cdot ${b} \\\\ ${k} \\cdot ${c} & ${k} \\cdot ${d} \\end{pmatrix} = \\begin{pmatrix} ${k * a} & ${k * b} \\\\ ${k * c} & ${k * d} \\end{pmatrix}$$`
            ]
        }
    }
}

// ===== GERAÇÃO DE ALTERNATIVAS (Múltipla Escolha) =====

function generateDistractors(correctAnswer: string | number, topic: TopicType): string[] {
    const correct = typeof correctAnswer === 'number' ? correctAnswer : parseFloat(String(correctAnswer))
    const distractors = new Set<string>()

    if (!isNaN(correct)) {
        // Distratores numéricos: erros comuns
        const variations = [
            correct + randomInt(1, 3),
            correct - randomInt(1, 3),
            correct * 2,
            -correct,
            correct + 10,
            correct - 5,
            Math.abs(correct) + randomInt(1, 5),
        ].filter(v => v !== correct)

        for (const v of variations) {
            distractors.add(String(v))
            if (distractors.size >= 4) break
        }
    }

    // Preencher até 4 distratores se necessário
    while (distractors.size < 4) {
        distractors.add(String(randomInt(-20, 20)))
    }

    const arr = Array.from(distractors).slice(0, 4)
    // Inserir resposta correta em posição aleatória
    const correctStr = String(correctAnswer)
    const pos = randomInt(0, 4)
    arr.splice(pos, 0, correctStr)
    return arr.slice(0, 5)
}

export function addChoicesToQuestion(q: MathQuestion): MathQuestion {
    return {
        ...q,
        choices: generateDistractors(q.answer, q.topic)
    }
}

// Mapeamento dos geradores
const generators: Record<TopicType, () => MathQuestion> = {
    fatoracao: generateFatoracao,
    logaritmo: generateLogaritmo,
    notacao_cientifica: generateNotacaoCientifica,
    conversao_unidades: generateConversaoUnidades,
    trigonometria: generateTrigonometria,
    racionalizacao: generateRacionalizacao,
    equacoes_1grau: generateEquacao1Grau,
    equacoes_2grau: generateEquacao2Grau,
    fracao: generateFracao,
    potenciacao: generatePotenciacao,
    pa_pg: generatePaPg,
    funcoes: generateFuncoes,
    geometria_analitica: generateGeometriaAnalitica,
    geometria_plana: generateGeometriaPlana,
    geometria_espacial: generateGeometriaEspacial,
    probabilidade: generateProbabilidade,
    combinatoria: generateCombinatoria,
    porcentagem_juros: generatePorcentagemJuros,
    estatistica: generateEstatistica,
    matrizes: generateMatrizes,
}

// Função principal de geração
export function generateQuestion(topic: TopicType): MathQuestion {
    const question = generators[topic]()
    return {
        ...question,
        question: diversifyQuestionText(question.question, question.topic, question.difficulty)
    }
}

// Gerar playlist de questões
export interface PlaylistConfig {
    topic: TopicType
    quantity: number
}

export function generatePlaylist(config: PlaylistConfig[], shuffle: boolean = true): MathQuestion[] {
    const questions: MathQuestion[] = []

    for (const { topic, quantity } of config) {
        for (let i = 0; i < quantity; i++) {
            questions.push(generateQuestion(topic))
        }
    }

    if (shuffle) {
        // Fisher-Yates shuffle
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[questions[i], questions[j]] = [questions[j], questions[i]]
        }
    }

    return questions
}

// ===== VALIDAÇÃO FLEXÍVEL DE RESPOSTAS =====

/**
 * Normaliza uma string de resposta matemática para comparação
 * Remove espaços, converte para lowercase, normaliza formatos
 */
function normalizeAnswer(answer: string): string {
    return answer
        .toLowerCase()
        .replace(/\s+/g, '') // Remove espaços
        .replace(/\\cdot/g, '*') // LaTeX multiplication
        .replace(/\\times/g, '*')
        .replace(/×/g, '*')
        .replace(/·/g, '*')
        .replace(/\\div/g, '/')
        .replace(/÷/g, '/')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)') // \frac{a}{b} -> (a)/(b)
        .replace(/\^/g, '^')
        .replace(/\*\*/g, '^')
        .replace(/sqrt\(([^)]+)\)/g, 'sqrt$1')
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt$1')
        .replace(/√/g, 'sqrt')
        .replace(/\$/g, '') // Remove $ do LaTeX
        .replace(/\\text\{[^}]*\}/g, '') // Remove \text{...}
        .replace(/\\left/g, '')
        .replace(/\\right/g, '')
        .replace(/(\d)[,.](?=10\^)/g, '$1*') // 3.10^6 / 3,10^6 -> 3*10^6
        .replace(/(\d),(\d)/g, '$1.$2') // Vírgula decimal -> ponto
        .replace(/\(|\)/g, '') // Remove parênteses para simplificar
        .trim()
}

function parseScientificNotation(str: string): number | null {
    const normalized = normalizeAnswer(str).replace(/[{}]/g, '')

    const eMatch = normalized.match(/^(-?\d+(?:\.\d+)?)e(-?\d+)$/)
    if (eMatch) {
        const mantissa = parseFloat(eMatch[1])
        const exponent = parseInt(eMatch[2], 10)
        return mantissa * Math.pow(10, exponent)
    }

    const sciMatch = normalized.match(/^(-?\d+(?:\.\d+)?)(?:\*|x)?10\^(-?\d+)$/)
    if (sciMatch) {
        const mantissa = parseFloat(sciMatch[1])
        const exponent = parseInt(sciMatch[2], 10)
        return mantissa * Math.pow(10, exponent)
    }

    return null
}

function extractAllNumbers(str: string): number[] {
    const normalized = str
        .replace(/(\d),(\d)/g, '$1.$2')
        .replace(/\bx\d+(?=\s*=)/gi, 'x')
    const matches = normalized.match(/-?\d+(?:\.\d+)?/g) || []
    return matches
        .map((value) => parseFloat(value))
        .filter((value) => Number.isFinite(value))
}

function extractRoots(str: string): number[] {
    const normalized = str.replace(/(\d),(\d)/g, '$1.$2')

    const assignmentMatches = [...normalized.matchAll(/x\d*\s*=\s*(-?\d+(?:\.\d+)?)/gi)]
    if (assignmentMatches.length >= 2) {
        return assignmentMatches
            .map((match) => parseFloat(match[1]))
            .filter((value) => Number.isFinite(value))
    }

    if (!/(ou|and|e|,|;)/i.test(normalized)) {
        return []
    }

    const numbers = extractAllNumbers(normalized.replace(/\bx\d*\b/gi, ''))
    return numbers.length >= 2 ? numbers : []
}

function sameNumberSet(a: number[], b: number[], tolerance = 1e-9): boolean {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort((x, y) => x - y)
    const sortedB = [...b].sort((x, y) => x - y)
    return sortedA.every((value, index) => Math.abs(value - sortedB[index]) <= tolerance)
}

/**
 * Extrai o valor numérico de uma string (se existir)
 */
function extractNumber(str: string): number | null {
    const scientificValue = parseScientificNotation(str)
    if (scientificValue !== null) {
        return scientificValue
    }

    const numbers = extractAllNumbers(str)
    if (numbers.length !== 1) {
        return null
    }

    const number = numbers[0]
    if (Number.isFinite(number)) {
        return number
    }
    return null
}

/**
 * Gera variações aceitáveis de uma resposta
 */function generateAcceptableVariations(answer: string | number): string[] {
    const variations: string[] = []
    const strAnswer = String(answer)

    // Adiciona a resposta original normalizada
    variations.push(normalizeAnswer(strAnswer))

    // Se for numérico, adiciona variações
    const num = extractNumber(strAnswer)
    if (num !== null) {
        variations.push(String(num))
        variations.push(String(Math.round(num * 1000) / 1000)) // 3 casas decimais
        if (Number.isInteger(num)) {
            variations.push(String(num) + '.0')
        }
    }

    // Variações de fração LaTeX
    const fracMatch = strAnswer.match(/\\frac\{(\d+)\}\{(\d+)\}/)
    if (fracMatch) {
        const [, num, den] = fracMatch
        variations.push(`${num}/${den}`)
        variations.push(`${num}÷${den}`)
        const decimal = parseInt(num) / parseInt(den)
        variations.push(String(decimal))
        variations.push(decimal.toFixed(2))
        variations.push(decimal.toFixed(3))
    }

    // Variações simples de fração a/b
    const simpleFracMatch = strAnswer.match(/^(\d+)\/(\d+)$/)
    if (simpleFracMatch) {
        const [, num, den] = simpleFracMatch
        const decimal = parseInt(num) / parseInt(den)
        variations.push(String(decimal))
    }

    // Variações de potência
    const powMatch = strAnswer.match(/(\d+)\^\{?(\d+)\}?/)
    if (powMatch) {
        const [, base, exp] = powMatch
        variations.push(`${base}^${exp}`)
        variations.push(`${base}**${exp}`)
        variations.push(`${base}^{${exp}}`)
        const result = Math.pow(parseInt(base), parseInt(exp))
        variations.push(String(result))
    }

    // Variações de raiz
    if (strAnswer.includes('sqrt') || strAnswer.includes('√') || strAnswer.includes('\\sqrt')) {
        const sqrtMatch = strAnswer.match(/sqrt\{?(\d+)\}?|√(\d+)|\\sqrt\{(\d+)\}/)
        if (sqrtMatch) {
            const n = sqrtMatch[1] || sqrtMatch[2] || sqrtMatch[3]
            if (n) {
                variations.push(`sqrt${n}`)
                variations.push(`sqrt(${n})`)
                variations.push(`√${n}`)
                variations.push(`raiz(${n})`)
                const result = Math.sqrt(parseInt(n))
                if (Number.isInteger(result)) {
                    variations.push(String(result))
                }
            }
        }
    }

    // Variações de notação científica
    const sciMatch = strAnswer.match(/(\d+(?:\.\d+)?)\s*[x×\*]?\s*\\?times?\s*10\^?\{?(-?\d+)\}?/)
    if (sciMatch) {
        const [, mantissa, exp] = sciMatch
        variations.push(`${mantissa}*10^${exp}`)
        variations.push(`${mantissa}x10^${exp}`)
        variations.push(`${mantissa}e${exp}`)
        variations.push(`${mantissa}×10^${exp}`)
        // Calcula valor real
        const realValue = parseFloat(mantissa) * Math.pow(10, parseInt(exp))
        variations.push(String(realValue))
    }

    // Variações para equações x = valor
    const eqMatch = strAnswer.match(/x\s*=\s*(-?\d+)/)
    if (eqMatch) {
        variations.push(eqMatch[1])
        variations.push(`x=${eqMatch[1]}`)
    }

    // Variações para múltiplas raízes
    const multiRootMatch = strAnswer.match(/x\s*=\s*(-?\d+).*x\s*=\s*(-?\d+)/)
    if (multiRootMatch) {
        const [, r1, r2] = multiRootMatch
        variations.push(`${r1},${r2}`)
        variations.push(`${r2},${r1}`)
        variations.push(`${r1} e ${r2}`)
        variations.push(`${r2} e ${r1}`)
        variations.push(`${r1} ou ${r2}`)
        variations.push(`${r2} ou ${r1}`)
        variations.push(`x=${r1},x=${r2}`)
        variations.push(`x=${r2},x=${r1}`)
    }

    return [...new Set(variations.map(v => normalizeAnswer(v)))]
}

/**
 * Valida se a resposta do usuário está correta
 * Aceita múltiplas formas de escrever a mesma resposta
 */
export function validateAnswer(userAnswer: string, correctAnswer: string | number): boolean {
    if (!userAnswer.trim()) return false

    const normalizedUser = normalizeAnswer(userAnswer)
    const acceptableVariations = generateAcceptableVariations(correctAnswer)

    // Verificação direta
    if (acceptableVariations.includes(normalizedUser)) {
        return true
    }

    // Verificação para respostas com mÃºltiplas raízes (ex.: x1=-3, x2=0)
    const userRoots = extractRoots(userAnswer)
    const correctRoots = extractRoots(String(correctAnswer))
    if (userRoots.length > 1 && correctRoots.length > 1 && sameNumberSet(userRoots, correctRoots)) {
        return true
    }

    // Verificação numérica com tolerância
    const userNum = extractNumber(userAnswer)
    const correctNum = extractNumber(String(correctAnswer))

    if (userNum !== null && correctNum !== null) {
        // Tolerância de 0.1% para erros de arredondamento
        const tolerance = Math.abs(correctNum) * 0.001
        if (Math.abs(userNum - correctNum) <= Math.max(tolerance, 0.01)) {
            return true
        }
    }

    // Verificação por inclusão (para respostas complexas como "x = 2 ou x = 3")
    const separatorRegex = /\bou\b|\band\b|\be\b|,|;/
    const userParts = normalizedUser.split(separatorRegex).map(p => p.trim()).filter(Boolean).sort()
    const correctParts = normalizeAnswer(String(correctAnswer)).split(separatorRegex).map(p => p.trim()).filter(Boolean).sort()

    if (userParts.length > 1 && userParts.length === correctParts.length) {
        // Extrai apenas os nÃºmeros para comparação
        const userNums = userParts
            .map(p => extractNumber(p))
            .filter((n): n is number => n !== null)
            .sort((a, b) => a - b)

        const correctNums = correctParts
            .map(p => extractNumber(p))
            .filter((n): n is number => n !== null)
            .sort((a, b) => a - b)

        if (userNums.length === correctNums.length && sameNumberSet(userNums, correctNums)) {
            return true
        }
    }

    // Verificação de substring (para respostas parciais corretas)
    const normalizedCorrect = normalizeAnswer(String(correctAnswer))
    if (normalizedUser.length > 2 && (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect))) {
        // Verifica se os nÃºmeros são os mesmos
        const userNums = extractAllNumbers(userAnswer).map(n => n.toString()).sort()
        const correctNums = extractAllNumbers(String(correctAnswer)).map(n => n.toString()).sort()
        if (userNums.length > 0 && JSON.stringify(userNums) === JSON.stringify(correctNums)) {
            return true
        }
    }

    return false
}
