'use client'

import { useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useMigration() {
  const { user } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState<string>('')

  const migrateDataToNewStructure = async (): Promise<boolean> => {
    if (!user) {
      setMigrationProgress('Usuário não autenticado')
      return false
    }

    setMigrating(true)
    setMigrationProgress('Iniciando migração...')

    try {
      // 1. Migrar missions
      setMigrationProgress('Migrando missões...')
      const missionsSnapshot = await getDocs(
        query(collection(db, 'missions'), where('userId', '==', user.uid))
      )
      
      if (missionsSnapshot.docs.length > 0) {
        const missionsRef = collection(db, 'users', user.uid, 'missions')
        const batch = writeBatch(db)
        
        missionsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(missionsRef)
          // Remove userId from data since it's now in the subcollection
          const { userId, ...missionData } = data
          batch.set(newDocRef, missionData)
        })
        
        await batch.commit()
      }

      // 2. Migrar weeklySchedules
      setMigrationProgress('Migrando agendas semanais...')
      const schedulesSnapshot = await getDocs(
        query(collection(db, 'weeklySchedules'), where('userId', '==', user.uid))
      )
      
      if (schedulesSnapshot.docs.length > 0) {
        const schedulesRef = collection(db, 'users', user.uid, 'weeklySchedules')
        const batch = writeBatch(db)
        
        schedulesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(schedulesRef)
          const { userId, ...scheduleData } = data
          batch.set(newDocRef, scheduleData)
        })
        
        await batch.commit()
      }

      // 3. Migrar contentPrograms
      setMigrationProgress('Migrando conteúdos programáticos...')
      const programsSnapshot = await getDocs(
        query(collection(db, 'contentPrograms'), where('userId', '==', user.uid))
      )
      
      if (programsSnapshot.docs.length > 0) {
        const programsRef = collection(db, 'users', user.uid, 'contentPrograms')
        const batch = writeBatch(db)
        
        programsSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(programsRef)
          const { userId, ...programData } = data
          // Preserve categoryId if it exists
          batch.set(newDocRef, {
            ...programData,
            categoryId: data.categoryId || null
          })
        })
        
        await batch.commit()
      }

      // 4. Migrar contentCategories
      setMigrationProgress('Migrando categorias de conteúdo...')
      const categoriesSnapshot = await getDocs(
        query(collection(db, 'contentCategories'), where('userId', '==', user.uid))
      )
      
      if (categoriesSnapshot.docs.length > 0) {
        const categoriesRef = collection(db, 'users', user.uid, 'contentCategories')
        const batch = writeBatch(db)
        
        categoriesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(categoriesRef)
          const { userId, ...categoryData } = data
          batch.set(newDocRef, categoryData)
        })
        
        await batch.commit()
      }

      // 5. Migrar journalEntries
      setMigrationProgress('Migrando entradas do diário...')
      const entriesSnapshot = await getDocs(
        query(collection(db, 'journalEntries'), where('userId', '==', user.uid))
      )
      
      if (entriesSnapshot.docs.length > 0) {
        const entriesRef = collection(db, 'users', user.uid, 'journalEntries')
        const batch = writeBatch(db)
        
        entriesSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data()
          const newDocRef = doc(entriesRef)
          const { userId, ...entryData } = data
          batch.set(newDocRef, entryData)
        })
        
        await batch.commit()
      }

      setMigrationProgress('Migração concluída com sucesso!')
      setMigrating(false)
      return true
    } catch (error) {
      console.error('Erro durante migração:', error)
      setMigrationProgress(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setMigrating(false)
      return false
    }
  }

  return {
    migrateDataToNewStructure,
    migrating,
    migrationProgress,
  }
}
