/**
 * System prompt para correção de redações no estilo ENEM
 */

import {readFileSync, existsSync} from "node:fs";
import path from "node:path";

/**
 * Resolve o caminho do arquivo de prompt de forma segura para
 * desenvolvimento (src/) e produção (lib/).
 *
 * Em desenvolvimento: __dirname = functions/src/prompts
 * Em produção: __dirname = functions/lib/prompts
 * @return {string} Caminho resolvido do arquivo de prompt
 */
const resolvePromptPath = (): string => {
  // Caminhos possíveis (produção e desenvolvimento)
  const possiblePaths = [
    // Produção: arquivo copiado para lib/
    path.resolve(__dirname, "../system-prompt-enem.md"),
    // Desenvolvimento: arquivo na raiz de functions/
    path.resolve(__dirname, "../../System Prompt ENEM.md"),
    // Fallback: caminho relativo alternativo
    path.resolve(process.cwd(), "System Prompt ENEM.md"),
    path.resolve(process.cwd(), "lib/system-prompt-enem.md"),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  // Se nenhum arquivo for encontrado, lança erro descritivo
  throw new Error(
    "Arquivo de System Prompt não encontrado. " +
    `Caminhos tentados:\n${possiblePaths.join("\n")}`
  );
};

const PROMPT_MD_PATH = resolvePromptPath();
export const SYSTEM_PROMPT_CORRECAO_ENEM = readFileSync(
  PROMPT_MD_PATH,
  "utf-8"
);
