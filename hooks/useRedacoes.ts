/**
 * Hook para gerenciar redações do usuário
 */

import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { CorrecaoRedacao } from '@/types/redacao'

export function useRedacoes() {
  const { user } = useAuth()
  const [redacoes, setRedacoes] = useState<CorrecaoRedacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRedacoes([])
      setLoading(false)
      return
    }

    const redacoesRef = collection(db, 'users', user.uid, 'redacoes')
    const q = query(redacoesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const redacoesData: CorrecaoRedacao[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          // Filtrar documento de inicialização
          if (doc.id !== '_init') {
            redacoesData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as CorrecaoRedacao)
          }
        })

        setRedacoes(redacoesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Erro ao carregar redações:', err)
        setError('Erro ao carregar redações')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  return { redacoes, loading, error }
}
