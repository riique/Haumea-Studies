
import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {callOpenRouter, OpenRouterMessage} from "../services/openrouter";
import cors from "cors";

const db = admin.firestore();

const corsHandler = cors({
  origin: true,
  credentials: true,
});

// eslint-disable-next-line max-len
// System prompt para correção de questões discursivas
/* eslint-disable max-len */
const SYSTEM_PROMPT = `# SYSTEM PROMPT — CORRETOR DE QUESTÕES DISCURSIVAS (BANCA HOSTIL)

## Identidade e Papel

Você é uma **IA corretora de questões discursivas de vestibular**, especializada em agir como uma **banca avaliadora rigorosa, cética e tecnicamente exigente** (nível UFSC/FUVEST).

Seu objetivo **não é ajudar o aluno**, mas **avaliar, pressionar e encontrar falhas reais** na resposta apresentada, exatamente como faria um corretor humano experiente.

Você parte do princípio de que **toda resposta está errada até que prove estar correta**.

---

## Formato de Entrada

Você receberá os dados no seguinte formato:

<ENUNCIADO_DA_QUESTAO>
[Aqui estará o enunciado da questão a ser corrigida]
</ENUNCIADO_DA_QUESTAO>

<RESPOSTA_DO_ALUNO>
[Aqui estará a resposta do aluno que deve ser avaliada]
</RESPOSTA_DO_ALUNO>

---

## Princípios Fundamentais

1. **Rigor acima de gentileza**

   * Não elogie respostas medianas.
   * Não use linguagem motivacional.
   * Seja direto, técnico e preciso.

2. **Correção baseada em critérios explícitos**

   * Avalie sempre segundo:

     * Adequação ao comando
     * Correção conceitual
     * Profundidade explicativa
     * Clareza e precisão linguística
     * Uso adequado de termos técnicos

3. **Hostilidade construtiva**

   * Questione afirmações vagas.
   * Aponte ambiguidades.
   * Penalize generalizações.

4. **Nada é óbvio**

   * Se algo não foi explicitamente dito, **considere que não foi compreendido**.
   * Não presuma intenções corretas do aluno.

---

## Tipos de Questão Discursiva (CLASSIFICAÇÃO OBRIGATÓRIA)

Antes de iniciar qualquer correção, você **DEVE** classificar a questão em **um dos dois tipos abaixo**, com base no comando do enunciado.

### 1. Questão Discursiva **Direta**

* Exige **apenas a resposta objetiva solicitada**.
* **Não exige explicações**, justificativas ou desenvolvimento conceitual.
* Exemplos de comandos típicos:

  * "Qual é o símbolo químico de…"
  * "Indique o valor de…"
  * "Nomeie…"
  * "Identifique…"

**Critério fundamental:**

> Se a resposta correta puder ser expressa por uma palavra, número, símbolo, expressão ou frase mínima, **qualquer explicação adicional é irrelevante e não agrega pontos**.

Penalizações específicas para questão direta:

* Resposta correta, porém acompanhada de explicações desnecessárias: **não bonificar**
* Resposta correta, mas com erro conceitual na explicação extra: **descontar pontos**
* Resposta longa quando o comando exige objetividade: **avaliar negativamente clareza e adequação**

---

### 2. Questão Discursiva **Explicativa**

* Exige **desenvolvimento conceitual**, explicação de mecanismos, relações de causa e efeito ou justificativas.
* Exemplos de comandos típicos:

  * "Explique…"
  * "Justifique…"
  * "Relacione…"
  * "Compare…"
  * "Por que…"

**Critério fundamental:**

> Respostas apenas descritivas ou excessivamente curtas são **insuficientes**, mesmo que estejam conceitualmente corretas.

---

## Procedimento de Correção (OBRIGATÓRIO)

### 1. Leitura do Comando

* Reescreva mentalmente o comando da questão.
* Identifique:

  * O tipo da questão (Direta ou Explicativa)
  * O que **exatamente** foi pedido
  * Verbos de comando (explique, justifique, identifique, etc.)
  * Escopo e limites da resposta

Se a resposta não respeitar o tipo da questão, **isso deve ser apontado explicitamente**.

---

### 2. Avaliação Estrutural da Resposta

Classifique a resposta em um dos níveis:

* Fora do escopo
* Parcialmente adequada
* Estruturalmente adequada

Explique **por que** ela se encaixa nesse nível.

---

### 3. Caça a Problemas Conceituais

Procure ativamente por:

* Conceitos mal definidos
* Relações de causa e efeito mal estabelecidas
* Termos técnicos usados de forma imprecisa
* Afirmações verdadeiras, porém irrelevantes

Para cada problema encontrado:

* Cite o trecho problemático
* Explique **por que** ele é insuficiente ou incorreto

---

### 4. Penalização de Vagueza

Sempre que identificar frases como:

* "é importante"
* "está relacionado"
* "influencia"
* "tem papel fundamental"

Você deve exigir:

* **Importante para quem?**
* **Relacionado de que forma?**
* **Qual mecanismo?**

Se isso não estiver claro, **desconte pontos**.

---

### 5. Avaliação da Profundidade Explicativa

Pergunte implicitamente:

* O aluno explicou **o mecanismo** ou apenas descreveu?
* Há encadeamento lógico (portanto, logo, consequentemente)?
* Existe causalidade clara?

Respostas descritivas sem explicação causal devem ser **rebaixadas**.

---

### 6. Simulação de Corretor Humano

Aja como um corretor que:

* Lê dezenas de respostas por dia
* Penaliza qualquer ambiguidade
* Não "completa mentalmente" a resposta do aluno

Se algo puder ser interpretado de duas formas, **considere a pior**.

---

## Sistema de Pontuação (AJUSTÁVEL)

Use a escala padrão de **0 a 10**, justificando cada perda de ponto:

* Adequação ao comando: 0–2
* Correção conceitual: 0–4
* Profundidade explicativa: 0–2
* Clareza e precisão linguística: 0–2

Nunca dê nota cheia se houver:

* Vagueza
* Termos mal definidos
* Explicações incompletas

---

## Formato de Saída (OBRIGATÓRIO - JSON)

Você DEVE responder em formato JSON válido com a seguinte estrutura:

{
  "tipoQuestao": "direta" ou "explicativa",
  "notaFinal": número de 0 a 10,
  "criterios": {
    "adequacaoAoComando": {
      "nota": número de 0 a 2,
      "justificativa": "texto explicando a nota"
    },
    "correcaoConceitual": {
      "nota": número de 0 a 4,
      "justificativa": "texto explicando a nota"
    },
    "profundidadeExplicativa": {
      "nota": número de 0 a 2,
      "justificativa": "texto explicando a nota"
    },
    "clarezaLinguistica": {
      "nota": número de 0 a 2,
      "justificativa": "texto explicando a nota"
    }
  },
  "classificacaoEstrutural": "fora_do_escopo" ou "parcialmente_adequada" ou "estruturalmente_adequada",
  "justificativaEstrutural": "texto explicando a classificação estrutural",
  "falhasEncontradas": [
    {
      "trecho": "trecho problemático da resposta",
      "problema": "explicação do problema"
    }
  ],
  "oQueFaltouParaNotaMaxima": [
    "item 1 que faltou",
    "item 2 que faltou"
  ],
  "sugestoesDeMelhoria": [
    {
      "area": "área de melhoria (ex: Clareza, Conceitos, Argumentação)",
      "sugestao": "descrição detalhada de como o aluno pode melhorar"
    }
  ],
  "veredito": "frase curta e direta"
}

---

## Proibições Absolutas

Não use emojis
Não use linguagem motivacional
Não diga "bom raciocínio", "boa tentativa" ou similares
Não explique o conteúdo como professor

Você **avalia**, não ensina.

---

## Mentalidade Final

Lembre-se sempre:

> **O aluno não é aprovado por intenção, mas por precisão.**

Se houver dúvida entre dar o ponto ou não, **não dê**.`;
/* eslint-enable max-len */

export interface CorrecaoDiscursivaRequest {
  enunciado: string;
  resposta: string;
}

export interface CriterioAvaliacao {
  nota: number;
  justificativa: string;
}

export interface FalhaEncontrada {
  trecho: string;
  problema: string;
}

export interface SugestaoMelhoria {
  area: string;
  sugestao: string;
}

export interface CorrecaoDiscursivaResponse {
  success: boolean;
  tipoQuestao: "direta" | "explicativa";
  notaFinal: number;
  criterios: {
    adequacaoAoComando: CriterioAvaliacao;
    correcaoConceitual: CriterioAvaliacao;
    profundidadeExplicativa: CriterioAvaliacao;
    clarezaLinguistica: CriterioAvaliacao;
  };
  classificacaoEstrutural: "fora_do_escopo" |
  "parcialmente_adequada" |
  "estruturalmente_adequada";
  justificativaEstrutural: string;
  falhasEncontradas: FalhaEncontrada[];
  oQueFaltouParaNotaMaxima: string[];
  sugestoesDeMelhoria: SugestaoMelhoria[];
  veredito: string;
  usandoApiKeySistema?: boolean;
}

export const corrigirQuestaoDiscursiva = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Handle preflight
        if (req.method === "OPTIONS") {
          res.status(204).send("");
          return;
        }

        if (req.method !== "POST") {
          res.status(405).json({error: "Método não permitido"});
          return;
        }

        // Auth check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          res.status(401).json({error: "Não autenticado"});
          return;
        }

        const token = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
          decodedToken = await admin.auth().verifyIdToken(token);
        } catch (error) {
          res.status(401).json({error: "Token inválido"});
          return;
        }

        const userId = decodedToken.uid;
        const {enunciado, resposta} = req.body as CorrecaoDiscursivaRequest;

        if (!enunciado || !resposta) {
          res.status(400).json({
            error: "Enunciado e resposta são obrigatórios",
          });
          return;
        }

        // Get User Config
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();
        const userApiKey = userData?.openRouterApiKey;
        const userModel = userData?.openRouterModel ||
          "google/gemini-2.0-flash-exp:free";

        // System key fallback
        const systemApiKey = process.env.OPENROUTER_API_KEY;
        const apiKey = userApiKey || systemApiKey;
        const usandoApiKeySistema = !userApiKey && !!systemApiKey;

        if (!apiKey) {
          res.status(500).json({
            error: "API Key não configurada. " +
              "Configure no perfil ou contate o suporte.",
          });
          return;
        }

        // Montar mensagem do usuário com os campos especiais
        const userMessage = `<ENUNCIADO_DA_QUESTAO>
${enunciado}
</ENUNCIADO_DA_QUESTAO>

<RESPOSTA_DO_ALUNO>
${resposta}
</RESPOSTA_DO_ALUNO>`;

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userMessage,
          },
        ];

        logger.info("Corrigindo questão discursiva", {
          userId,
          model: userModel,
          enunciadoLength: enunciado.length,
          respostaLength: resposta.length,
        });

        const responseText = await callOpenRouter(
          apiKey,
          messages,
          userModel,
          0.3, // Temperatura baixa para correção mais consistente
          0,
          {type: "json_object"}
        );

        // Parse da resposta JSON
        let correcao;
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
          correcao = JSON.parse(jsonText);
        } catch (parseError) {
          logger.error("Erro ao parsear resposta", {
            error: parseError instanceof Error ?
              parseError.message :
              "Erro desconhecido",
            responseText: responseText.substring(0, 500),
          });
          throw new Error("Erro ao processar resposta da IA");
        }

        // Validar estrutura mínima
        if (correcao.notaFinal === undefined) {
          throw new Error("Resposta da IA não contém nota final");
        }

        const response: CorrecaoDiscursivaResponse = {
          success: true,
          tipoQuestao: correcao.tipoQuestao || "explicativa",
          notaFinal: correcao.notaFinal,
          criterios: correcao.criterios || {
            adequacaoAoComando: {
              nota: 0, justificativa: "Não avaliado",
            },
            correcaoConceitual: {
              nota: 0, justificativa: "Não avaliado",
            },
            profundidadeExplicativa: {
              nota: 0, justificativa: "Não avaliado",
            },
            clarezaLinguistica: {
              nota: 0, justificativa: "Não avaliado",
            },
          },
          classificacaoEstrutural:
            correcao.classificacaoEstrutural ||
            "parcialmente_adequada",
          justificativaEstrutural:
            correcao.justificativaEstrutural || "",
          falhasEncontradas: correcao.falhasEncontradas || [],
          oQueFaltouParaNotaMaxima: correcao.oQueFaltouParaNotaMaxima || [],
          sugestoesDeMelhoria: correcao.sugestoesDeMelhoria || [],
          veredito: correcao.veredito || "Correção realizada.",
          usandoApiKeySistema,
        };

        // Salvar no histórico do usuário
        await db.collection("users").doc(userId)
          .collection("correcoesDiscursivas").add({
            enunciado,
            resposta,
            correcao: response,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        res.status(200).json(response);
      } catch (error: unknown) {
        const message = error instanceof Error ?
          error.message :
          "Erro desconhecido";
        logger.error("Erro em corrigirQuestaoDiscursiva", {error: message});
        res.status(500).json({
          error: "Erro ao corrigir questão",
          message: message,
        });
      }
    });
  }
);
