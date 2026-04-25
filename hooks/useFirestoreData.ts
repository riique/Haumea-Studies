'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

// Tipos
export interface Questao {
  id: string
  titulo?: string
  materia: string
  assunto: string
  tipo: 'objetiva' | 'discursiva' | 'somatoria'
  enunciado: string
  respostaCorreta: string
  alternativas?: string[]
  imagemUrl?: string
  resolucao?: string
  videoUrl?: string
  anotacoes?: string
  respondida: boolean
  acertou?: boolean
  paraRevisar?: boolean
  data: Date
}

export interface Redacao {
  id: string
  titulo: string
  banca: string
  tema: string
  nota: number
  competencias?: {
    c1?: number
    c2?: number
    c3?: number
    c4?: number
    c5?: number
  }
  conteudo: string
  anotacoes?: string
  data: Date
}

export interface Simulado {
  id: string
  tipo: string
  nome: string
  dia1?: {
    linguagens: number
    humanas: number
  }
  dia2?: {
    natureza: number
    matematica: number
  }
  redacao?: number
  anotacoes?: string
  data: Date
}

export interface Categoria {
  id: string
  nome: string
  cor?: string
  parentId?: string
  ordem: number
  data: Date
}

export interface Materia {
  id: string
  nome: string
  cor?: string
  categoriaId?: string
  ordem: number
  data: Date
}

// Hook para questões
export function useQuestoes() {
  const { user } = useAuth()
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setQuestoes([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'questoes'),
      orderBy('data', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init') // Ignora documento de inicialização
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data?.toDate() || new Date()
        })) as Questao[]
      
      setQuestoes(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { questoes, loading }
}

// Hook para redações
export function useRedacoes() {
  const { user } = useAuth()
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRedacoes([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'redacoes'),
      orderBy('data', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data?.toDate() || new Date()
        })) as Redacao[]
      
      setRedacoes(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { redacoes, loading }
}

// Hook para simulados
export function useSimulados() {
  const { user } = useAuth()
  const [simulados, setSimulados] = useState<Simulado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSimulados([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'simulados'),
      orderBy('data', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data?.toDate() || new Date()
        })) as Simulado[]
      
      setSimulados(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { simulados, loading }
}

// Hook para matérias
export function useMaterias() {
  const { user } = useAuth()
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setMaterias([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'materias'),
      orderBy('ordem', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data?.toDate() || new Date()
        })) as Materia[]
      
      setMaterias(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { materias, loading }
}

// Hook para categorias
export function useCategorias() {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCategorias([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'categorias'),
      orderBy('ordem', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .filter(doc => doc.id !== '_init')
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data?.toDate() || new Date()
        })) as Categoria[]
      
      setCategorias(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { categorias, loading }
}
