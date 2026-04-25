
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

const SYSTEM_PROMPT_TRANSCRICAO =
  "Você é um especialista em transcrição de questões de provas e " +
  "exames. Sua tarefa é analisar a imagem de uma questão e " +
  "transcrever todo o seu conteúdo de forma precisa e estruturada." +
  "\n\n**INSTRUÇÕES IMPORTANTES:**\n\n" +
  "1. **Transcreva fielmente** todo o texto da questão, " +
  "mantendo a formatação original quando possível.\n\n" +
  "2. **Fórmulas matemáticas** devem ser transcritas em formato " +
  "LaTeX entre $...$ (inline) ou $$...$$ (bloco).\n\n" +
  "3. **Alternativas** devem ser identificadas e separadas " +
  "corretamente. Cada alternativa deve conter apenas seu texto, " +
  "sem a letra identificadora (A, B, C, etc).\n\n" +
  "4. **Resposta correta**: Se houver gabarito ou indicação visual " +
  "da resposta correta na imagem (como círculo, check, ou " +
  "destaque), identifique-a.\n\n" +
  "5. **Estruture sua resposta OBRIGATORIAMENTE no formato XML:**" +
  "\n\n<questao>\n" +
  "  <titulo></titulo>\n" +
  "  <materia></materia>\n" +
  "  <assunto></assunto>\n" +
  "  <enunciado>Texto completo do enunciado aqui</enunciado>\n" +
  "  <alternativas>\n" +
  "    <alternativa letra=\"A\">Texto alternativa A</alternativa>\n" +
  "    <alternativa letra=\"B\">Texto alternativa B</alternativa>\n" +
  "    <alternativa letra=\"C\">Texto alternativa C</alternativa>\n" +
  "    <alternativa letra=\"D\">Texto alternativa D</alternativa>\n" +
  "    <alternativa letra=\"E\">Texto alternativa E</alternativa>\n" +
  "  </alternativas>\n" +
  "  <resposta_correta></resposta_correta>\n" +
  "</questao>\n\n" +
  "**REGRAS DO XML:**\n" +
  "- O campo <titulo> pode ficar vazio se não houver título\n" +
  "- O campo <materia> pode ficar vazio se não for identificável\n" +
  "- O campo <assunto> tente identificar o tópico principal\n" +
  "- O campo <enunciado> é OBRIGATÓRIO (sem as alternativas)\n" +
  "- As <alternativas> só existem se for objetiva/múltipla escolha\n" +
  "- O campo <resposta_correta> deve conter apenas a LETRA\n" +
  "- Se for dissertativa, omita a tag <alternativas>\n\n" +
  "**IMPORTANTE:** Retorne APENAS o XML, sem explicações.";

export const transcreverQuestao = onRequest(
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
        const {imageBase64, imageUrl} = req.body;

        if (!imageBase64 && !imageUrl) {
          res.status(400).json({
            error: "É necessário enviar uma imagem (imageBase64 ou imageUrl)",
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

        // Prepare image URL for the API
        let finalImageUrl: string;
        if (imageBase64) {
          // Se for base64, já está no formato correto
          finalImageUrl = imageBase64;
        } else {
          finalImageUrl = imageUrl;
        }

        const messages: OpenRouterMessage[] = [
          {
            role: "system",
            content: SYSTEM_PROMPT_TRANSCRICAO,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva a questão presente nesta imagem:",
              },
              {
                type: "image_url",
                image_url: {url: finalImageUrl},
              },
            ],
          },
        ];

        logger.info("Transcrevendo questão", {
          userId,
          model: userModel,
          hasBase64: !!imageBase64,
          hasUrl: !!imageUrl,
        });

        const response = await callOpenRouter(
          apiKey,
          messages,
          userModel,
          0.3, // Temperatura baixa para transcrição mais precisa
          0,
          {type: "text"}
        );

        // Parse XML response
        const parsed = parseXmlResponse(response);

        res.status(200).json({
          transcricao: parsed,
          raw: response,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ?
          error.message :
          "Erro desconhecido";
        logger.error("Erro em transcreverQuestao", {error: message});
        res.status(500).json({
          error: "Erro ao transcrever questão",
          message: message,
        });
      }
    });
  }
);

interface TranscricaoResult {
  titulo: string;
  materia: string;
  assunto: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: string;
}

/**
 * Faz parse da resposta XML da IA e extrai os dados da questão
 * @param {string} xmlString - String XML retornada pela IA
 * @return {TranscricaoResult} Dados estruturados da questão
 */
function parseXmlResponse(xmlString: string): TranscricaoResult {
  const result: TranscricaoResult = {
    titulo: "",
    materia: "",
    assunto: "",
    enunciado: "",
    alternativas: [],
    respostaCorreta: "",
  };

  try {
    // Extract content between tags using regex
    const extractTag = (tag: string): string => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
      const match = xmlString.match(regex);
      return match ? match[1].trim() : "";
    };

    result.titulo = extractTag("titulo");
    result.materia = extractTag("materia");
    result.assunto = extractTag("assunto");
    result.enunciado = extractTag("enunciado");
    result.respostaCorreta = extractTag("resposta_correta").toUpperCase();

    // Extract alternativas
    const alternativasMatch = xmlString.match(
      /<alternativas>([\s\S]*?)<\/alternativas>/i
    );
    if (alternativasMatch) {
      const alternativasContent = alternativasMatch[1];
      const altRegex = /<alternativa[^>]*>([^<]*)<\/alternativa>/gi;
      let match;
      while ((match = altRegex.exec(alternativasContent)) !== null) {
        result.alternativas.push(match[1].trim());
      }
    }

    // Validate resposta_correta is a valid letter
    if (result.respostaCorreta &&
        !["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
          .includes(result.respostaCorreta)) {
      result.respostaCorreta = "";
    }
  } catch (error) {
    logger.error("Erro ao fazer parse do XML", {error, xmlString});
  }

  return result;
}
