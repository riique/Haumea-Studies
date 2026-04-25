/**
 * Firebase Function para correção de redações
 */

import * as admin from "firebase-admin";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  CorrecaoRequest,
  CorrecaoResponse,
  CorrecaoRedacao,
  BancaId,
} from "../types";
import {
  addCredits,
  getUserCredits,
} from "../services/credits";
import {corrigirRedacao as corrigirRedacaoIA} from "../services/openrouter";
import {getBancaConfig, isBancaValida} from "../config/bancas";
import cors from "cors";

const db = admin.firestore();

// Custo em créditos para correção de redação
const CREDIT_COST = 1;

// Middleware CORS configurado
const corsHandler = cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
    /^https:\/\/.*\.web\.app$/,
    /^https:\/\/.*\.firebaseapp\.com$/,
  ],
  credentials: true,
});

// Função HTTP com CORS explícito
export const corrigirRedacao = onRequest(
  {
    region: "us-central1",
    maxInstances: 10,
    timeoutSeconds: 540, // 9 minutos (máximo para 2nd gen)
    memory: "512MiB",
  },
  async (req, res) => {
    // Aplicar CORS
    return corsHandler(req, res, async () => {
      try {
        // Tratar preflight request
        if (req.method === "OPTIONS") {
          res.status(204).send("");
          return;
        }

        // Apenas POST é permitido
        if (req.method !== "POST") {
          res.status(405).json({error: "Método não permitido"});
          return;
        }

        // Verificar token de autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          res.status(401).json({
            error: "Não autenticado",
            message: "Token de autenticação não fornecido",
          });
          return;
        }

        const token = authHeader.split("Bearer ")[1];
        let decodedToken;

        try {
          decodedToken = await admin.auth().verifyIdToken(token);
        } catch (error) {
          logger.error("Erro ao verificar token", {error});
          res.status(401).json({
            error: "Token inválido",
            message: "Falha na autenticação",
          });
          return;
        }

        const userId = decodedToken.uid;
        const data = req.body as CorrecaoRequest;

        // Validar dados de entrada
        if (!data.tema || !data.texto) {
          res.status(400).json({
            error: "Dados inválidos",
            message: "Tema e texto são obrigatórios",
          });
          return;
        }

        if (data.texto.length < 100) {
          res.status(400).json({
            error: "Texto muito curto",
            message: "O texto da redação deve ter pelo menos 100 caracteres",
          });
          return;
        }

        if (data.texto.length > 10000) {
          res.status(400).json({
            error: "Texto muito longo",
            message: "O texto da redação não pode exceder 10.000 caracteres",
          });
          return;
        }

        // Validar e obter configuração da banca
        const bancaId: BancaId = data.banca || "enem";
        if (!isBancaValida(bancaId)) {
          res.status(400).json({
            error: "Banca inválida",
            message: `A banca "${bancaId}" não está disponível ou não existe.`,
          });
          return;
        }

        const bancaConfig = getBancaConfig(bancaId);

        logger.info("Iniciando correção de redação", {
          userId,
          banca: bancaId,
          tema: data.tema.substring(0, 50),
          textoLength: data.texto.length,
        });

        // Obter API Key do Open Router
        const userDocSnapshot = await db.collection("users").doc(userId).get();
        const userData = userDocSnapshot.data();
        const userApiKey = userData?.openRouterApiKey;
        const systemApiKey = process.env.OPENROUTER_API_KEY;

        let openRouterApiKey: string;
        let usandoApiKeySistema = false;

        if (userApiKey) {
          openRouterApiKey = userApiKey;
          logger.info("Usando API Key do usuário", {userId});
        } else if (systemApiKey) {
          openRouterApiKey = systemApiKey;
          usandoApiKeySistema = true;
          logger.info("Usando API Key do sistema (padrão)", {userId});
        } else {
          res.status(500).json({
            error: "Configuração inválida",
            message: "Nenhuma API Key disponível. Configure uma API Key " +
              "no seu perfil ou contate o administrador.",
          });
          return;
        }

        // Usar transação atômica para verificar créditos, criar documento
        // e debitar créditos de uma só vez
        const userRef = db.collection("users").doc(userId);
        const correcaoRef = userRef.collection("redacoes").doc();

        try {
          await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
              throw new Error("Usuário não encontrado");
            }

            const currentCredits = userDoc.data()?.credits ?? 0;

            if (currentCredits < CREDIT_COST) {
              throw new Error(
                `INSUFFICIENT_CREDITS:Você precisa de ${CREDIT_COST} ` +
                `crédito(s), mas tem apenas ${currentCredits}.`
              );
            }

            // Criar documento de correção (status: processando)
            transaction.set(correcaoRef, {
              tema: data.tema,
              texto: data.texto,
              status: "processando",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              creditoCusto: CREDIT_COST,
            });

            // Debitar créditos atomicamente
            transaction.update(userRef, {
              credits: currentCredits - CREDIT_COST,
              lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Registrar transação de créditos
            const transactionRef = userRef
              .collection("creditTransactions")
              .doc();
            transaction.set(transactionRef, {
              tipo: "uso",
              quantidade: CREDIT_COST,
              motivo: "Correção de redação",
              createdAt: new Date(),
              redacaoId: correcaoRef.id,
            });
          });
        } catch (txError: unknown) {
          const errorMessage = txError instanceof Error ?
            txError.message :
            "Erro desconhecido";

          // Verificar se é erro de créditos insuficientes
          if (errorMessage.startsWith("INSUFFICIENT_CREDITS:")) {
            const userMessage = errorMessage.replace(
              "INSUFFICIENT_CREDITS:",
              ""
            );
            res.status(402).json({
              error: "Créditos insuficientes",
              message: userMessage,
            });
            return;
          }

          logger.error("Erro na transação de criação/débito", {
            userId,
            error: errorMessage,
          });
          res.status(500).json({
            error: "Erro ao processar correção",
            message: "Erro ao iniciar correção. Tente novamente.",
          });
          return;
        }

        logger.info("Documento criado e créditos debitados com sucesso", {
          userId,
          redacaoId: correcaoRef.id,
          amount: CREDIT_COST,
        });

        // Fazer correção com IA
        try {
          const correcaoData = await corrigirRedacaoIA(
            openRouterApiKey,
            data.tema,
            data.texto,
            bancaId
          );

          // Preparar dados da correção
          const correcao: Omit<CorrecaoRedacao, "id"> = {
            userId,
            tema: data.tema,
            texto: data.texto,
            banca: bancaId,
            textoMarcado: correcaoData.textoMarcado || undefined,
            marcacoesTexto: correcaoData.marcacoesTexto || undefined,
            notaFinal: correcaoData.notaFinal,
            notaMaxima: bancaConfig.notaMaxima,
            competencias: correcaoData.competencias,
            criterios: correcaoData.criterios,
            feedbackGeral: correcaoData.feedbackGeral,
            sugestoesMelhoria: correcaoData.sugestoesMelhoria || [],
            errosGramaticais: correcaoData.errosGramaticais || [],
            createdAt: new Date(),
            creditoCusto: CREDIT_COST,
          };

          // Remover campos undefined antes de salvar no Firestore
          const cleanedCorrecao = Object.entries(correcao).reduce(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, unknown>
          );

          // Atualizar documento com correção completa
          await correcaoRef.update({
            ...cleanedCorrecao,
            status: "concluida",
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          logger.info("Correção concluída com sucesso", {
            userId,
            redacaoId: correcaoRef.id,
            notaFinal: correcao.notaFinal,
            usandoApiKeySistema,
          });

          // Obter créditos restantes
          const creditsRemaining = await getUserCredits(userId);

          const response: CorrecaoResponse = {
            success: true,
            correcao: {
              id: correcaoRef.id,
              ...correcao,
            },
            creditsRemaining,
            usandoApiKeySistema,
          };

          res.status(200).json(response);
        } catch (error: unknown) {
          // Em caso de erro na IA, atualizar status e devolver créditos
          const errorMessage =
            error instanceof Error ? error.message : "Erro desconhecido";

          await correcaoRef.update({
            status: "erro",
            error: errorMessage,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Devolver créditos
          await addCredits(
            userId,
            CREDIT_COST,
            `Reembolso por erro na correção ${correcaoRef.id}`
          );

          logger.error("Erro ao processar correção, créditos reembolsados", {
            userId,
            redacaoId: correcaoRef.id,
            error: errorMessage,
          });

          res.status(500).json({
            error: "Erro ao processar correção",
            message: `${errorMessage}. Seus créditos foram reembolsados.`,
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        const errorStack =
          error instanceof Error ? error.stack : undefined;

        logger.error("Erro na função corrigirRedacaoHTTP", {
          error: errorMessage,
          stack: errorStack,
        });

        res.status(500).json({
          error: "Erro inesperado",
          message: errorMessage,
        });
      }
    });
  }
);
