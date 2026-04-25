import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { JournalEntry, JournalEntryInput } from '@/types/journal'

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'journalEntries'),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entriesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            userId: data.userId,
            title: data.title || '',
            content: data.content,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as JournalEntry
        })
        setEntries(entriesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Erro ao buscar entradas do diário:', err)
        setError('Erro ao carregar entradas do diário')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const createEntry = async (input: JournalEntryInput) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const now = Timestamp.now()
      const docRef = await addDoc(collection(db, 'users', user.uid, 'journalEntries'), {
        title: input.title,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } catch (err) {
      console.error('Erro ao criar entrada:', err)
      throw err
    }
  }

  const updateEntry = async (entryId: string, input: JournalEntryInput) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const entryRef = doc(db, 'users', user.uid, 'journalEntries', entryId)
      await updateDoc(entryRef, {
        title: input.title,
        content: input.content,
        updatedAt: Timestamp.now(),
      })
    } catch (err) {
      console.error('Erro ao atualizar entrada:', err)
      throw err
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const entryRef = doc(db, 'users', user.uid, 'journalEntries', entryId)
      await deleteDoc(entryRef)
    } catch (err) {
      console.error('Erro ao deletar entrada:', err)
      throw err
    }
  }

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
