/**
 * Tipos para o sistema de correção de redações
 */

import type {BancaId, CriterioAvaliacao} from "./config/bancas";

// Re-exportar tipos de banca
export type {BancaId, CriterioAvaliacao} from "./config/bancas";

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
  tipo: "destaque" | "erro" | "comentario";
  subtipo?:
  | "positivo"
  | "atencao"
  | "gramatical"
  | "estrutural"
  | "argumentativo";
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
  // Banca usada para correção (default: enem)
  banca?: BancaId;
  // Legacy XML-marked text (fallback only)
  textoMarcado?: string;
  // New structured markings (preferred)
  marcacoesTexto?: MarcacoesTexto;
  notaFinal: number;
  notaMaxima: number; // Nota máxima da banca (1000 para ENEM)
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
}

export interface CorrecaoAPIResponse {
  textoMarcado?: string;
  marcacoesTexto?: MarcacoesTexto;
  notaFinal: number;
  notaMaxima?: number;
  // Legado: competências ENEM
  competencias?: {
    c1: CompetenciaAvaliacao;
    c2: CompetenciaAvaliacao;
    c3: CompetenciaAvaliacao;
    c4: CompetenciaAvaliacao;
    c5: CompetenciaAvaliacao;
  };
  // Novo: critérios genéricos
  criterios?: CriterioAvaliacao[];
  feedbackGeral: string;
  sugestoesMelhoria?: (string | SugestaoMelhoria)[];
  errosGramaticais?: ErroGramatical[];
}

export interface ErroGramatical {
  tipo: "ortografia" | "concordancia" | "regencia" | "pontuacao" | "outro";
  trecho: string;
  sugestao: string;
  linha?: number;
}

export interface UserCredits {
  credits: number;
  lastUpdated: Date;
  transacoes?: CreditTransaction[];
}

export interface CreditTransaction {
  tipo: "adicao" | "uso";
  quantidade: number;
  motivo: string;
  createdAt: Date;
  redacaoId?: string;
}

export interface CorrecaoRequest {
  tema: string;
  texto: string;
  // Banca para correção (default: enem)
  banca?: BancaId;
}

export interface CorrecaoResponse {
  success: boolean;
  correcao?: CorrecaoRedacao;
  error?: string;
  creditsRemaining?: number;
  // Indica se está usando API Key padrão do sistema
  usandoApiKeySistema?: boolean;
}
