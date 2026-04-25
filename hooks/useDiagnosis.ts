'use client'

import { useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface DiagnosisResult {
  oldCollections: {
    missions: number
    weeklySchedules: number
    contentPrograms: number
    contentCategories: number
    journalEntries: number
  }
  newSubcollections: {
    missions: number
    weeklySchedules: number
    contentPrograms: number
    contentCategories: number
    journalEntries: number
  }
}

export function useDiagnosis() {
  const { user } = useAuth()
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)

  const runDiagnosis = async (): Promise<DiagnosisResult | null> => {
    if (!user) {
      console.error('Usuário não autenticado')
      return null
    }

    setDiagnosing(true)

    try {
      // Check old collections
      const oldMissions = await getDocs(
        query(collection(db, 'missions'), where('userId', '==', user.uid))
      )
      const oldSchedules = await getDocs(
        query(collection(db, 'weeklySchedules'), where('userId', '==', user.uid))
      )
      const oldPrograms = await getDocs(
        query(collection(db, 'contentPrograms'), where('userId', '==', user.uid))
      )
      const oldCategories = await getDocs(
        query(collection(db, 'contentCategories'), where('userId', '==', user.uid))
      )
      const oldEntries = await getDocs(
        query(collection(db, 'journalEntries'), where('userId', '==', user.uid))
      )

      // Check new subcollections
      const newMissions = await getDocs(collection(db, 'users', user.uid, 'missions'))
      const newSchedules = await getDocs(collection(db, 'users', user.uid, 'weeklySchedules'))
      const newPrograms = await getDocs(collection(db, 'users', user.uid, 'contentPrograms'))
      const newCategories = await getDocs(collection(db, 'users', user.uid, 'contentCategories'))
      const newEntries = await getDocs(collection(db, 'users', user.uid, 'journalEntries'))

      const result: DiagnosisResult = {
        oldCollections: {
          missions: oldMissions.size,
          weeklySchedules: oldSchedules.size,
          contentPrograms: oldPrograms.size,
          contentCategories: oldCategories.size,
          journalEntries: oldEntries.size,
        },
        newSubcollections: {
          missions: newMissions.size,
          weeklySchedules: newSchedules.size,
          contentPrograms: newPrograms.size,
          contentCategories: newCategories.size,
          journalEntries: newEntries.size,
        }
      }

      setDiagnosisResult(result)
      console.log('Diagnosis Result:', result)
      setDiagnosing(false)
      return result
    } catch (error) {
      console.error('Erro durante diagnóstico:', error)
      setDiagnosing(false)
      return null
    }
  }

  return {
    runDiagnosis,
    diagnosing,
    diagnosisResult,
  }
}
