/**
 * Script para limpar o campo dayOfWeek de missões recorrentes existentes
 * Execute este script uma vez para corrigir as missões recorrentes que já foram criadas
 */

import { collection, query, where, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function cleanupRecurringMissions(userId: string) {
    try {
        console.log('Iniciando limpeza de missões recorrentes...')

        const missionsRef = collection(db, 'users', userId, 'missions')
        const q = query(
            missionsRef,
            where('isRecurring', '==', true)
        )

        const snapshot = await getDocs(q)
        let updatedCount = 0

        for (const docSnapshot of snapshot.docs) {
            const missionRef = doc(db, 'users', userId, 'missions', docSnapshot.id)

            // Remove o campo dayOfWeek das missões recorrentes
            await updateDoc(missionRef, {
                dayOfWeek: deleteField()
            })

            updatedCount++
        }

        console.log(`✅ Limpeza concluída! ${updatedCount} missões recorrentes atualizadas.`)
        return { success: true, updatedCount }
    } catch (error) {
        console.error('Erro ao limpar missões recorrentes:', error)
        return { success: false, error }
    }
}
