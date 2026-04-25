/**
 * Firebase Functions — Interrogatório v2
 * Geração de perguntas, avaliação, explicações, transcrição, spaced repetition
 */

import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callOpenRouter, OpenRouterMessage } from "../services/openrouter";
import cors from "cors";

const db = admin.firestore();

const corsHandler = cors({
  origin: true,
  credentials: true,
});

// ─── Prompts ────────────────────────────────────────────────────────────────

/* eslint-disable max-len */
const PROMPT_GERAR = `# SYSTEM — GERADOR DE PERGUNTAS DE INTERROGATÓRIO

## Papel
IA especializada em criar perguntas de raciocínio sobre conteúdo de **nível ensino médio** para **vestibulandos de medicina**. Você INTERROGA, não facilita.

## Regras Absolutas
- Nível ENEM/FUVEST/UNICAMP — nada de conteúdo universitário
- Perguntas de RACIOCÍNIO, não memorização: "por que", "como", "compare", "analise"
- BASEADO EXCLUSIVAMENTE no conteúdo fornecido — não invente relações
- Dificuldade PROGRESSIVA: fácil → média → alta → muito_alta

## Regra de Independência do Enunciado
As perguntas devem ser AUTOCONTIDAS. O aluno deve conseguir respondê-las SEM precisar consultar o material original.
- NUNCA referencie o PDF, texto, material, documento, arquivo, apostila, ou qualquer fonte
- NUNCA cite seções, capítulos, páginas, exemplos, figuras, tabelas ou trechos do material (ex: "No exemplo 2 da seção 1...", "Conforme o texto...", "De acordo com o material...")
- NUNCA use construções como "segundo o conteúdo", "como visto no texto", "o autor menciona"
- Em vez disso, INCORPORE a informação necessária diretamente no enunciado da pergunta
- Se o conceito requer contexto, forneça-o na própria pergunta como dado do problema

## Regra de LaTeX para Conteúdo Matemático
Todo conteúdo matemático DEVE ser escrito em LaTeX:
- Expressões inline: delimitadas por $...$  (ex: $x^2 + 3x - 5 = 0$)
- Expressões em bloco/destaque: delimitadas por $$...$$ (ex: $$\\int_0^1 f(x)\\,dx$$)
- Isso se aplica a: fórmulas, equações, expressões algébricas, frações, raízes, integrais, derivadas, matrizes, vetores, notação científica, unidades compostas, e qualquer notação matemática
- Aplica-se em TODOS os campos: pergunta, alternativas, respostaEsperada

## Tipos de Pergunta

### Dissertativas (tipo_formato: "dissertativa")
Pergunta aberta que exige resposta escrita articulada.

### Múltipla Escolha (tipo_formato: "multipla_escolha")
Pergunta com 5 alternativas (A-E). Apenas UMA correta.
- Distratores devem ser plausíveis, não absurdos
- Alternativa correta indicada em "alternativaCorreta" (A/B/C/D/E)
- Campo "alternativas" com objeto {A, B, C, D, E}
- "respostaEsperada" deve explicar POR QUE a alternativa é correta

## Formato JSON de Saída

{
  "perguntas": [
    {
      "id": 1,
      "pergunta": "Texto da pergunta",
      "tipo": "compreensao" | "aplicacao" | "analise" | "sintese" | "avaliacao",
      "tipo_formato": "dissertativa" | "multipla_escolha",
      "dificuldade": "facil" | "media" | "alta" | "muito_alta",
      "topico": "Tópico principal",
      "respostaEsperada": "Pontos principais da resposta correta",
      "alternativas": {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."} | null,
      "alternativaCorreta": "A" | "B" | "C" | "D" | "E" | null
    }
  ]
}

## Proibições
- Perguntas de sim/não
- Emojis
- Perguntas triviais de memorização
- Conteúdo universitário
- Qualquer referência direta ou indireta ao material fonte`;

const PROMPT_AVALIAR = `# SYSTEM — AVALIADOR DE INTERROGATÓRIO

## Papel
IA avaliadora rigorosa que identifica falhas no raciocínio e conhecimento. Não elogie — avalie.

## Princípios
1. Rigor técnico: precisão conceitual, lógica correta, omissões
2. Feedback construtivo: aponte exatamente o que está errado e por quê
3. Sem gentileza falsa: medianas não merecem elogios

## Formato JSON de Saída

{
  "avaliacao": {
    "nota": 0-10,
    "classificacao": "correta" | "parcialmente_correta" | "incorreta" | "insuficiente",
    "pontosCorretos": ["..."],
    "errosEncontrados": [{"trecho": "...", "erro": "..."}],
    "oQueFaltou": ["..."],
    "feedbackGeral": "...",
    "dicaParaMelhorar": "..."
  }
}

## Escala
- 10: Completa, precisa, bem articulada
- 8-9: Correta com pequenas omissões
- 6-7: Parcialmente correta, falta profundidade
- 4-5: Superficial ou com erros conceituais
- 2-3: Incorreta ou muito incompleta
- 0-1: Fora do esperado ou vazia

## Regra de LaTeX
Todo conteúdo matemático nos campos de texto DEVE usar LaTeX: inline $...$ e bloco $$...$$.

## Proibições
- Emojis, motivação, "boa tentativa"
- Completar mentalmente a resposta do aluno
- Referências ao material fonte`;

const PROMPT_EXPLICACAO = `# SYSTEM — EXPLICAÇÃO PASSO A PASSO

## Papel
Professor didático que explica a resolução completa de uma questão, passo a passo, de forma clara para vestibulando de medicina.

## Princípios
1. Explicação COMPLETA e detalhada
2. Cada passo deve ser numerado e justificado
3. Use analogias quando facilitar compreensão
4. Aponte armadilhas comuns sobre o tema
5. Nível ensino médio — sem jargão universitário

## Formato JSON de Saída

{
  "explicacao": {
    "resumo": "Resumo da questão em 1-2 frases",
    "passos": [
      {
        "numero": 1,
        "titulo": "Título do passo",
        "conteudo": "Explicação detalhada",
        "dica": "Dica ou armadilha comum (opcional)"
      }
    ],
    "conclusao": "Síntese final",
    "conceitosRelacionados": ["conceito 1", "conceito 2"]
  }
}

## Regra de LaTeX
Todo conteúdo matemático nos campos de texto DEVE usar LaTeX: inline $...$ e bloco $$...$$.

## Proibições
- Emojis
- Qualquer referência ao PDF, material, documento ou fonte original
- Conteúdo universitário`;
/* eslint-enable max-len */

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Pergunta {
  id: number;
  pergunta: string;
  tipo: "compreensao" | "aplicacao" | "analise" | "sintese" | "avaliacao";
  tipo_formato: "dissertativa" | "multipla_escolha";
  dificuldade: "facil" | "media" | "alta" | "muito_alta";
  topico: string;
  respostaEsperada: string;
  alternativas?: Record<string, string> | null;
  alternativaCorreta?: string | null;
}

export interface ErroEncontrado {
  trecho: string;
  erro: string;
}

export interface Avaliacao {
  nota: number;
  classificacao:
  | "correta"
  | "parcialmente_correta"
  | "incorreta"
  | "insuficiente";
  pontosCorretos: string[];
  errosEncontrados: ErroEncontrado[];
  oQueFaltou: string[];
  feedbackGeral: string;
  dicaParaMelhorar: string;
}

export interface PassoExplicacao {
  numero: number;
  titulo: string;
  conteudo: string;
  dica?: string;
}

export interface Explicacao {
  resumo: string;
  passos: PassoExplicacao[];
  conclusao: string;
  conceitosRelacionados: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJson(raw: string): unknown {
  let text = raw;
  const fenced = text.match(/```json([\s\S]*?)```/i);
  if (fenced && fenced[1]) text = fenced[1];
  text = text.trim();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) text = text.substring(s, e + 1);
  return JSON.parse(text);
}

async function getAuth(
  req: { headers: { authorization?: string } }
): Promise<string> {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) throw new Error("AUTH");
  const token = h.split("Bearer ")[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

async function getApiConfig(userId: string) {
  const doc = await db.collection("users").doc(userId).get();
  const data = doc.data();
  const userKey = data?.openRouterApiKey;
  const model = data?.openRouterModel || "google/gemini-2.0-flash-exp:free";
  const sysKey = process.env.OPENROUTER_API_KEY;
  const apiKey = userKey || sysKey;
  if (!apiKey) throw new Error("API_KEY");
  return { apiKey, model };
}

// ─── Gerar Perguntas ────────────────────────────────────────────────────────

export const gerarPerguntasInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 180, memory: "1GiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const {
          conteudo, numeroPerguntasDesejado, isPdf, pdfBase64,
          modo, incluirMultiplaEscolha, materia, timerPorPergunta,
        } = req.body;

        if (!conteudo && !pdfBase64) {
          res.status(400).json({ error: "Conteúdo ou PDF obrigatório" });
          return;
        }

        const numPerguntas = Math.min(Math.max(numeroPerguntasDesejado || 5, 3), 15);
        const { apiKey, model } = await getApiConfig(userId);

        // Montar instrução extra para formato
        let extraInstrucao = "";
        if (incluirMultiplaEscolha) {
          const metade = Math.ceil(numPerguntas / 2);
          extraInstrucao += `\nDas ${numPerguntas} perguntas, gere aproximadamente ${metade} dissertativas e ${numPerguntas - metade} de múltipla escolha.`;
        } else {
          extraInstrucao += "\nTodas as perguntas devem ser dissertativas (tipo_formato: \"dissertativa\"). Para dissertativas, alternativas e alternativaCorreta devem ser null.";
        }

        if (modo === "revisao_erros") {
          extraInstrucao += "\nIMPORTANTE: Este é um modo de REVISÃO DE ERROS. Gere perguntas reformuladas que testem os mesmos conceitos de formas diferentes, focando em dificuldade média a alta.";
        }

        type MsgContent = string | Array<{
          type: "text" | "file";
          text?: string;
          file?: { filename: string; file_data: string };
        }>;
        let userMessage: MsgContent;

        if (isPdf && pdfBase64) {
          userMessage = [
            {
              type: "text" as const,
              text: `Analise o PDF anexado e gere ${numPerguntas} perguntas de interrogatório.${extraInstrucao}\n\nRetorne APENAS o JSON.`,
            },
            {
              type: "file" as const,
              file: { filename: "documento.pdf", file_data: "data:application/pdf;base64," + pdfBase64 },
            },
          ];
        } else {
          userMessage = `Analise o conteúdo e gere ${numPerguntas} perguntas de interrogatório:\n\n<CONTEUDO>\n${conteudo}\n</CONTEUDO>${extraInstrucao}\n\nRetorne APENAS o JSON.`;
        }

        const messages: OpenRouterMessage[] = [
          { role: "system", content: PROMPT_GERAR },
          { role: "user", content: userMessage },
        ];

        logger.info("Gerando perguntas", { userId, model, numPerguntas, isPdf, modo });

        const raw = await callOpenRouter(apiKey, messages, model, 0.7, 0, { type: "json_object" });
        const resultado = parseJson(raw) as { perguntas: Partial<Pergunta>[] };

        if (!resultado.perguntas || !Array.isArray(resultado.perguntas)) {
          throw new Error("Resposta sem perguntas válidas");
        }

        const perguntas: Pergunta[] = resultado.perguntas.map((p, idx) => ({
          id: p.id || idx + 1,
          pergunta: p.pergunta || "",
          tipo: p.tipo || "analise",
          tipo_formato: p.tipo_formato || "dissertativa",
          dificuldade: p.dificuldade || "media",
          topico: p.topico || "",
          respostaEsperada: p.respostaEsperada || "",
          alternativas: p.alternativas || null,
          alternativaCorreta: p.alternativaCorreta || null,
        }));

        // Salvar
        const docData: Record<string, unknown> = {
          conteudo: conteudo || "",
          conteudoResumo: (conteudo || "PDF enviado").substring(0, 500),
          isPdf,
          pdfFilename: isPdf ? "documento.pdf" : null,
          pdfBase64: isPdf && pdfBase64 && pdfBase64.length < 1500000 ? pdfBase64 : null,
          perguntas,
          respostas: [],
          avaliacoes: [],
          tempos: [],
          status: "em_andamento",
          modo: modo || "normal",
          materia: materia || null,
          timerPorPergunta: timerPorPergunta || null,
          incluirMultiplaEscolha: !!incluirMultiplaEscolha,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("users").doc(userId)
          .collection("interrogatorios").add(docData);

        res.status(200).json({ success: true, perguntas, interrogatorioId: docRef.id });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro gerarPerguntas", { error: msg });
        res.status(500).json({ error: "Erro ao gerar perguntas", message: msg });
      }
    });
  }
);

// ─── Avaliar Resposta ───────────────────────────────────────────────────────

export const avaliarRespostaInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 120, memory: "512MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const { pergunta, respostaAluno, anexos } = req.body;
        if (!pergunta || !respostaAluno) {
          res.status(400).json({ error: "Pergunta e resposta obrigatórios" });
          return;
        }

        const { apiKey, model } = await getApiConfig(userId);

        type MsgPart = {
          type: "text" | "image_url" | "file";
          text?: string;
          image_url?: { url: string };
          file?: { filename: string; file_data: string };
        };

        const baseText = `Avalie a resposta:\n\n<PERGUNTA>\n${pergunta.pergunta}\n</PERGUNTA>\n\n<RESPOSTA_ESPERADA>\n${pergunta.respostaEsperada}\n</RESPOSTA_ESPERADA>\n\n<RESPOSTA_DO_ALUNO>\n${respostaAluno}\n</RESPOSTA_DO_ALUNO>\n\n${anexos?.length ? "O aluno enviou anexos com sua resolução. Analise-os." : ""}\n\nRetorne APENAS o JSON.`;

        let userContent: string | MsgPart[];
        if (anexos?.length) {
          const parts: MsgPart[] = [{ type: "text", text: baseText }];
          for (const a of anexos) {
            if (a.tipo === "image") {
              parts.push({ type: "image_url", image_url: { url: `data:${a.mimeType};base64,${a.base64}` } });
            } else if (a.tipo === "pdf") {
              parts.push({ type: "file", file: { filename: a.filename, file_data: `data:${a.mimeType};base64,${a.base64}` } });
            }
          }
          userContent = parts;
        } else {
          userContent = baseText;
        }

        const messages: OpenRouterMessage[] = [
          { role: "system", content: PROMPT_AVALIAR },
          { role: "user", content: userContent },
        ];

        logger.info("Avaliando resposta", { userId, model, perguntaId: pergunta.id });

        const raw = await callOpenRouter(apiKey, messages, model, 0.3, 0, { type: "json_object" });
        const resultado = parseJson(raw) as { avaliacao?: Partial<Avaliacao> } & Partial<Avaliacao>;
        const av = resultado.avaliacao || resultado;

        const avaliacao: Avaliacao = {
          nota: av.nota ?? 0,
          classificacao: av.classificacao || "insuficiente",
          pontosCorretos: av.pontosCorretos || [],
          errosEncontrados: av.errosEncontrados || [],
          oQueFaltou: av.oQueFaltou || [],
          feedbackGeral: av.feedbackGeral || "",
          dicaParaMelhorar: av.dicaParaMelhorar || "",
        };

        res.status(200).json({ success: true, avaliacao });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro avaliarResposta", { error: msg });
        res.status(500).json({ error: "Erro ao avaliar resposta", message: msg });
      }
    });
  }
);

// ─── Explicação Passo a Passo ───────────────────────────────────────────────

export const gerarExplicacaoInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 120, memory: "512MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const { pergunta } = req.body;
        if (!pergunta) { res.status(400).json({ error: "Pergunta obrigatória" }); return; }

        const { apiKey, model } = await getApiConfig(userId);

        const userText = `Gere uma explicação passo a passo para a seguinte pergunta:\n\n<PERGUNTA>\n${pergunta.pergunta}\n</PERGUNTA>\n\n<RESPOSTA_CORRETA>\n${pergunta.respostaEsperada}\n</RESPOSTA_CORRETA>\n\nRetorne APENAS o JSON.`;

        const messages: OpenRouterMessage[] = [
          { role: "system", content: PROMPT_EXPLICACAO },
          { role: "user", content: userText },
        ];

        logger.info("Gerando explicação", { userId, model, perguntaId: pergunta.id });

        const raw = await callOpenRouter(apiKey, messages, model, 0.5, 0, { type: "json_object" });
        const resultado = parseJson(raw) as { explicacao?: Partial<Explicacao> } & Partial<Explicacao>;
        const expl = resultado.explicacao || resultado;

        const explicacao: Explicacao = {
          resumo: (expl as Partial<Explicacao>).resumo || "",
          passos: ((expl as Partial<Explicacao>).passos || []).map((p, i) => ({
            numero: p.numero || i + 1,
            titulo: p.titulo || "",
            conteudo: p.conteudo || "",
            dica: p.dica || undefined,
          })),
          conclusao: (expl as Partial<Explicacao>).conclusao || "",
          conceitosRelacionados: (expl as Partial<Explicacao>).conceitosRelacionados || [],
        };

        res.status(200).json({ success: true, explicacao });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro gerarExplicacao", { error: msg });
        res.status(500).json({ error: "Erro ao gerar explicação", message: msg });
      }
    });
  }
);

// ─── Transcrever Áudio via OpenRouter ───────────────────────────────────────

export const transcreverAudioInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 120, memory: "512MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const { audioBase64, mimeType } = req.body;
        if (!audioBase64) { res.status(400).json({ error: "Áudio obrigatório" }); return; }

        const { apiKey, model } = await getApiConfig(userId);

        // Usar modelo multimodal via OpenRouter para transcrever
        const audioDataUrl = `data:${mimeType || "audio/webm"};base64,${audioBase64}`;

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: "Você é um transcritor preciso. Transcreva o áudio em português brasileiro. Retorne JSON: {\"transcricao\": \"texto transcrito\"}. Se não conseguir entender, retorne {\"transcricao\": \"\", \"erro\": \"motivo\"}.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcreva o áudio a seguir para texto em português. Retorne APENAS o JSON." },
              {
                type: "file" as "text",
                file: { filename: "audio.webm", file_data: audioDataUrl },
              } as unknown as { type: "text"; text: string },
            ],
          },
        ];

        logger.info("Transcrevendo áudio", { userId, model });

        const raw = await callOpenRouter(apiKey, messages, model, 0.1, 0, { type: "json_object" });
        const resultado = parseJson(raw) as { transcricao?: string; erro?: string };

        res.status(200).json({
          success: true,
          transcricao: resultado.transcricao || "",
          erro: resultado.erro || null,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro transcreverAudio", { error: msg });
        res.status(500).json({ error: "Erro ao transcrever áudio", message: msg });
      }
    });
  }
);

// ─── Buscar Histórico ───────────────────────────────────────────────────────

export const buscarHistoricoInterrogatorios = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "GET") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const limit = parseInt(req.query.limit as string) || 20;

        const snapshot = await db.collection("users").doc(userId)
          .collection("interrogatorios")
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        const interrogatorios = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            nome: d.nome || null,
            conteudoResumo: d.conteudoResumo || "",
            conteudo: d.conteudo || "",
            isPdf: d.isPdf || false,
            pdfFilename: d.pdfFilename || null,
            perguntas: d.perguntas || [],
            respostas: d.respostas || [],
            avaliacoes: d.avaliacoes || [],
            tempos: d.tempos || [],
            status: d.status || "em_andamento",
            modo: d.modo || "normal",
            materia: d.materia || null,
            timerPorPergunta: d.timerPorPergunta || null,
            incluirMultiplaEscolha: d.incluirMultiplaEscolha || false,
            pdfBase64: d.pdfBase64 || null,
            proximaRevisao: d.proximaRevisao?.toDate?.()?.toISOString() || null,
            intervaloRevisao: d.intervaloRevisao || null,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
          };
        });

        res.status(200).json({ success: true, interrogatorios });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro buscarHistorico", { error: msg });
        res.status(500).json({ error: "Erro ao buscar histórico", message: msg });
      }
    });
  }
);

// ─── Salvar Resposta ────────────────────────────────────────────────────────

export const salvarRespostaInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const { interrogatorioId, perguntaIndex, resposta, avaliacao, tempoGasto } = req.body;

        if (!interrogatorioId || perguntaIndex === undefined) {
          res.status(400).json({ error: "interrogatorioId e perguntaIndex obrigatórios" });
          return;
        }

        const docRef = db.collection("users").doc(userId)
          .collection("interrogatorios").doc(interrogatorioId);
        const doc = await docRef.get();
        if (!doc.exists) { res.status(404).json({ error: "Não encontrado" }); return; }

        const data = doc.data()!;
        const respostas = data.respostas || [];
        const avaliacoes = data.avaliacoes || [];
        const tempos = data.tempos || [];
        const perguntas = data.perguntas || [];

        respostas[perguntaIndex] = resposta;
        avaliacoes[perguntaIndex] = avaliacao;
        if (tempoGasto !== undefined) tempos[perguntaIndex] = tempoGasto;

        const todasRespondidas = respostas.filter(
          (r: string | null) => r !== null && r !== undefined
        ).length >= perguntas.length;

        const updateData: Record<string, unknown> = {
          respostas,
          avaliacoes,
          tempos,
          status: todasRespondidas ? "concluido" : "em_andamento",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Spaced repetition: se concluido, calcular próxima revisão
        if (todasRespondidas) {
          const notas = avaliacoes
            .filter((a: Avaliacao | null) => a && a.nota !== undefined)
            .map((a: Avaliacao) => a.nota);
          const media = notas.length > 0
            ? notas.reduce((s: number, n: number) => s + n, 0) / notas.length
            : 0;

          // Só agendar revisão se média < 8
          if (media < 8) {
            const intervaloAtual = data.intervaloRevisao || 0;
            let novoIntervalo: number;
            if (intervaloAtual === 0) novoIntervalo = 1;
            else if (intervaloAtual === 1) novoIntervalo = 3;
            else if (intervaloAtual === 3) novoIntervalo = 7;
            else if (intervaloAtual === 7) novoIntervalo = 14;
            else novoIntervalo = 30;

            const proxima = new Date();
            proxima.setDate(proxima.getDate() + novoIntervalo);

            updateData.proximaRevisao = admin.firestore.Timestamp.fromDate(proxima);
            updateData.intervaloRevisao = novoIntervalo;
          } else {
            // Nota alta: sem revisão necessária
            updateData.proximaRevisao = null;
            updateData.intervaloRevisao = null;
          }
        }

        await docRef.update(updateData);
        res.status(200).json({ success: true });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro salvarResposta", { error: msg });
        res.status(500).json({ error: "Erro ao salvar resposta", message: msg });
      }
    });
  }
);

// ─── Deletar ────────────────────────────────────────────────────────────────

export const deletarInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "DELETE") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const id = req.query.id as string;
        if (!id) { res.status(400).json({ error: "ID obrigatório" }); return; }

        const docRef = db.collection("users").doc(userId)
          .collection("interrogatorios").doc(id);
        const doc = await docRef.get();
        if (!doc.exists) { res.status(404).json({ error: "Não encontrado" }); return; }

        await docRef.delete();
        logger.info("Interrogatório deletado", { userId, id });
        res.status(200).json({ success: true });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro deletar", { error: msg });
        res.status(500).json({ error: "Erro ao deletar", message: msg });
      }
    });
  }
);

// ─── Renomear ───────────────────────────────────────────────────────────────

export const renomearInterrogatorio = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "POST") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const { interrogatorioId, nome } = req.body;
        if (!interrogatorioId) { res.status(400).json({ error: "ID obrigatório" }); return; }

        const docRef = db.collection("users").doc(userId)
          .collection("interrogatorios").doc(interrogatorioId);
        const doc = await docRef.get();
        if (!doc.exists) { res.status(404).json({ error: "Não encontrado" }); return; }

        await docRef.update({ nome: nome || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        logger.info("Interrogatório renomeado", { userId, interrogatorioId, nome });
        res.status(200).json({ success: true });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro renomear", { error: msg });
        res.status(500).json({ error: "Erro ao renomear", message: msg });
      }
    });
  }
);

// ─── Buscar Revisões Pendentes (Spaced Repetition) ──────────────────────────

export const buscarRevisoesPendentes = onRequest(
  { region: "us-central1", maxInstances: 10, timeoutSeconds: 30, memory: "256MiB" },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") { res.status(204).send(""); return; }
        if (req.method !== "GET") { res.status(405).json({ error: "Método não permitido" }); return; }

        let userId: string;
        try { userId = await getAuth(req); } catch { res.status(401).json({ error: "Não autenticado" }); return; }

        const agora = admin.firestore.Timestamp.now();

        const snapshot = await db.collection("users").doc(userId)
          .collection("interrogatorios")
          .where("proximaRevisao", "<=", agora)
          .orderBy("proximaRevisao", "asc")
          .limit(20)
          .get();

        const revisoes = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            nome: d.nome || null,
            conteudoResumo: d.conteudoResumo || "",
            materia: d.materia || null,
            perguntas: d.perguntas || [],
            avaliacoes: d.avaliacoes || [],
            intervaloRevisao: d.intervaloRevisao || 1,
            proximaRevisao: d.proximaRevisao?.toDate?.()?.toISOString() || null,
          };
        });

        res.status(200).json({ success: true, revisoes });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        logger.error("Erro buscarRevisoes", { error: msg });
        res.status(500).json({ error: "Erro ao buscar revisões", message: msg });
      }
    });
  }
);
