'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Reading, ReadingStatus, Dossier } from '@/types/reading'

export function useReadings() {
  const { user } = useAuth()
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setReadings([])
      setLoading(false)
      return
    }

    const readingsRef = collection(db, 'mandatoryReadings')
    const q = query(
      readingsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readingsData = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId,
          bookTitle: data.bookTitle,
          institution: data.institution,
          pageCount: data.pageCount,
          currentPage: data.currentPage || 0,
          preSummary: data.preSummary || undefined,
          status: data.status,
          dossier: data.dossier || { finalSummary: '', chapterNotes: [] },
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Reading
      })
      setReadings(readingsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addReading = async (
    bookTitle: string,
    institution: string,
    pageCount: number,
    preSummary?: string
  ) => {
    if (!user) return

    const readingsRef = collection(db, 'mandatoryReadings')
    const readingData: any = {
      userId: user.uid,
      bookTitle: bookTitle.trim(),
      institution: institution.trim(),
      pageCount,
      status: 'nao_lido' as ReadingStatus,
      dossier: {
        finalSummary: '',
        chapterNotes: [],
      },
      createdAt: Timestamp.now(),
    }

    if (preSummary && preSummary.trim()) {
      readingData.preSummary = preSummary.trim()
    }

    await addDoc(readingsRef, readingData)
  }

  const updateReadingStatus = async (readingId: string, status: ReadingStatus) => {
    const readingRef = doc(db, 'mandatoryReadings', readingId)
    await updateDoc(readingRef, { status })
  }

  const updateDossier = async (readingId: string, dossier: Dossier) => {
    const readingRef = doc(db, 'mandatoryReadings', readingId)
    await updateDoc(readingRef, { dossier })
  }

  const updateCurrentPage = async (readingId: string, currentPage: number) => {
    const readingRef = doc(db, 'mandatoryReadings', readingId)
    await updateDoc(readingRef, { currentPage })
  }

  const deleteReading = async (readingId: string) => {
    const readingRef = doc(db, 'mandatoryReadings', readingId)
    await deleteDoc(readingRef)
  }

  return {
    readings,
    loading,
    addReading,
    updateReadingStatus,
    updateCurrentPage,
    updateDossier,
    deleteReading,
  }
}
