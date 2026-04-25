/**
 * Firebase Function: analisarResolucaoMath
 * Tutor de IA para análise de resoluções matemáticas via imagem
 */

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

interface MathQuestion {
  question: string;
  answer: string | number;
  answerDisplay: string;
  topic: string;
  hint?: string;
}

export const analisarResolucaoMath = onRequest(
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
        const {question, imageBase64, studentAnswer} = req.body as {
          question: MathQuestion;
          imageBase64: string;
          studentAnswer?: string;
        };

        if (!question || !imageBase64) {
          res.status(400).json({
            error: "Questão e imagem são obrigatórios",
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

        if (!apiKey) {
          res.status(500).json({
            error: "API Key não configurada. " +
              "Configure no perfil ou contate o suporte.",
          });
          return;
        }

        const systemPrompt = "Você é um tutor de matemática paciente, " +
          "didático e encorajador. Sua missão é analisar a resolução " +
          "manuscrita de um aluno para uma questão matemática e fornecer " +
          `feedback construtivo.

REGRAS IMPORTANTES:
1. SEMPRE responda em JSON válido no formato especificado
2. Use LaTeX entre $$ para fórmulas matemáticas
3. Seja encorajador, mesmo quando o aluno erra
4. Aponte EXATAMENTE onde está o erro, citando a etapa
5. Explique o raciocínio correto de forma clara e passo a passo
6. Para respostas parcialmente corretas, dê crédito pelo que está certo
7. Se a imagem estiver ilegível, indique isso educadamente

FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
{
  "isCorrect": true ou false,
  "feedback": "Explicação detalhada em markdown com LaTeX. ` +
          `Seja didático e use exemplos quando necessário.",
  "errors": ["lista de erros específicos encontrados, ` +
          `cada um claro e objetivo"],
  "suggestions": ["sugestões práticas para melhorar o entendimento"],
  "correctSolution": "Se incorreto, mostre a solução correta ` +
          `passo a passo em LaTeX"
}`;

        const userPrompt = `**QUESTÃO:**
${question.question}

**RESPOSTA ESPERADA:**
${question.answerDisplay}

**TÓPICO:** ${question.topic}
${question.hint ? `**DICA DISPONÍVEL:** ${question.hint}` : ""}

${studentAnswer ? `**RESPOSTA DIGITADA PELO ALUNO:** ${studentAnswer}` : ""}

**INSTRUÇÃO:** Analise a imagem anexada que mostra a resolução ` +
          "manuscrita do aluno no caderno. Compare com a resposta esperada " +
          "e forneça feedback DETALHADO seguindo o formato JSON " +
          "especificado. Seja didático e encoraje o aluno!";

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {type: "text", text: userPrompt},
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ?
                    imageBase64 :
                    `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ];

        logger.info("Analisando resolução matemática", {
          userId,
          model: userModel,
          topic: question.topic,
        });

        const response = await callOpenRouter(
          apiKey,
          messages,
          userModel,
          0.3, // Baixa temperatura para respostas consistentes
          0,
          {type: "json_object"} // Request JSON format
        );

        // Parse the response
        let parsedResponse;
        try {
          // Tentar extrair JSON da resposta
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("JSON não encontrado na resposta");
          }
        } catch (parseError) {
          logger.warn("Falha ao parsear JSON, usando resposta como texto", {
            error: parseError,
          });
          // Fallback: usar a resposta como feedback
          parsedResponse = {
            isCorrect: response.toLowerCase().includes("correto") &&
              !response.toLowerCase().includes("incorreto"),
            feedback: response,
            errors: [],
            suggestions: [],
          };
        }

        res.status(200).json({
          success: true,
          isCorrect: parsedResponse.isCorrect ?? false,
          feedback: parsedResponse.feedback || "Análise realizada.",
          errors: parsedResponse.errors || [],
          suggestions: parsedResponse.suggestions || [],
          correctSolution: parsedResponse.correctSolution,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ?
          error.message :
          "Erro desconhecido";
        logger.error("Erro em analisarResolucaoMath", {error: message});
        res.status(500).json({
          success: false,
          error: "Erro ao analisar resolução",
          message: message,
        });
      }
    });
  }
);
