
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

export const gerarExplicacaoQuestao = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "256MiB",
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
        const {enunciado, imageUrl} = req.body;

        if (!enunciado) {
          res.status(400).json({error: "Enunciado é obrigatório"});
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

        const systemPrompt = "Você é um professor especialista e altamente " +
          "didático. Sua missão é ajudar um estudante a entender e resolver " +
          "a seguinte questão.\n\n" +
          "**Instruções:**\n" +
          "1.  **Analise a Questão:** Leia atentamente o enunciado e, se " +
          "houver, examine a imagem fornecida.\n" +
          "2.  **Explicação Passo a Passo:** Quebre a resolução em etapas " +
          "lógicas e sequenciais.\n" +
          "3.  **Clareza e Didática:** Use uma linguagem clara, acessível e " +
          "encorajadora. Evite jargões desnecessários ou explique-os se " +
          "forem precisos.\n" +
          "4.  **Conceitos Chave:** Identifique e explique brevemente os " +
          "conceitos teóricos fundamentais necessários para resolver a " +
          "questão.\n" +
          "5.  **Resolução Final:** Apresente a resposta final de forma " +
          "destacada.\n" +
          "6.  **Formatação:** Use Markdown para estruturar sua resposta " +
          "(títulos, listas, negrito, blocos de código/fórmulas LaTeX se " +
          "necessário).";

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: imageUrl ?
              [
                {type: "text", text: `**Questão:**\n${enunciado}`},
                {type: "image_url", image_url: {url: imageUrl}},
              ] :
              `**Questão:**\n${enunciado}`,
          },
        ];

        logger.info("Gerando explicação", {
          userId,
          model: userModel,
          hasImage: !!imageUrl,
        });

        const response = await callOpenRouter(
          apiKey,
          messages,
          userModel,
          0.7,
          0,
          {type: "text"} // Request text format (Markdown) instead of JSON
        );

        res.status(200).json({explicacao: response});
      } catch (error: unknown) {
        const message = error instanceof Error ?
          error.message :
          "Erro desconhecido";
        logger.error("Erro em gerarExplicacaoQuestao", {error: message});
        res.status(500).json({
          error: "Erro ao gerar explicação",
          message: message,
        });
      }
    });
  }
);
