/**
 * Script de migração: textoMarcado (XML) -> marcacoesTexto (JSON)
 *
 * Como usar (local):
 * 1) Configure GOOGLE_APPLICATION_CREDENTIALS com um service account
 *    que tenha acesso ao Firestore do projeto
 * 2) Compile com ts-node ou tsc, e execute:
 *    - ts-node functions/src/scripts/migrarTextoMarcadoParaMarcacoes.ts
 *    - ou compile com tsc e rode com node
 * 3) Por padrão roda em modo dry-run (não grava). Para gravar,
 *    defina DRY_RUN=false
 */

import * as admin from "firebase-admin";
import fs from "node:fs";

let __initialized = false;
try {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    const raw = fs.readFileSync(credPath, "utf8");
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
    __initialized = true;
  }
} catch (e) {
  /* ignore init error (will try ADC below) */
  void 0;
}
if (!__initialized) {
  try {
    admin.initializeApp({credential: admin.credential.applicationDefault()});
    __initialized = true;
  } catch (e) {
    /* ignore ADC init error */
    void 0;
  }
}
if (!__initialized) {
  throw new Error(
    "Failed to initialize Firebase Admin. " +
      "Set GOOGLE_APPLICATION_CREDENTIALS to a valid service " +
      "account json path."
  );
}

const db = admin.firestore();

type MarcacaoTexto = {
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
};

type MarcacoesTexto = {
  textoOriginal: string;
  marcacoes: MarcacaoTexto[];
};

/**
 * Converte o campo `textoMarcado` (XML inline) em `MarcacoesTexto` baseado
 * em índices no texto original.
 * Estratégia:
 * - Varrer o texto, copiando trechos fora de tags para textoOriginal
 * - Para <destaque|erro>, adicionar o conteúdo e registrar [inicio, fim)
 * - Para <comentario>, NÃO alterar textoOriginal; ancorar em [cursor, cursor)
 * @param {string} textoMarcado Texto com tags XML inline
 * @return {MarcacoesTexto} Estrutura normalizada de marcações
 */
export function converterXMLParaMarcacoes(
  textoMarcado: string
): MarcacoesTexto {
  const tagRegex =
    /<(destaque|erro|comentario)(?:\s+tipo="([^"]+)")?>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let cursor = 0; // posição no textoOriginal
  let textoOriginal = "";
  const marcacoes: MarcacaoTexto[] = [];

  for (;;) {
    const match = tagRegex.exec(textoMarcado);
    if (!match) break;

    // Texto fora das tags
    if (match.index > lastIndex) {
      const plain = textoMarcado.slice(lastIndex, match.index);
      textoOriginal += plain;
      cursor += plain.length;
    }

    const tag = match[1] as "destaque" | "erro" | "comentario";
    const subtipoRaw = match[2];
    const conteudo = match[3];

    const allowedSub: Record<string, MarcacaoTexto["subtipo"]> = {
      positivo: "positivo",
      atencao: "atencao",
      gramatical: "gramatical",
      estrutural: "estrutural",
      argumentativo: "argumentativo",
    };

    if (tag === "destaque" || tag === "erro") {
      const start = cursor;
      textoOriginal += conteudo;
      cursor += conteudo.length;
      const end = cursor;
      const subtipo = subtipoRaw && allowedSub[subtipoRaw] ?
        allowedSub[subtipoRaw] :
        undefined;
      marcacoes.push({
        tipo: tag,
        subtipo,
        inicio: start,
        fim: end,
        trecho: conteudo,
      });
    } else if (tag === "comentario") {
      // Comentário não altera textoOriginal; ancora no cursor atual
      const start = cursor;
      const end = cursor;
      marcacoes.push({
        tipo: "comentario",
        inicio: start,
        fim: end,
        trecho: "",
        comentario: conteudo,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Resto após última tag
  if (lastIndex < textoMarcado.length) {
    const plain = textoMarcado.slice(lastIndex);
    textoOriginal += plain;
    cursor += plain.length;
  }

  return {textoOriginal, marcacoes};
}

/**
 * Migra os documentos de `users/{uid}/redacoes` do usuário informado.
 * Atualiza docs que possuam `textoMarcado` (string) e não possuam
 * `marcacoesTexto`.
 * @param {string} userId UID do usuário
 * @param {boolean} dryRun Se true, não grava alterações
 * @return {Promise<number>} Quantidade de documentos atualizados
 */
async function migrarUsuario(
  userId: string,
  dryRun: boolean
): Promise<number> {
  const col = db
    .collection("users")
    .doc(userId)
    .collection("redacoes");
  const snap = await col.get();
  let atualizados = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown> | undefined;
    if (!data) continue;
    if (data.marcacoesTexto) continue; // já migrado
    if (!data.textoMarcado || typeof data.textoMarcado !== "string") continue;

    const marcacoesTexto = converterXMLParaMarcacoes(
      data.textoMarcado as string
    );

    if (!dryRun) {
      await doc.ref.update({marcacoesTexto});
    }
    atualizados += 1;
  }

  return atualizados;
}

/**
 * Executa a migração para todos os usuários.
 * Usa DRY_RUN=true/false para controlar escrita.
 */
export async function main(): Promise<void> {
  const dryRun = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
  const usersSnap = await db.collection("users").get();
  let totalAtualizados = 0;

  for (const u of usersSnap.docs) {
    const c = await migrarUsuario(u.id, dryRun);
    totalAtualizados += c;
    const status = dryRun ? "(preview)" : "atualizados";
    const msg = `Usuario ${u.id}: ${c} documentos ${status}`;
    console.log(msg);
  }

  const prefix = dryRun ? "preview de " : "";
  const totalMsg = `TOTAL ${prefix}atualizações: ${totalAtualizados}`;
  console.log(totalMsg);
}

// Execução direta
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
