/**
 * Serviço de gerenciamento de créditos
 */

import * as admin from "firebase-admin";
import {CreditTransaction} from "../types";

const db = admin.firestore();

/**
 * Obtém o saldo de créditos de um usuário
 * @param {string} userId - ID do usuário
 * @return {Promise<number>} Saldo de créditos
 */
export async function getUserCredits(userId: string): Promise<number> {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("Usuário não encontrado");
  }

  const userData = userDoc.data();
  return userData?.credits ?? 0;
}

/**
 * Debita créditos de um usuário
 * Retorna true se bem-sucedido, false se não houver créditos suficientes
 * @param {string} userId - ID do usuário
 * @param {number} amount - Quantidade de créditos a debitar
 * @param {string} motivo - Motivo do débito
 * @param {string} redacaoId - ID da redação (opcional)
 * @return {Promise<boolean>} True se bem-sucedido
 */
export async function debitCredits(
  userId: string,
  amount: number,
  motivo: string,
  redacaoId?: string
): Promise<boolean> {
  const userRef = db.collection("users").doc(userId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("Usuário não encontrado");
      }

      const currentCredits = userDoc.data()?.credits ?? 0;

      if (currentCredits < amount) {
        return false;
      }

      const newCredits = currentCredits - amount;

      transaction.update(userRef, {
        credits: newCredits,
        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Registrar transação
      const transactionData: CreditTransaction = {
        tipo: "uso",
        quantidade: amount,
        motivo,
        createdAt: new Date(),
        redacaoId,
      };

      const transactionRef = userRef.collection("creditTransactions").doc();
      transaction.set(transactionRef, transactionData);

      return true;
    });

    return result;
  } catch (error) {
    console.error("Erro ao debitar créditos:", error);
    throw error;
  }
}

/**
 * Adiciona créditos a um usuário
 * @param {string} userId - ID do usuário
 * @param {number} amount - Quantidade de créditos a adicionar
 * @param {string} motivo - Motivo da adição
 * @return {Promise<void>}
 */
export async function addCredits(
  userId: string,
  amount: number,
  motivo: string
): Promise<void> {
  const userRef = db.collection("users").doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("Usuário não encontrado");
      }

      const currentCredits = userDoc.data()?.credits ?? 0;
      const newCredits = currentCredits + amount;

      transaction.update(userRef, {
        credits: newCredits,
        lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Registrar transação
      const transactionData: CreditTransaction = {
        tipo: "adicao",
        quantidade: amount,
        motivo,
        createdAt: new Date(),
      };

      const transactionRef = userRef.collection("creditTransactions").doc();
      transaction.set(transactionRef, transactionData);
    });
  } catch (error) {
    console.error("Erro ao adicionar créditos:", error);
    throw error;
  }
}

/**
 * Inicializa créditos para um novo usuário
 * @param {string} userId - ID do usuário
 * @param {number} initialCredits - Quantidade inicial de créditos
 * @return {Promise<void>}
 */
export async function initializeUserCredits(
  userId: string,
  initialCredits = 10
): Promise<void> {
  const userRef = db.collection("users").doc(userId);

  await userRef.update({
    credits: initialCredits,
    lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
  });
}
