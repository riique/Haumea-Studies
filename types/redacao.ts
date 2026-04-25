/**
 * Tipos para o sistema de correção de redações
 */

import { BancaId, CriterioAvaliacao } from './banca';

// Re-exportar tipos de banca para conveniência
export type { BancaId, CriterioAvaliacao } from './banca';

export interface CorrecaoRequest {
  tema: string;
  texto: string;
  banca?: BancaId; // Banca para correção (default: enem)
}

export interface CompetenciaAvaliacao {
  nota: number; // 0-200
  feedback: string;
  pontosFortes: string[];
  pontosAMelhorar: string[];
}

export interface SugestaoMelhoria {
  area: string;
  sugestao: string;
}

export interface MarcacaoTexto {
  tipo: 'destaque' | 'erro' | 'comentario';
  subtipo?: 'positivo' | 'atencao' | 'gramatical' | 'estrutural' | 'argumentativo';
  inicio: number;
  fim: number;
  trecho: string;
  comentario?: string;
}

export interface MarcacoesTexto {
  textoOriginal: string;
  marcacoes: MarcacaoTexto[];
}

export interface CorrecaoRedacao {
  id: string;
  userId: string;
  tema: string;
  texto: string;
  banca?: BancaId; // Banca usada para correção
  textoMarcado?: string; // Texto com tags XML de marcação (legado)
  marcacoesTexto?: MarcacoesTexto; // Nova estrutura com índices de caracteres
  notaFinal: number;
  notaMaxima?: number; // Nota máxima da banca (1000 para ENEM)
  // Legado: competências ENEM (c1-c5)
  competencias?: {
    c1: CompetenciaAvaliacao;
    c2: CompetenciaAvaliacao;
    c3: CompetenciaAvaliacao;
    c4: CompetenciaAvaliacao;
    c5: CompetenciaAvaliacao;
  };
  // Novo: critérios genéricos (para qualquer banca)
  criterios?: CriterioAvaliacao[];
  feedbackGeral: string;
  sugestoesMelhoria: (string | SugestaoMelhoria)[];
  errosGramaticais?: ErroGramatical[];
  createdAt: Date;
  creditoCusto: number;
  status?: 'processando' | 'concluida' | 'erro';
}

export interface TextoElemento {
  tipo: 'texto' | 'destaque' | 'erro' | 'comentario';
  conteudo: string;
  atributos?: {
    tipo?: 'positivo' | 'atencao' | 'gramatical' | 'estrutural' | 'argumentativo';
  };
}

export interface ErroGramatical {
  tipo: "ortografia" | "concordancia" | "regencia" | "pontuacao" | "outro";
  trecho: string;
  sugestao: string;
  linha?: number;
}

export interface CorrecaoResponse {
  success: boolean;
  correcao?: CorrecaoRedacao;
  error?: string;
  creditsRemaining?: number;
  usandoApiKeySistema?: boolean;
}

