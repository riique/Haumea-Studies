'use client'

import { useState } from 'react'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useFixMigration() {
  const { user } = useAuth()
  const [fixing, setFixing] = useState(false)
  const [fixProgress, setFixProgress] = useState<string>('')

  const fixMigratedData = async (): Promise<boolean> => {
    if (!user) {
      setFixProgress('Usuário não autenticado')
      return false
    }

    setFixing(true)
    setFixProgress('Iniciando correção de dados...')

    try {
      // Verificar e corrigir contentPrograms que não têm categoryId
      setFixProgress('Corrigindo conteúdos programáticos...')
      const programsRef = collection(db, 'users', user.uid, 'contentPrograms')
      const programsSnapshot = await getDocs(programsRef)
      
      if (programsSnapshot.docs.length > 0) {
        const batch = writeBatch(db)
        let updated = 0
        
        programsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          // Se não tem categoryId, adicionar como null
          if (!('categoryId' in data)) {
            batch.update(doc(programsRef, docSnap.id), {
              categoryId: null
            })
            updated++
          }
        })
        
        if (updated > 0) {
          await batch.commit()
          setFixProgress(`Corrigidos ${updated} conteúdos programáticos`)
        } else {
          setFixProgress('Nenhum conteúdo necessitava correção')
        }
      }

      setFixProgress('Correção concluída com sucesso!')
      setFixing(false)
      return true
    } catch (error) {
      console.error('Erro durante correção:', error)
      setFixProgress(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setFixing(false)
      return false
    }
  }

  return {
    fixMigratedData,
    fixing,
    fixProgress,
  }
}
