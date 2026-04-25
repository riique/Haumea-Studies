/**
 * Tipos e configurações para sistema multi-bancas de correção de redação
 */

// Tipos de bancas suportadas
export type BancaId = 'enem' | 'fuvest' | 'unicamp' | 'unesp' | 'ita' | 'custom';

/**
 * Configuração de um critério de avaliação
 */
export interface CriterioConfig {
    id: string;
    nome: string;
    descricao: string;
    notaMaxima: number;
    /** Notas válidas para este critério (ex: [0, 40, 80, 120, 160, 200] para ENEM) */
    notasValidas?: number[];
}

/**
 * Configuração completa de uma banca
 */
export interface BancaConfig {
    id: BancaId;
    nome: string;
    nomeCompleto: string;
    descricao: string;
    notaMaxima: number;
    criterios: CriterioConfig[];
    /** Caminho do arquivo de prompt (relativo à pasta prompts/) */
    promptFile: string;
    /** Se a banca está ativa e disponível para uso */
    ativa: boolean;
}

/**
 * Avaliação de um critério individual (resposta da IA)
 */
export interface CriterioAvaliacao {
    id: string;
    nome: string;
    nota: number;
    notaMaxima: number;
    feedback: string;
    pontosFortes: string[];
    pontosAMelhorar: string[];
}

/**
 * Resposta genérica de correção (para qualquer banca)
 */
export interface CorrecaoGenerica {
    banca: BancaId;
    notaFinal: number;
    notaMaxima: number;
    criterios: CriterioAvaliacao[];
    feedbackGeral: string;
    sugestoesMelhoria: string[];
    errosGramaticais?: Array<{
        tipo: string;
        trecho: string;
        sugestao: string;
    }>;
    marcacoesTexto?: {
        textoOriginal: string;
        marcacoes: Array<{
            tipo: 'destaque' | 'erro' | 'comentario';
            subtipo?: 'positivo' | 'atencao' | 'gramatical' | 'estrutural' | 'argumentativo';
            inicio: number;
            fim: number;
            trecho: string;
            comentario?: string;
        }>;
    };
}

// ============================================================
// REGISTRO DE BANCAS DISPONÍVEIS
// ============================================================

export const BANCAS_CONFIG: Record<BancaId, BancaConfig> = {
    enem: {
        id: 'enem',
        nome: 'ENEM',
        nomeCompleto: 'Exame Nacional do Ensino Médio',
        descricao: 'Correção baseada nas 5 competências oficiais do ENEM',
        notaMaxima: 1000,
        promptFile: 'system-prompt-enem.md',
        ativa: true,
        criterios: [
            {
                id: 'c1',
                nome: 'Domínio da Escrita Formal',
                descricao: 'Demonstrar domínio da modalidade escrita formal da língua portuguesa',
                notaMaxima: 200,
                notasValidas: [0, 40, 80, 120, 160, 200],
            },
            {
                id: 'c2',
                nome: 'Compreensão da Proposta',
                descricao: 'Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento',
                notaMaxima: 200,
                notasValidas: [0, 40, 80, 120, 160, 200],
            },
            {
                id: 'c3',
                nome: 'Argumentação',
                descricao: 'Selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista',
                notaMaxima: 200,
                notasValidas: [0, 40, 80, 120, 160, 200],
            },
            {
                id: 'c4',
                nome: 'Coesão Textual',
                descricao: 'Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação',
                notaMaxima: 200,
                notasValidas: [0, 40, 80, 120, 160, 200],
            },
            {
                id: 'c5',
                nome: 'Proposta de Intervenção',
                descricao: 'Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos',
                notaMaxima: 200,
                notasValidas: [0, 40, 80, 120, 160, 200],
            },
        ],
    },

    fuvest: {
        id: 'fuvest',
        nome: 'FUVEST',
        nomeCompleto: 'Fundação Universitária para o Vestibular (USP)',
        descricao: 'Correção baseada nos critérios da FUVEST/USP',
        notaMaxima: 100,
        promptFile: 'system-prompt-fuvest.md',
        ativa: false, // Será ativada quando o prompt for criado
        criterios: [
            {
                id: 'tema',
                nome: 'Desenvolvimento do Tema',
                descricao: 'Abordagem do tema proposto e desenvolvimento de ideias',
                notaMaxima: 40,
            },
            {
                id: 'estrutura',
                nome: 'Estrutura do Texto',
                descricao: 'Organização do texto dissertativo-argumentativo',
                notaMaxima: 30,
            },
            {
                id: 'expressao',
                nome: 'Expressão',
                descricao: 'Correção gramatical e adequação vocabular',
                notaMaxima: 30,
            },
        ],
    },

    unicamp: {
        id: 'unicamp',
        nome: 'UNICAMP',
        nomeCompleto: 'Universidade Estadual de Campinas',
        descricao: 'Correção baseada nos critérios da UNICAMP',
        notaMaxima: 12,
        promptFile: 'system-prompt-unicamp.md',
        ativa: false,
        criterios: [
            {
                id: 'proposta',
                nome: 'Proposta Temática',
                descricao: 'Cumprimento da proposta temática',
                notaMaxima: 4,
            },
            {
                id: 'genero',
                nome: 'Gênero Textual',
                descricao: 'Adequação ao gênero textual solicitado',
                notaMaxima: 4,
            },
            {
                id: 'leitura',
                nome: 'Leitura',
                descricao: 'Qualidade da leitura dos textos da coletânea',
                notaMaxima: 4,
            },
        ],
    },

    unesp: {
        id: 'unesp',
        nome: 'UNESP',
        nomeCompleto: 'Universidade Estadual Paulista',
        descricao: 'Correção baseada nos critérios da UNESP',
        notaMaxima: 100,
        promptFile: 'system-prompt-unesp.md',
        ativa: false,
        criterios: [
            {
                id: 'tema',
                nome: 'Tema',
                descricao: 'Desenvolvimento do tema proposto',
                notaMaxima: 25,
            },
            {
                id: 'estrutura',
                nome: 'Estrutura',
                descricao: 'Organização textual',
                notaMaxima: 25,
            },
            {
                id: 'argumentacao',
                nome: 'Argumentação',
                descricao: 'Qualidade argumentativa',
                notaMaxima: 25,
            },
            {
                id: 'linguagem',
                nome: 'Linguagem',
                descricao: 'Correção e adequação linguística',
                notaMaxima: 25,
            },
        ],
    },

    ita: {
        id: 'ita',
        nome: 'ITA',
        nomeCompleto: 'Instituto Tecnológico de Aeronáutica',
        descricao: 'Correção baseada nos critérios do ITA',
        notaMaxima: 100,
        promptFile: 'system-prompt-ita.md',
        ativa: false,
        criterios: [
            {
                id: 'conteudo',
                nome: 'Conteúdo',
                descricao: 'Qualidade e profundidade do conteúdo',
                notaMaxima: 50,
            },
            {
                id: 'forma',
                nome: 'Forma',
                descricao: 'Correção gramatical e estrutural',
                notaMaxima: 50,
            },
        ],
    },

    custom: {
        id: 'custom',
        nome: 'Personalizada',
        nomeCompleto: 'Banca Personalizada',
        descricao: 'Configuração personalizada pelo usuário',
        notaMaxima: 100,
        promptFile: 'system-prompt-custom.md',
        ativa: false,
        criterios: [],
    },
};

/**
 * Obtém a configuração de uma banca pelo ID
 */
export function getBancaConfig(bancaId: BancaId): BancaConfig {
    const config = BANCAS_CONFIG[bancaId];
    if (!config) {
        throw new Error(`Banca não encontrada: ${bancaId}`);
    }
    return config;
}

/**
 * Obtém lista de bancas ativas
 */
export function getBancasAtivas(): BancaConfig[] {
    return Object.values(BANCAS_CONFIG).filter((b) => b.ativa);
}

/**
 * Converte competências do formato ENEM legado para o formato genérico
 */
export function convertCompetenciasToGenerico(
    competencias: Record<string, { nota: number; feedback: string; pontosFortes: string[]; pontosAMelhorar: string[] }>
): CriterioAvaliacao[] {
    const config = BANCAS_CONFIG.enem;
    return config.criterios.map((criterio) => {
        const comp = competencias[criterio.id];
        return {
            id: criterio.id,
            nome: criterio.nome,
            nota: comp?.nota ?? 0,
            notaMaxima: criterio.notaMaxima,
            feedback: comp?.feedback ?? '',
            pontosFortes: comp?.pontosFortes ?? [],
            pontosAMelhorar: comp?.pontosAMelhorar ?? [],
        };
    });
}
