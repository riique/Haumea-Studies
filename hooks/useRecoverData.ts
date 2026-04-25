'use client'

import { useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useRecoverData() {
  const { user } = useAuth()
  const [recovering, setRecovering] = useState(false)
  const [recoverProgress, setRecoverProgress] = useState<string>('')

  const recoverDataFromMigration = async (): Promise<boolean> => {
    if (!user) {
      setRecoverProgress('Usuário não autenticado')
      return false
    }

    setRecovering(true)
    setRecoverProgress('Iniciando recuperação de dados...')

    try {
      // 1. Recuperar missions
      setRecoverProgress('Recuperando missões...')
      const missionsRef = collection(db, 'users', user.uid, 'missions')
      const missionsSnapshot = await getDocs(missionsRef)
      
      if (missionsSnapshot.docs.length > 0) {
        const oldMissionsRef = collection(db, 'missions')
        const batch = writeBatch(db)
        
        missionsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(oldMissionsRef)
          batch.set(newDocRef, {
            ...data,
            userId: user.uid
          })
        })
        
        await batch.commit()
      }

      // 2. Recuperar weeklySchedules
      setRecoverProgress('Recuperando agendas semanais...')
      const schedulesRef = collection(db, 'users', user.uid, 'weeklySchedules')
      const schedulesSnapshot = await getDocs(schedulesRef)
      
      if (schedulesSnapshot.docs.length > 0) {
        const oldSchedulesRef = collection(db, 'weeklySchedules')
        const batch = writeBatch(db)
        
        schedulesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(oldSchedulesRef)
          batch.set(newDocRef, {
            ...data,
            userId: user.uid
          })
        })
        
        await batch.commit()
      }

      // 3. Recuperar contentPrograms
      setRecoverProgress('Recuperando conteúdos programáticos...')
      const programsRef = collection(db, 'users', user.uid, 'contentPrograms')
      const programsSnapshot = await getDocs(programsRef)
      
      if (programsSnapshot.docs.length > 0) {
        const oldProgramsRef = collection(db, 'contentPrograms')
        const batch = writeBatch(db)
        
        programsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(oldProgramsRef)
          batch.set(newDocRef, {
            ...data,
            userId: user.uid
          })
        })
        
        await batch.commit()
      }

      // 4. Recuperar contentCategories
      setRecoverProgress('Recuperando categorias de conteúdo...')
      const categoriesRef = collection(db, 'users', user.uid, 'contentCategories')
      const categoriesSnapshot = await getDocs(categoriesRef)
      
      if (categoriesSnapshot.docs.length > 0) {
        const oldCategoriesRef = collection(db, 'contentCategories')
        const batch = writeBatch(db)
        
        categoriesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(oldCategoriesRef)
          batch.set(newDocRef, {
            ...data,
            userId: user.uid
          })
        })
        
        await batch.commit()
      }

      // 5. Recuperar journalEntries
      setRecoverProgress('Recuperando entradas do diário...')
      const entriesRef = collection(db, 'users', user.uid, 'journalEntries')
      const entriesSnapshot = await getDocs(entriesRef)
      
      if (entriesSnapshot.docs.length > 0) {
        const oldEntriesRef = collection(db, 'journalEntries')
        const batch = writeBatch(db)
        
        entriesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(oldEntriesRef)
          batch.set(newDocRef, {
            ...data,
            userId: user.uid
          })
        })
        
        await batch.commit()
      }

      setRecoverProgress('Recuperação concluída com sucesso!')
      setRecovering(false)
      return true
    } catch (error) {
      console.error('Erro durante recuperação:', error)
      setRecoverProgress(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setRecovering(false)
      return false
    }
  }

  return {
    recoverDataFromMigration,
    recovering,
    recoverProgress,
  }
}
