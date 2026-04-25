'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Exam } from '@/types/exam'

export function useExams() {
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setExams([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'exams'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init')
        .map(doc => {
          const docData = doc.data()
          return {
            id: doc.id,
            name: docData.name,
            day1: docData.day1 ? {
              date: docData.day1.date?.toDate() || new Date(),
              completed: docData.day1.completed || false
            } : undefined,
            day2: docData.day2 ? {
              date: docData.day2.date?.toDate() || new Date(),
              completed: docData.day2.completed || false
            } : undefined,
            createdAt: docData.createdAt?.toDate() || new Date()
          } as Exam
        })
      
      setExams(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addExam = async (name: string, day1Date?: Date, day2Date?: Date) => {
    if (!user) return

    try {
      const examData: any = {
        name,
        createdAt: Timestamp.now()
      }

      if (day1Date) {
        examData.day1 = {
          date: Timestamp.fromDate(day1Date),
          completed: false
        }
      }

      if (day2Date) {
        examData.day2 = {
          date: Timestamp.fromDate(day2Date),
          completed: false
        }
      }

      await addDoc(collection(db, 'users', user.uid, 'exams'), examData)
    } catch (error) {
      console.error('Erro ao adicionar vestibular:', error)
      throw error
    }
  }

  const deleteExam = async (examId: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'exams', examId))
    } catch (error) {
      console.error('Erro ao deletar vestibular:', error)
      throw error
    }
  }

  return { exams, loading, addExam, deleteExam }
}
