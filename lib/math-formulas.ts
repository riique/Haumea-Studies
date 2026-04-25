/**
 * ReferÃªncia de FÃ³rmulas por TÃ³pico â€” Haumea Math
 * Cada tÃ³pico contÃ©m as fÃ³rmulas essenciais cobradas em vestibular
 */

import { TopicType } from './math-generators'

export interface FormulaEntry {
    label: string
    latex: string
}

export interface FormulaSection {
    title: string
    formulas: FormulaEntry[]
}

export interface TopicFormulas {
    topic: TopicType
    name: string
    sections: FormulaSection[]
}

export const TOPIC_FORMULAS: TopicFormulas[] = [
    // ==================== ÃLGEBRA ====================
    {
        topic: 'fatoracao',
        name: 'FatoraÃ§Ã£o',
        sections: [
            {
                title: 'Produtos NotÃ¡veis',
                formulas: [
                    { label: 'Quadrado da soma', latex: '(a + b)^2 = a^2 + 2ab + b^2' },
                    { label: 'Quadrado da diferenÃ§a', latex: '(a - b)^2 = a^2 - 2ab + b^2' },
                    { label: 'Produto da soma pela diferenÃ§a', latex: '(a + b)(a - b) = a^2 - b^2' },
                    { label: 'Cubo da soma', latex: '(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3' },
                    { label: 'Cubo da diferenÃ§a', latex: '(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3' },
                ]
            },
            {
                title: 'Soma e DiferenÃ§a de Cubos',
                formulas: [
                    { label: 'Soma de cubos', latex: 'a^3 + b^3 = (a + b)(a^2 - ab + b^2)' },
                    { label: 'DiferenÃ§a de cubos', latex: 'a^3 - b^3 = (a - b)(a^2 + ab + b^2)' },
                ]
            },
            {
                title: 'Fator Comum',
                formulas: [
                    { label: 'Fator comum em evidÃªncia', latex: 'ax + ay = a(x + y)' },
                    { label: 'Agrupamento', latex: 'ax + ay + bx + by = (a+b)(x+y)' },
                ]
            }
        ]
    },
    {
        topic: 'logaritmo',
        name: 'Logaritmos',
        sections: [
            {
                title: 'DefiniÃ§Ã£o',
                formulas: [
                    { label: 'DefiniÃ§Ã£o', latex: '\\log_a b = c \\iff a^c = b' },
                    { label: 'CondiÃ§Ã£o de existÃªncia', latex: 'a > 0,\\; a \\neq 1,\\; b > 0' },
                ]
            },
            {
                title: 'Propriedades OperatÃ³rias',
                formulas: [
                    { label: 'Logaritmo do produto', latex: '\\log_a (b \\cdot c) = \\log_a b + \\log_a c' },
                    { label: 'Logaritmo do quociente', latex: '\\log_a \\frac{b}{c} = \\log_a b - \\log_a c' },
                    { label: 'Logaritmo da potÃªncia', latex: '\\log_a b^n = n \\cdot \\log_a b' },
                ]
            },
            {
                title: 'Propriedades Especiais',
                formulas: [
                    { label: 'Logaritmo de 1', latex: '\\log_a 1 = 0' },
                    { label: 'Logaritmo da base', latex: '\\log_a a = 1' },
                    { label: 'MudanÃ§a de base', latex: '\\log_a b = \\frac{\\log_c b}{\\log_c a}' },
                    { label: 'InversÃ£o de base', latex: '\\log_a b = \\frac{1}{\\log_b a}' },
                ]
            }
        ]
    },
    {
        topic: 'potenciacao',
        name: 'PotenciaÃ§Ã£o',
        sections: [
            {
                title: 'Propriedades Fundamentais',
                formulas: [
                    { label: 'Produto de mesma base', latex: 'a^m \\cdot a^n = a^{m+n}' },
                    { label: 'Quociente de mesma base', latex: '\\frac{a^m}{a^n} = a^{m-n}' },
                    { label: 'PotÃªncia de potÃªncia', latex: '(a^m)^n = a^{m \\cdot n}' },
                    { label: 'PotÃªncia de produto', latex: '(a \\cdot b)^n = a^n \\cdot b^n' },
                    { label: 'PotÃªncia de quociente', latex: '\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}' },
                ]
            },
            {
                title: 'Expoentes Especiais',
                formulas: [
                    { label: 'Expoente zero', latex: 'a^0 = 1 \\;\\;(a \\neq 0)' },
                    { label: 'Expoente negativo', latex: 'a^{-n} = \\frac{1}{a^n}' },
                    { label: 'Expoente fracionÃ¡rio', latex: 'a^{\\frac{m}{n}} = \\sqrt[n]{a^m}' },
                ]
            }
        ]
    },
    {
        topic: 'racionalizacao',
        name: 'RacionalizaÃ§Ã£o',
        sections: [
            {
                title: 'Denominadores com RaÃ­zes',
                formulas: [
                    { label: 'Raiz simples', latex: '\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}' },
                    { label: 'Soma com radical', latex: '\\frac{a}{b + \\sqrt{c}} = \\frac{a(b - \\sqrt{c})}{b^2 - c}' },
                    { label: 'DiferenÃ§a de radicais', latex: '\\frac{a}{\\sqrt{b} - \\sqrt{c}} = \\frac{a(\\sqrt{b} + \\sqrt{c})}{b - c}' },
                    { label: 'Raiz cÃºbica', latex: '\\frac{a}{\\sqrt[3]{b}} = \\frac{a\\sqrt[3]{b^2}}{b}' },
                ]
            },
            {
                title: 'Propriedades de Radicais',
                formulas: [
                    { label: 'Produto', latex: '\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{a \\cdot b}' },
                    { label: 'Quociente', latex: '\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}' },
                    { label: 'PotÃªncia no radical', latex: '\\sqrt[n]{a^m} = a^{\\frac{m}{n}}' },
                ]
            }
        ]
    },
    {
        topic: 'fracao',
        name: 'FraÃ§Ãµes',
        sections: [
            {
                title: 'OperaÃ§Ãµes',
                formulas: [
                    { label: 'Soma (mesmo denominador)', latex: '\\frac{a}{c} + \\frac{b}{c} = \\frac{a + b}{c}' },
                    { label: 'Soma (denominadores diferentes)', latex: '\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}' },
                    { label: 'MultiplicaÃ§Ã£o', latex: '\\frac{a}{b} \\times \\frac{c}{d} = \\frac{ac}{bd}' },
                    { label: 'DivisÃ£o', latex: '\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}' },
                ]
            },
            {
                title: 'Propriedades',
                formulas: [
                    { label: 'SimplificaÃ§Ã£o', latex: '\\frac{ka}{kb} = \\frac{a}{b}' },
                    { label: 'FraÃ§Ã£o com expoente negativo', latex: '\\left(\\frac{a}{b}\\right)^{-n} = \\left(\\frac{b}{a}\\right)^n' },
                ]
            }
        ]
    },
    {
        topic: 'equacoes_1grau',
        name: 'EquaÃ§Ãµes do 1Âº Grau',
        sections: [
            {
                title: 'Forma e SoluÃ§Ã£o',
                formulas: [
                    { label: 'Forma geral', latex: 'ax + b = 0' },
                    { label: 'SoluÃ§Ã£o', latex: 'x = -\\frac{b}{a}' },
                ]
            },
            {
                title: 'Propriedades',
                formulas: [
                    { label: 'Multiplicar ambos os lados', latex: 'A = B \\implies kA = kB' },
                    { label: 'Somar ambos os lados', latex: 'A = B \\implies A + c = B + c' },
                    { label: 'Trocar de lado = trocar sinal', latex: 'x + a = b \\implies x = b - a' },
                ]
            }
        ]
    },
    {
        topic: 'equacoes_2grau',
        name: 'EquaÃ§Ãµes do 2Âº Grau',
        sections: [
            {
                title: 'FÃ³rmula de Bhaskara',
                formulas: [
                    { label: 'Forma geral', latex: 'ax^2 + bx + c = 0' },
                    { label: 'Discriminante', latex: '\\Delta = b^2 - 4ac' },
                    { label: 'FÃ³rmula de Bhaskara', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}' },
                ]
            },
            {
                title: 'RelaÃ§Ãµes de Girard',
                formulas: [
                    { label: 'Soma das raÃ­zes', latex: 'x_1 + x_2 = -\\frac{b}{a}' },
                    { label: 'Produto das raÃ­zes', latex: 'x_1 \\cdot x_2 = \\frac{c}{a}' },
                ]
            },
            {
                title: 'AnÃ¡lise do Discriminante',
                formulas: [
                    { label: 'Duas raÃ­zes reais e distintas', latex: '\\Delta > 0' },
                    { label: 'Duas raÃ­zes reais e iguais', latex: '\\Delta = 0' },
                    { label: 'Sem raÃ­zes reais', latex: '\\Delta < 0' },
                ]
            }
        ]
    },
    {
        topic: 'pa_pg',
        name: 'PA e PG',
        sections: [
            {
                title: 'ProgressÃ£o AritmÃ©tica (PA)',
                formulas: [
                    { label: 'Termo geral', latex: 'a_n = a_1 + (n - 1) \\cdot r' },
                    { label: 'Soma dos n termos', latex: 'S_n = \\frac{(a_1 + a_n) \\cdot n}{2}' },
                    { label: 'RazÃ£o', latex: 'r = a_n - a_{n-1}' },
                    { label: 'Termo mÃ©dio', latex: 'a_n = \\frac{a_{n-1} + a_{n+1}}{2}' },
                ]
            },
            {
                title: 'ProgressÃ£o GeomÃ©trica (PG)',
                formulas: [
                    { label: 'Termo geral', latex: 'a_n = a_1 \\cdot q^{n-1}' },
                    { label: 'Soma finita (q â‰  1)', latex: 'S_n = a_1 \\cdot \\frac{q^n - 1}{q - 1}' },
                    { label: 'Soma infinita (|q| < 1)', latex: 'S = \\frac{a_1}{1 - q}' },
                    { label: 'RazÃ£o', latex: 'q = \\frac{a_n}{a_{n-1}}' },
                ]
            }
        ]
    },
    {
        topic: 'matrizes',
        name: 'Matrizes',
        sections: [
            {
                title: 'OperaÃ§Ãµes BÃ¡sicas',
                formulas: [
                    { label: 'Soma', latex: 'A + B = [a_{ij} + b_{ij}]' },
                    { label: 'MultiplicaÃ§Ã£o por escalar', latex: 'kA = [k \\cdot a_{ij}]' },
                    { label: 'Transposta', latex: '(A^T)_{ij} = a_{ji}' },
                ]
            },
            {
                title: 'Determinante 2Ã—2',
                formulas: [
                    { label: 'FÃ³rmula', latex: '\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' },
                ]
            },
            {
                title: 'Determinante 3Ã—3 (Sarrus)',
                formulas: [
                    { label: 'Regra de Sarrus', latex: '\\det A = aei + bfg + cdh - ceg - bdi - afh' },
                ]
            },
            {
                title: 'Propriedades',
                formulas: [
                    { label: 'Matriz identidade', latex: 'A \\cdot I = I \\cdot A = A' },
                    { label: 'Matriz inversa', latex: 'A \\cdot A^{-1} = I' },
                    { label: 'det(AÂ·B)', latex: '\\det(AB) = \\det(A) \\cdot \\det(B)' },
                ]
            }
        ]
    },

    // ==================== ANÃLISE / FUNÃ‡Ã•ES ====================
    {
        topic: 'funcoes',
        name: 'FunÃ§Ãµes',
        sections: [
            {
                title: 'FunÃ§Ã£o Afim (1Âº Grau)',
                formulas: [
                    { label: 'Forma geral', latex: 'f(x) = ax + b' },
                    { label: 'Raiz (zero)', latex: 'x = -\\frac{b}{a}' },
                    { label: 'Coeficiente angular', latex: 'a = \\frac{\\Delta y}{\\Delta x}' },
                ]
            },
            {
                title: 'FunÃ§Ã£o QuadrÃ¡tica (2Âº Grau)',
                formulas: [
                    { label: 'Forma geral', latex: 'f(x) = ax^2 + bx + c' },
                    { label: 'VÃ©rtice (xv)', latex: 'x_v = -\\frac{b}{2a}' },
                    { label: 'VÃ©rtice (yv)', latex: 'y_v = -\\frac{\\Delta}{4a}' },
                ]
            },
            {
                title: 'ComposiÃ§Ã£o e Inversa',
                formulas: [
                    { label: 'ComposiÃ§Ã£o', latex: '(f \\circ g)(x) = f(g(x))' },
                    { label: 'Inversa', latex: 'f(f^{-1}(x)) = x' },
                    { label: 'Para encontrar inversa', latex: 'y = f(x) \\implies x = f^{-1}(y)' },
                ]
            },
            {
                title: 'DomÃ­nio',
                formulas: [
                    { label: 'FraÃ§Ã£o', latex: '\\text{denominador} \\neq 0' },
                    { label: 'Raiz par', latex: '\\text{radicando} \\geq 0' },
                    { label: 'Logaritmo', latex: '\\text{logaritmando} > 0' },
                ]
            }
        ]
    },
    {
        topic: 'trigonometria',
        name: 'Trigonometria',
        sections: [
            {
                title: 'RazÃµes no TriÃ¢ngulo RetÃ¢ngulo',
                formulas: [
                    { label: 'Seno', latex: '\\sin \\theta = \\frac{\\text{cateto oposto}}{\\text{hipotenusa}}' },
                    { label: 'Cosseno', latex: '\\cos \\theta = \\frac{\\text{cateto adjacente}}{\\text{hipotenusa}}' },
                    { label: 'Tangente', latex: '\\tan \\theta = \\frac{\\text{cateto oposto}}{\\text{cateto adjacente}} = \\frac{\\sin \\theta}{\\cos \\theta}' },
                ]
            },
            {
                title: 'Ã‚ngulos NotÃ¡veis',
                formulas: [
                    { label: 'sen 30Â° = cos 60Â°', latex: '\\sin 30Â° = \\cos 60Â° = \\frac{1}{2}' },
                    { label: 'sen 45Â° = cos 45Â°', latex: '\\sin 45Â° = \\cos 45Â° = \\frac{\\sqrt{2}}{2}' },
                    { label: 'sen 60Â° = cos 30Â°', latex: '\\sin 60Â° = \\cos 30Â° = \\frac{\\sqrt{3}}{2}' },
                    { label: 'tan 30Â°', latex: '\\tan 30Â° = \\frac{\\sqrt{3}}{3}' },
                    { label: 'tan 45Â°', latex: '\\tan 45Â° = 1' },
                    { label: 'tan 60Â°', latex: '\\tan 60Â° = \\sqrt{3}' },
                ]
            },
            {
                title: 'RelaÃ§Ã£o Fundamental',
                formulas: [
                    { label: 'Identidade pitagÃ³rica', latex: '\\sin^2 \\theta + \\cos^2 \\theta = 1' },
                    { label: 'Secante', latex: '1 + \\tan^2 \\theta = \\sec^2 \\theta' },
                    { label: 'Cossecante', latex: '1 + \\cot^2 \\theta = \\csc^2 \\theta' },
                ]
            },
            {
                title: 'Lei dos Senos e Cossenos',
                formulas: [
                    { label: 'Lei dos senos', latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R' },
                    { label: 'Lei dos cossenos', latex: 'a^2 = b^2 + c^2 - 2bc \\cos A' },
                ]
            }
        ]
    },
    {
        topic: 'notacao_cientifica',
        name: 'NotaÃ§Ã£o CientÃ­fica',
        sections: [
            {
                title: 'Forma PadrÃ£o',
                formulas: [
                    { label: 'Formato', latex: 'N = a \\times 10^n \\;\\;(1 \\leq a < 10)' },
                ]
            },
            {
                title: 'OperaÃ§Ãµes',
                formulas: [
                    { label: 'MultiplicaÃ§Ã£o', latex: '(a \\times 10^m)(b \\times 10^n) = ab \\times 10^{m+n}' },
                    { label: 'DivisÃ£o', latex: '\\frac{a \\times 10^m}{b \\times 10^n} = \\frac{a}{b} \\times 10^{m-n}' },
                    { label: 'PotÃªncia', latex: '(a \\times 10^n)^k = a^k \\times 10^{nk}' },
                ]
            },
            {
                title: 'Ordens de Grandeza',
                formulas: [
                    { label: 'Prefixo kilo', latex: '1\\text{k} = 10^3' },
                    { label: 'Prefixo mega', latex: '1\\text{M} = 10^6' },
                    { label: 'Prefixo mili', latex: '1\\text{m} = 10^{-3}' },
                    { label: 'Prefixo micro', latex: '1\\mu = 10^{-6}' },
                ]
            }
        ]
    },
    {
        topic: 'conversao_unidades',
        name: 'ConversÃ£o de Unidades',
        sections: [
            {
                title: 'Comprimento',
                formulas: [
                    { label: 'km â†’ m', latex: '1\\text{ km} = 1000\\text{ m}' },
                    { label: 'm â†’ cm', latex: '1\\text{ m} = 100\\text{ cm}' },
                    { label: 'cm â†’ mm', latex: '1\\text{ cm} = 10\\text{ mm}' },
                ]
            },
            {
                title: 'Massa',
                formulas: [
                    { label: 'kg â†’ g', latex: '1\\text{ kg} = 1000\\text{ g}' },
                    { label: 't â†’ kg', latex: '1\\text{ t} = 1000\\text{ kg}' },
                    { label: 'g â†’ mg', latex: '1\\text{ g} = 1000\\text{ mg}' },
                ]
            },
            {
                title: 'Volume',
                formulas: [
                    { label: 'L â†’ mL', latex: '1\\text{ L} = 1000\\text{ mL}' },
                    { label: 'mÂ³ â†’ L', latex: '1\\text{ m}^3 = 1000\\text{ L}' },
                    { label: 'cmÂ³ â†’ mL', latex: '1\\text{ cm}^3 = 1\\text{ mL}' },
                ]
            },
            {
                title: 'Tempo',
                formulas: [
                    { label: 'h â†’ min', latex: '1\\text{ h} = 60\\text{ min}' },
                    { label: 'min â†’ s', latex: '1\\text{ min} = 60\\text{ s}' },
                    { label: 'h â†’ s', latex: '1\\text{ h} = 3600\\text{ s}' },
                ]
            },
            {
                title: 'Velocidade',
                formulas: [
                    { label: 'km/h â†’ m/s', latex: 'v_{\\text{m/s}} = \\frac{v_{\\text{km/h}}}{3{,}6}' },
                    { label: 'm/s â†’ km/h', latex: 'v_{\\text{km/h}} = v_{\\text{m/s}} \\times 3{,}6' },
                ]
            }
        ]
    },
    {
        topic: 'porcentagem_juros',
        name: 'Porcentagem e Juros',
        sections: [
            {
                title: 'Porcentagem',
                formulas: [
                    { label: 'x% de valor', latex: 'x\\% \\text{ de } V = \\frac{x}{100} \\cdot V' },
                    { label: 'Aumento de x%', latex: 'V_{\\text{novo}} = V \\cdot (1 + \\frac{x}{100})' },
                    { label: 'Desconto de x%', latex: 'V_{\\text{novo}} = V \\cdot (1 - \\frac{x}{100})' },
                    { label: 'Fator de aumento', latex: 'f = 1 + \\frac{x}{100}' },
                ]
            },
            {
                title: 'Juros Simples',
                formulas: [
                    { label: 'Juros', latex: 'J = C \\cdot i \\cdot t' },
                    { label: 'Montante', latex: 'M = C + J = C(1 + it)' },
                ]
            },
            {
                title: 'Juros Compostos',
                formulas: [
                    { label: 'Montante', latex: 'M = C \\cdot (1 + i)^t' },
                    { label: 'Juros', latex: 'J = M - C' },
                ]
            }
        ]
    },

    // ==================== GEOMETRIA ====================
    {
        topic: 'geometria_analitica',
        name: 'Geometria AnalÃ­tica',
        sections: [
            {
                title: 'DistÃ¢ncia e Ponto MÃ©dio',
                formulas: [
                    { label: 'DistÃ¢ncia entre dois pontos', latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' },
                    { label: 'Ponto mÃ©dio', latex: 'M = \\left(\\frac{x_1 + x_2}{2},\\; \\frac{y_1 + y_2}{2}\\right)' },
                ]
            },
            {
                title: 'EquaÃ§Ã£o da Reta',
                formulas: [
                    { label: 'Coeficiente angular', latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}' },
                    { label: 'Forma reduzida', latex: 'y = mx + n' },
                    { label: 'Forma geral', latex: 'ax + by + c = 0' },
                    { label: 'EquaÃ§Ã£o por ponto e coef. angular', latex: 'y - y_1 = m(x - x_1)' },
                ]
            },
            {
                title: 'RelaÃ§Ãµes entre Retas',
                formulas: [
                    { label: 'Retas paralelas', latex: 'm_1 = m_2' },
                    { label: 'Retas perpendiculares', latex: 'm_1 \\cdot m_2 = -1' },
                    { label: 'DistÃ¢ncia ponto-reta', latex: 'd = \\frac{|ax_0 + by_0 + c|}{\\sqrt{a^2 + b^2}}' },
                ]
            },
            {
                title: 'CircunferÃªncia',
                formulas: [
                    { label: 'EquaÃ§Ã£o reduzida', latex: '(x - a)^2 + (y - b)^2 = r^2' },
                    { label: 'EquaÃ§Ã£o geral', latex: 'x^2 + y^2 + Dx + Ey + F = 0' },
                ]
            }
        ]
    },

    {
        topic: 'geometria_plana',
        name: 'Geometria Plana',
        sections: [
            {
                title: 'Areas e Perimetros',
                formulas: [
                    { label: 'Retangulo (area)', latex: 'A = b \\cdot h' },
                    { label: 'Retangulo (perimetro)', latex: 'P = 2(b + h)' },
                    { label: 'Triangulo (area)', latex: 'A = \\frac{b \\cdot h}{2}' },
                    { label: 'Trapezio (area)', latex: 'A = \\frac{(B + b) \\cdot h}{2}' },
                ]
            },
            {
                title: 'Circunferencia e Circulo',
                formulas: [
                    { label: 'Comprimento da circunferencia', latex: 'C = 2\\pi r' },
                    { label: 'Area do circulo', latex: 'A = \\pi r^2' },
                ]
            },
            {
                title: 'Teorema de Pitagoras',
                formulas: [
                    { label: 'Relacao fundamental', latex: 'c^2 = a^2 + b^2' },
                    { label: 'Cateto', latex: 'a = \\sqrt{c^2 - b^2}' },
                ]
            }
        ]
    },
    {
        topic: 'geometria_espacial',
        name: 'Geometria Espacial',
        sections: [
            {
                title: 'Cubo e Paralelepipedo',
                formulas: [
                    { label: 'Cubo (volume)', latex: 'V = a^3' },
                    { label: 'Cubo (area total)', latex: 'A_t = 6a^2' },
                    { label: 'Paralelepipedo (volume)', latex: 'V = c \\cdot l \\cdot h' },
                ]
            },
            {
                title: 'Cilindro, Cone e Esfera',
                formulas: [
                    { label: 'Cilindro (volume)', latex: 'V = \\pi r^2 h' },
                    { label: 'Cone (volume)', latex: 'V = \\frac{1}{3}\\pi r^2 h' },
                    { label: 'Esfera (volume)', latex: 'V = \\frac{4}{3}\\pi r^3' },
                    { label: 'Esfera (area)', latex: 'A = 4\\pi r^2' },
                ]
            }
        ]
    },

    // ==================== ESTATÃSTICA & PROBABILIDADE ====================
    {
        topic: 'probabilidade',
        name: 'Probabilidade',
        sections: [
            {
                title: 'Probabilidade Simples',
                formulas: [
                    { label: 'DefiniÃ§Ã£o', latex: 'P(A) = \\frac{n(A)}{n(\\Omega)}' },
                    { label: 'Complementar', latex: 'P(\\bar{A}) = 1 - P(A)' },
                ]
            },
            {
                title: 'Eventos',
                formulas: [
                    { label: 'UniÃ£o', latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
                    { label: 'Mutuamente exclusivos', latex: 'P(A \\cup B) = P(A) + P(B)' },
                    { label: 'Independentes', latex: 'P(A \\cap B) = P(A) \\cdot P(B)' },
                    { label: 'Condicional', latex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
                ]
            }
        ]
    },
    {
        topic: 'combinatoria',
        name: 'AnÃ¡lise CombinatÃ³ria',
        sections: [
            {
                title: 'PrincÃ­pios de Contagem',
                formulas: [
                    { label: 'PrincÃ­pio multiplicativo', latex: 'n_1 \\times n_2 \\times \\cdots \\times n_k' },
                    { label: 'PrincÃ­pio aditivo', latex: 'n_1 + n_2 + \\cdots + n_k' },
                ]
            },
            {
                title: 'Fatorial',
                formulas: [
                    { label: 'DefiniÃ§Ã£o', latex: 'n! = n \\cdot (n-1) \\cdot (n-2) \\cdots 2 \\cdot 1' },
                    { label: '0!', latex: '0! = 1' },
                ]
            },
            {
                title: 'Arranjo, CombinaÃ§Ã£o e PermutaÃ§Ã£o',
                formulas: [
                    { label: 'PermutaÃ§Ã£o simples', latex: 'P_n = n!' },
                    { label: 'PermutaÃ§Ã£o com repetiÃ§Ã£o', latex: 'P_n^{a,b,...} = \\frac{n!}{a! \\cdot b! \\cdots}' },
                    { label: 'Arranjo', latex: 'A_{n,k} = \\frac{n!}{(n-k)!}' },
                    { label: 'CombinaÃ§Ã£o', latex: 'C_{n,k} = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}' },
                ]
            }
        ]
    },
    {
        topic: 'estatistica',
        name: 'EstatÃ­stica',
        sections: [
            {
                title: 'Medidas de TendÃªncia Central',
                formulas: [
                    { label: 'MÃ©dia aritmÃ©tica', latex: '\\bar{x} = \\frac{x_1 + x_2 + \\cdots + x_n}{n}' },
                    { label: 'MÃ©dia ponderada', latex: '\\bar{x} = \\frac{\\sum x_i \\cdot f_i}{\\sum f_i}' },
                    { label: 'Mediana (n Ã­mpar)', latex: 'Md = x_{\\frac{n+1}{2}}' },
                    { label: 'Mediana (n par)', latex: 'Md = \\frac{x_{n/2} + x_{n/2+1}}{2}' },
                    { label: 'Moda', latex: 'Mo = \\text{valor de maior frequÃªncia}' },
                ]
            },
            {
                title: 'Medidas de DispersÃ£o',
                formulas: [
                    { label: 'VariÃ¢ncia', latex: '\\sigma^2 = \\frac{\\sum (x_i - \\bar{x})^2}{n}' },
                    { label: 'Desvio padrÃ£o', latex: '\\sigma = \\sqrt{\\sigma^2}' },
                    { label: 'Amplitude', latex: 'A = x_{\\max} - x_{\\min}' },
                ]
            }
        ]
    },
]

// Helper: buscar fÃ³rmulas por tÃ³pico
export function getFormulas(topic: TopicType): TopicFormulas | undefined {
    return TOPIC_FORMULAS.find(f => f.topic === topic)
}
