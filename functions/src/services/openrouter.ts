/**
 * Serviço de integração com Open Router API
 */

import axios from "axios";
import * as logger from "firebase-functions/logger";
import {
  CorrecaoAPIResponse,
  CompetenciaAvaliacao,
  MarcacoesTexto,
  BancaId,
} from "../types";
import {getPromptForBanca, generateUserPrompt} from "./promptManager";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{
    type: "text" | "image_url" | "file";
    text?: string;
    image_url?: {
      url: string;
      detail?: "auto" | "low" | "high";
    };
    file?: {
      filename: string;
      file_data: string; // URL ou data:application/pdf;base64,...
    };
  }>;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Faz uma chamada para a API do Open Router com retry e fallback
 * @param {string} apiKey - Chave da API
 * @param {OpenRouterMessage[]} messages - Mensagens da conversa
 * @param {string} model - Modelo a ser usado
 * @param {number} temperature - Temperatura da resposta
 * @param {number} retryCount - Contador de tentativas (interno)
 * @param {Object} responseFormat - Formato da resposta
 * (ex: {type: "json_object"} ou {type: "text"})
 * @return {Promise<string>} Resposta do modelo
 */
export async function callOpenRouter(
  apiKey: string,
  messages: OpenRouterMessage[],
  model = "google/gemini-2.5-pro",
  temperature = 0.7,
  retryCount = 0,
  responseFormat?: { type: string }
): Promise<string> {
  const FALLBACK_MODELS = [
    "google/gemini-flash-1.5",
    "deepseek/deepseek-chat",
  ];
  const MAX_RETRIES = 3;
  try {
    logger.info("Chamando Open Router API", {
      model,
      messageCount: messages.length,
      responseFormat,
    });

    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      response_format: responseFormat || {type: "json_object"},
      max_tokens: 12000,
    };

    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      request,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://haumea-studies.web.app",
          "X-Title": "Haumea Studies",
        },
        timeout: 300000, // 5 minutos para correções longas
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error("Nenhuma resposta retornada pela API");
    }

    const choice = response.data.choices[0];
    const content = choice.message.content;
    const finishReason = choice.finish_reason;

    logger.info("Resposta recebida do Open Router", {
      tokens: response.data.usage.total_tokens,
      contentLength: content.length,
      finishReason,
    });

    // Log se a resposta foi truncada, mas permite continuar
    if (finishReason === "length") {
      logger.warn("Resposta pode estar truncada por limite de tokens", {
        tokensUsed: response.data.usage.completion_tokens,
        contentLength: content.length,
      });
      // Não lança erro - tenta processar mesmo assim
    }

    return content;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    const errorResponse =
      typeof error === "object" && error !== null &&
        "response" in error ?
        (error as { response?: { data?: unknown } }).response?.data :
        undefined;

    logger.error("Erro ao chamar Open Router API", {
      error: errorMessage,
      response: errorResponse,
    });

    const errorCode =
      typeof error === "object" && error !== null &&
        "code" in error ?
        (error as { code?: string }).code :
        undefined;
    const errorStatus =
      typeof error === "object" && error !== null &&
        "response" in error ?
        (error as { response?: { status?: number } }).response?.status :
        undefined;

    if (errorStatus === 401) {
      throw new Error("API Key inválida ou não configurada");
    } else if (errorStatus === 429) {
      throw new Error(
        "Limite de requisições excedido. " +
        "Tente novamente mais tarde."
      );
    }

    const retryableStatuses = new Set([
      500, 502, 503, 504, 520, 522, 524,
    ]);
    const networkCodes = new Set([
      "ECONNABORTED", "ECONNRESET", "ETIMEDOUT",
      "ENOTFOUND", "EAI_AGAIN",
    ]);
    const isRetryable = (
      (typeof errorStatus === "number" &&
        retryableStatuses.has(errorStatus)) ||
      (typeof errorCode === "string" && networkCodes.has(errorCode))
    );

    if (isRetryable && retryCount < MAX_RETRIES) {
      const fallbackModel = FALLBACK_MODELS[retryCount] || model;
      const delay = 1000 * Math.pow(2, retryCount);
      logger.warn("Retry após erro transitório", {
        errorStatus,
        errorCode,
        retryCount: retryCount + 1,
        nextModel: fallbackModel,
        delayMs: delay,
      });
      await new Promise((res) => setTimeout(res, delay));
      return callOpenRouter(
        apiKey,
        messages,
        fallbackModel,
        temperature,
        retryCount + 1,
        responseFormat
      );
    }

    if (errorCode === "ECONNABORTED") {
      throw new Error(
        "Tempo de resposta excedido. " +
        "A correção demorou muito."
      );
    }

    throw new Error(`Erro ao processar correção: ${errorMessage}`);
  }
}

/**
 * Corrige uma redação usando o Open Router
 * @param {string} apiKey - Chave da API
 * @param {string} tema - Tema da redação
 * @param {string} texto - Texto da redação
 * @param {BancaId} bancaId - ID da banca para correção (default: enem)
 * @return {Promise<CorrecaoAPIResponse>} Dados da correção
 */
export async function corrigirRedacao(
  apiKey: string,
  tema: string,
  texto: string,
  bancaId: BancaId = "enem"
): Promise<CorrecaoAPIResponse> {
  // Carregar prompt da banca
  const systemPrompt = getPromptForBanca(bancaId);

  // Gerar prompt do usuário com informações da banca
  const userPrompt = generateUserPrompt(bancaId, tema, texto);

  logger.info("Preparando correção com banca", {
    bancaId,
    promptLength: systemPrompt.length,
  });

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ];

  const responseText = await callOpenRouter(apiKey, messages);

  // Tentar extrair JSON da resposta
  try {
    let jsonText = responseText;
    const fenced = jsonText.match(/```json([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      jsonText = fenced[1];
    }
    jsonText = jsonText.trim();
    const startIdx = jsonText.indexOf("{");
    const endIdx = jsonText.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonText = jsonText.substring(startIdx, endIdx + 1);
    }
    jsonText = jsonText.replace(/[“”]/g, "\"");
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");
    jsonText = jsonText.trim();
    const correcao = JSON.parse(jsonText);

    let notaFinal = correcao.notaFinal;
    if (notaFinal === undefined) {
      if (typeof correcao.notaTotal === "number") {
        notaFinal = correcao.notaTotal;
      } else if (typeof correcao.notaTotal === "string") {
        const m = correcao.notaTotal.match(/\d{1,4}/);
        if (m) notaFinal = parseInt(m[0], 10);
      } else if (correcao.informacoesGerais) {
        const ig = correcao.informacoesGerais;
        if (typeof ig.notaTotal === "number") {
          notaFinal = ig.notaTotal;
        } else if (typeof ig.notaTotal === "string") {
          const m2 = ig.notaTotal.match(/\d{1,4}/);
          if (m2) notaFinal = parseInt(m2[0], 10);
        }
      }
    }
    correcao.notaFinal = notaFinal;

    let competenciasSrc = correcao.competencias;
    if (!competenciasSrc) {
      competenciasSrc = correcao.competenciasEnem ||
        correcao.avaliacaoCompetencias ||
        correcao.avaliacaoPorCompetencias ||
        correcao.notasPorCompetencia ||
        correcao.notasCompetencias ||
        correcao.notas;
    }

    type CKey = "c1" | "c2" | "c3" | "c4" | "c5";
    type CompetenciaLike = Partial<{
      nota: number;
      feedback: string;
      pontosFortes: string[];
      pontosForte: string[];
      pontosAMelhorar: string[];
      pontosMelhoria: string[];
    }>;
    type CompetenciasMap = Record<CKey, CompetenciaLike>;

    const toCKey = (n: string): CKey | undefined => {
      switch (n) {
      case "1": return "c1";
      case "2": return "c2";
      case "3": return "c3";
      case "4": return "c4";
      case "5": return "c5";
      default: return undefined;
      }
    };

    const mapKey = (k: string): CKey | undefined => {
      const s = k
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9]/g, "");

      const romanToNum: Record<string, number> = {
        i: 1,
        ii: 2,
        iii: 3,
        iv: 4,
        v: 5,
      };

      const suffixC = s.match(/^c([1-5])$/);
      if (suffixC) return toCKey(suffixC[1]);

      const digit = s.match(/([1-5])/);
      if (digit) return toCKey(digit[1]);

      const r1 = s.replace(/^competencia/, "");
      if (romanToNum[r1] !== undefined) return toCKey(String(romanToNum[r1]));

      const r2 = s.replace(/^c/, "");
      if (romanToNum[r2] !== undefined) return toCKey(String(romanToNum[r2]));

      return undefined;
    };

    let competencias: CompetenciasMap | undefined = undefined;
    if (competenciasSrc && typeof competenciasSrc === "object") {
      const tmp: Partial<CompetenciasMap> = {};
      const keys = Object.keys(
        competenciasSrc as Record<string, unknown>
      );
      for (const key of keys) {
        const mk = mapKey(key);
        if (mk) {
          (tmp as Record<CKey, CompetenciaLike>)[mk] = (
            competenciasSrc as Record<string, CompetenciaLike>
          )[key];
        }
      }
      if (tmp.c1 && tmp.c2 && tmp.c3 && tmp.c4 && tmp.c5) {
        competencias = tmp as CompetenciasMap;
      }
    }

    if (correcao.notaFinal === undefined || !competencias) {
      throw new Error("Estrutura de correção inválida");
    }

    // Validar e sanitizar marcacoesTexto se presente
    const sanitizeMarcacoes = (
      raw: unknown
    ): MarcacoesTexto | undefined => {
      if (!raw || typeof raw !== "object") return undefined;
      const r = raw as {
        textoOriginal?: unknown;
        marcacoes?: unknown;
      };
      const textoOriginal =
        typeof r.textoOriginal === "string" ? r.textoOriginal : undefined;
      if (!textoOriginal) return undefined;
      const len = textoOriginal.length;
      const arr = Array.isArray(r.marcacoes) ?
        (r.marcacoes as unknown[]) :
        [];
      const tipos = new Set(["destaque", "erro", "comentario"]);
      const subtipos = new Set([
        "positivo",
        "atencao",
        "gramatical",
        "estrutural",
        "argumentativo",
      ]);
      const out: Array<{
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
      }> = [];
      const pickStr = (
        obj: Record<string, unknown>,
        keys: string[]
      ): string | undefined => {
        for (const k of keys) {
          const v = obj[k];
          if (typeof v === "string" && v.trim()) return v.trim();
          if (Array.isArray(v)) {
            const s = v.filter((x) => typeof x === "string")
              .join(" ").trim();
            if (s) return s;
          }
        }
        return undefined;
      };
      for (const m of arr) {
        if (!m || typeof m !== "object") continue;
        const mr = m as Record<string, unknown>;
        const tipo = typeof mr.tipo === "string" && tipos.has(mr.tipo) ?
          (mr.tipo as "destaque" | "erro" | "comentario") :
          undefined;
        if (!tipo) continue;
        const inicioRaw = mr.inicio as unknown;
        const fimRaw = mr.fim as unknown;
        const inicioNum =
          typeof inicioRaw === "number" ? inicioRaw : Number(inicioRaw);
        const fimNum = typeof fimRaw === "number" ? fimRaw : Number(fimRaw);
        if (!Number.isFinite(inicioNum) || !Number.isFinite(fimNum)) continue;
        const start = Math.max(0, Math.min(len, Math.floor(inicioNum)));
        const end = Math.max(start, Math.min(len, Math.floor(fimNum)));
        const subtipo =
          typeof mr.subtipo === "string" && subtipos.has(mr.subtipo) ?
            (mr.subtipo as
              | "positivo"
              | "atencao"
              | "gramatical"
              | "estrutural"
              | "argumentativo"
            ) :
            undefined;
        const trecho = textoOriginal.slice(start, end);
        const comentario = pickStr(mr, [
          "comentario",
          "comentarios",
          "observacao",
          "observação",
          "explicacao",
          "explicação",
          "justificativa",
          "nota",
          "mensagem",
          "observacaoTrecho",
          "explicacaoTrecho",
        ]);
        out.push({
          tipo,
          subtipo,
          inicio: start,
          fim: end,
          trecho,
          comentario,
        });
      }
      const merged: typeof out = [];
      const used = new Set<number>();
      for (let i = 0; i < out.length; i++) {
        if (used.has(i)) continue;
        const mi = out[i];
        if (mi.tipo === "comentario" && mi.comentario) {
          let bestIdx: number | undefined = undefined;
          let bestSpan = -1;
          let bestDist = Number.POSITIVE_INFINITY;
          for (let j = 0; j < out.length; j++) {
            if (i === j) continue;
            const mj = out[j];
            if (mj.tipo === "destaque" || mj.tipo === "erro") {
              const exact = mj.inicio === mi.inicio && mj.fim === mi.fim;
              const contains = mj.inicio <= mi.inicio && mj.fim >= mi.fim;
              const near = (() => {
                const d1 = Math.abs(mi.inicio - mj.inicio);
                const d2 = Math.abs(mi.fim - mj.fim);
                const inside =
                  mi.inicio >= mj.inicio - 3 && mi.inicio <= mj.fim + 3;
                return d1 <= 3 || d2 <= 3 || inside;
              })();
              if (exact || contains || near) {
                const span = mj.fim - mj.inicio;
                const dist = Math.min(
                  Math.abs(mi.inicio - mj.inicio),
                  Math.abs(mi.fim - mj.fim)
                );
                if (
                  span > bestSpan ||
                  (span === bestSpan && dist < bestDist)
                ) {
                  bestSpan = span;
                  bestDist = dist;
                  bestIdx = j;
                }
              }
            }
          }
          if (bestIdx !== undefined) {
            const target = out[bestIdx];
            if (!target.comentario) {
              target.comentario = mi.comentario;
            } else if (
              mi.comentario &&
              !target.comentario.includes(mi.comentario)
            ) {
              target.comentario =
                `${target.comentario} ${mi.comentario}`.trim();
            }
            used.add(i);
          }
        }
      }
      for (let k = 0; k < out.length; k++) {
        if (!used.has(k)) merged.push(out[k]);
      }
      return {textoOriginal, marcacoes: merged};
    };

    const marcacoesSanitizadas = sanitizeMarcacoes(
      (correcao as Record<string, unknown>).marcacoesTexto
    );

    // Normalizar campos para evitar undefined no Firestore
    // e garantir estrutura correta das competências
    const normalizeCompetencia = (
      comp: CompetenciaLike
    ): CompetenciaAvaliacao => ({
      nota: comp.nota ?? 0,
      feedback: comp.feedback ?? "",
      pontosFortes: Array.isArray(comp.pontosFortes) ?
        comp.pontosFortes :
        Array.isArray(comp.pontosForte) ?
          comp.pontosForte :
          [],
      pontosAMelhorar: Array.isArray(comp.pontosAMelhorar) ?
        comp.pontosAMelhorar :
        Array.isArray(comp.pontosMelhoria) ?
          comp.pontosMelhoria :
          [],
    });

    const normalized: CorrecaoAPIResponse = {
      notaFinal: correcao.notaFinal,
      competencias: {
        c1: normalizeCompetencia(competencias.c1),
        c2: normalizeCompetencia(competencias.c2),
        c3: normalizeCompetencia(competencias.c3),
        c4: normalizeCompetencia(competencias.c4),
        c5: normalizeCompetencia(competencias.c5),
      },
      feedbackGeral: correcao.feedbackGeral || "",
      textoMarcado: correcao.textoMarcado || undefined,
      marcacoesTexto: marcacoesSanitizadas || undefined,
      sugestoesMelhoria: Array.isArray(correcao.sugestoesMelhoria) ?
        correcao.sugestoesMelhoria : [],
      errosGramaticais: Array.isArray(correcao.errosGramaticais) ?
        correcao.errosGramaticais : [],
    };

    return normalized;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    logger.error("Erro ao parsear resposta JSON", {
      error: errorMessage,
      responseText: responseText.substring(0, 500),
      responseTextEnd:
        responseText.substring(Math.max(0, responseText.length - 200)),
      responseLength: responseText.length,
    });

    const sanitized = (() => {
      let t = responseText;
      const m = t.match(/```json([\s\S]*?)```/i);
      if (m && m[1]) t = m[1];
      t = t.trim();
      const s = t.indexOf("{");
      const e = t.lastIndexOf("}");
      if (s !== -1 && e !== -1 && e > s) t = t.substring(s, e + 1);
      return t;
    })();

    // Tentar auto-completar JSON incompleto
    const isIncomplete = errorMessage.includes("Unexpected end") ||
      errorMessage.includes("Unterminated") ||
      (sanitized && !sanitized.trim().endsWith("}"));

    if (isIncomplete) {
      logger.warn(
        "JSON incompleto detectado, tentando auto-completar",
        {originalLength: sanitized?.length}
      );

      // Tentar fechar strings abertas e objetos
      let fixed = sanitized || responseText;

      // Contar chaves abertas vs fechadas
      const openBraces = (fixed.match(/{/g) || []).length;
      const closeBraces = (fixed.match(/}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;

      // Fechar strings abertas
      if ((fixed.match(/"/g) || []).length % 2 !== 0) {
        fixed += "\"";
      }

      // Fechar arrays e objetos
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += "]";
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += "}";
      }

      try {
        logger.info("Tentando fazer parse do JSON auto-completado");
        const recovered = JSON.parse(fixed);
        logger.info("JSON auto-completado com sucesso");
        // Continua processamento com JSON recuperado
        const correcao = recovered;

        // Processa da mesma forma que seria processado normalmente
        // (copiando lógica de processamento do catch abaixo)
        let notaFinal = correcao.notaFinal;
        if (notaFinal === undefined) {
          notaFinal = 0; // Valor padrão se não encontrado
        }

        return {
          notaFinal,
          competencias: correcao.competencias || {
            c1: {
              nota: 0,
              feedback: "Dados incompletos",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c2: {
              nota: 0,
              feedback: "Dados incompletos",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c3: {
              nota: 0,
              feedback: "Dados incompletos",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c4: {
              nota: 0,
              feedback: "Dados incompletos",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c5: {
              nota: 0,
              feedback: "Dados incompletos",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
          },
          feedbackGeral: correcao.feedbackGeral ||
            "Correção processada com dados parciais",
          marcacoesTexto: correcao.marcacoesTexto,
          textoMarcado: correcao.textoMarcado,
          sugestoesMelhoria: correcao.sugestoesMelhoria || [],
          errosGramaticais: correcao.errosGramaticais || [],
        };
      } catch (e2) {
        logger.error("Falha ao auto-completar JSON", {
          error: e2 instanceof Error ? e2.message : String(e2),
        });
        // Se falhar, retorna uma correção parcial com valores padrão
        logger.warn("Retornando correção com valores padrão");
        return {
          notaFinal: 0,
          competencias: {
            c1: {
              nota: 0,
              feedback: "Erro ao processar correção",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c2: {
              nota: 0,
              feedback: "Erro ao processar correção",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c3: {
              nota: 0,
              feedback: "Erro ao processar correção",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c4: {
              nota: 0,
              feedback: "Erro ao processar correção",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
            c5: {
              nota: 0,
              feedback: "Erro ao processar correção",
              pontosFortes: [],
              pontosAMelhorar: [],
            },
          },
          feedbackGeral: "Houve um erro ao processar a correção completa. " +
            "A resposta da IA foi muito longa. " +
            "Por favor, tente novamente.",
        };
      }
    }

    throw new Error(`Erro ao processar resposta da IA: ${errorMessage}`);
  }
}
