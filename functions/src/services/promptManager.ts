/**
 * Serviço de gerenciamento de prompts para correção de redação
 * Carrega o prompt correto baseado na banca selecionada
 */

import {readFileSync, existsSync} from "node:fs";
import path from "node:path";
import * as logger from "firebase-functions/logger";
import {BancaId, getBancaConfig, BANCAS_CONFIG} from "../config/bancas";

// Cache de prompts carregados para evitar leitura repetida de arquivos
const promptCache: Map<BancaId, string> = new Map();

/**
 * Resolve o caminho de um arquivo de prompt de forma segura para
 * desenvolvimento (src/) e produção (lib/).
 * @param {string} filename - Nome do arquivo de prompt
 * @return {string | null} Caminho resolvido ou null
 */
function resolvePromptPath(filename: string): string | null {
  // Caminhos possíveis (produção e desenvolvimento)
  const possiblePaths = [
    // Produção: arquivos copiados para lib/
    path.resolve(__dirname, `../../${filename}`),
    // Desenvolvimento: arquivos na raiz de functions/
    path.resolve(
      __dirname,
      `../../../${filename.replace("system-prompt-", "System Prompt ")
        .replace(".md", ".md")}`
    ),
    // Fallback: caminho relativo ao cwd
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), `lib/${filename}`),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Carrega o prompt de uma banca específica
 * @param {BancaId} bancaId - ID da banca
 * @return {string | null} Conteúdo do prompt ou null se não encontrado
 */
export function loadPromptForBanca(bancaId: BancaId): string | null {
  // Verificar cache
  const cached = promptCache.get(bancaId);
  if (cached !== undefined) {
    return cached;
  }

  const config = getBancaConfig(bancaId);
  const promptPath = resolvePromptPath(config.promptFile);

  if (!promptPath) {
    logger.warn(`Arquivo de prompt não encontrado para banca: ${bancaId}`, {
      promptFile: config.promptFile,
    });
    return null;
  }

  try {
    const content = readFileSync(promptPath, "utf-8");
    promptCache.set(bancaId, content);
    logger.info(`Prompt carregado para banca: ${bancaId}`, {
      path: promptPath,
      size: content.length,
    });
    return content;
  } catch (error) {
    logger.error(`Erro ao carregar prompt para banca: ${bancaId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Obtém o prompt para uma banca, com fallback para ENEM
 * @param {BancaId} bancaId - ID da banca
 * @return {string} Conteúdo do prompt
 */
export function getPromptForBanca(bancaId: BancaId): string {
  const prompt = loadPromptForBanca(bancaId);

  if (prompt) {
    return prompt;
  }

  // Se não encontrar o prompt da banca, usa ENEM como fallback
  if (bancaId !== "enem") {
    logger.warn(`Usando prompt ENEM como fallback para banca: ${bancaId}`);
    const enemPrompt = loadPromptForBanca("enem");
    if (enemPrompt) {
      return enemPrompt;
    }
  }

  throw new Error(
    "Não foi possível carregar nenhum prompt. " +
    `Banca solicitada: ${bancaId}`
  );
}

/**
 * Gera o prompt do usuário (user message) para a IA
 * @param {BancaId} bancaId - ID da banca
 * @param {string} tema - Tema da redação
 * @param {string} texto - Texto da redação
 * @return {string} Prompt formatado
 */
export function generateUserPrompt(
  bancaId: BancaId,
  tema: string,
  texto: string
): string {
  const config = getBancaConfig(bancaId);

  return `
BANCA: ${config.nomeCompleto} (${config.nome})
NOTA MÁXIMA: ${config.notaMaxima} pontos

CRITÉRIOS DE AVALIAÇÃO:
${config.criterios.map((c, i) =>
    `${i + 1}. ${c.nome} (${c.notaMaxima} pontos): ${c.descricao}`
  ).join("\n")}

---

TEMA DA REDAÇÃO:
${tema}

TEXTO DA REDAÇÃO:
${texto}

---

Avalie esta redação de acordo com os critérios da banca ${config.nome}
e retorne a avaliação em formato JSON conforme especificado.
`.trim();
}

/**
 * Lista todas as bancas disponíveis (com prompt existente)
 * @return {BancaId[]} Lista de bancas disponíveis
 */
export function listAvailableBancas(): BancaId[] {
  const available: BancaId[] = [];

  for (const [id, config] of Object.entries(BANCAS_CONFIG)) {
    if (config.ativa && loadPromptForBanca(id as BancaId)) {
      available.push(id as BancaId);
    }
  }

  return available;
}

/**
 * Limpa o cache de prompts (útil para testes ou hot-reload)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}
