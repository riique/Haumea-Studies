/**
 * useMathHistory — Persistência de sessões de treino no Firestore
 * Salva: data, tópicos, acertos, tempo, erros específicos
 * Lê: histórico, estatísticas por tópico, evolução temporal
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    deleteDoc,
    Timestamp,
    where,
} from 'firebase/firestore'
import { TopicType } from '@/lib/math-generators'

// Resultado individual de uma questão
export interface QuestionResult {
    topic: TopicType
    question: string
    correctAnswer: string
    userAnswer: string
    isCorrect: boolean
    usedHint: boolean
    timeSpent: number // segundos
}

// Sessão completa de treino
export interface MathSession {
    id?: string
    date: Date
    mode: 'standard' | 'timed' | 'adaptive' | 'infinite'
    totalQuestions: number
    correctAnswers: number
    totalTime: number // segundos
    results: QuestionResult[]
    topicStats: TopicStat[]
}

export interface TopicStat {
    topic: TopicType
    total: number
    correct: number
    avgTime: number
}

// Estatísticas globais de um tópico
export interface TopicProgress {
    topic: TopicType
    totalAttempts: number
    totalCorrect: number
    accuracy: number // 0-100
    avgTime: number
    lastPracticed: Date | null
    level: 'iniciante' | 'intermediario' | 'avancado' | 'mestre'
}

// Questão do caderno de erros
export interface ErrorEntry {
    id?: string
    sessionId: string
    date: Date
    topic: TopicType
    question: string
    correctAnswer: string
    userAnswer: string
}

function computeLevel(accuracy: number, attempts: number): TopicProgress['level'] {
    if (attempts < 5) return 'iniciante'
    if (accuracy >= 90 && attempts >= 20) return 'mestre'
    if (accuracy >= 70) return 'avancado'
    if (accuracy >= 50) return 'intermediario'
    return 'iniciante'
}

export function useMathHistory() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState<MathSession[]>([])
    const [errors, setErrors] = useState<ErrorEntry[]>([])
    const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([])
    const [loading, setLoading] = useState(true)

    const colPath = user ? `users/${user.uid}/math_sessions` : null
    const errorsColPath = user ? `users/${user.uid}/math_errors` : null

    // Carregar histórico
    const loadHistory = useCallback(async () => {
        if (!colPath || !errorsColPath) return
        setLoading(true)

        try {
            // Sessões (últimas 50)
            const sessionsRef = collection(db, colPath)
            const q = query(sessionsRef, orderBy('date', 'desc'), limit(50))
            const snap = await getDocs(q)
            const loaded: MathSession[] = snap.docs.map(d => {
                const data = d.data()
                return {
                    id: d.id,
                    date: (data.date as Timestamp).toDate(),
                    mode: data.mode,
                    totalQuestions: data.totalQuestions,
                    correctAnswers: data.correctAnswers,
                    totalTime: data.totalTime,
                    results: data.results || [],
                    topicStats: data.topicStats || [],
                }
            })
            setSessions(loaded)

            // Caderno de erros (últimos 100)
            const errorsRef = collection(db, errorsColPath)
            const qErr = query(errorsRef, orderBy('date', 'desc'), limit(100))
            const errSnap = await getDocs(qErr)
            const loadedErrors: ErrorEntry[] = errSnap.docs.map(d => {
                const data = d.data()
                return {
                    id: d.id,
                    sessionId: data.sessionId,
                    date: (data.date as Timestamp).toDate(),
                    topic: data.topic,
                    question: data.question,
                    correctAnswer: data.correctAnswer,
                    userAnswer: data.userAnswer,
                }
            })
            setErrors(loadedErrors)

            // Computar progresso por tópico
            computeProgress(loaded)
        } catch (err) {
            console.error('Erro ao carregar histórico math:', err)
        } finally {
            setLoading(false)
        }
    }, [colPath, errorsColPath])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    // Computar progresso por tópico a partir das sessões
    function computeProgress(allSessions: MathSession[]) {
        const map = new Map<TopicType, { total: number; correct: number; totalTime: number; lastDate: Date | null }>()

        for (const session of allSessions) {
            for (const r of session.results) {
                const existing = map.get(r.topic) || { total: 0, correct: 0, totalTime: 0, lastDate: null }
                existing.total++
                if (r.isCorrect) existing.correct++
                existing.totalTime += r.timeSpent
                if (!existing.lastDate || session.date > existing.lastDate) {
                    existing.lastDate = session.date
                }
                map.set(r.topic, existing)
            }
        }

        const progress: TopicProgress[] = Array.from(map.entries()).map(([topic, data]) => {
            const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
            return {
                topic,
                totalAttempts: data.total,
                totalCorrect: data.correct,
                accuracy,
                avgTime: data.total > 0 ? Math.round(data.totalTime / data.total) : 0,
                lastPracticed: data.lastDate,
                level: computeLevel(accuracy, data.total),
            }
        })

        setTopicProgress(progress)
    }

    // Salvar uma sessão
    async function saveSession(session: Omit<MathSession, 'id' | 'date'>): Promise<string | null> {
        if (!colPath || !errorsColPath) return null

        try {
            const sessionData = {
                ...session,
                date: Timestamp.now(),
            }

            const docRef = await addDoc(collection(db, colPath), sessionData)

            // Salvar erros no caderno
            const errosToSave = session.results.filter(r => !r.isCorrect)
            for (const err of errosToSave) {
                await addDoc(collection(db, errorsColPath), {
                    sessionId: docRef.id,
                    date: Timestamp.now(),
                    topic: err.topic,
                    question: err.question,
                    correctAnswer: err.correctAnswer,
                    userAnswer: err.userAnswer,
                })
            }

            // Refresh
            await loadHistory()
            return docRef.id
        } catch (err) {
            console.error('Erro ao salvar sessão:', err)
            return null
        }
    }

    // Remover erro do caderno (já re-estudado)
    async function removeError(errorId: string) {
        if (!errorsColPath) return
        try {
            await deleteDoc(doc(db, errorsColPath, errorId))
            setErrors(prev => prev.filter(e => e.id !== errorId))
        } catch (err) {
            console.error('Erro ao remover do caderno:', err)
        }
    }

    // Buscar erros por tópico
    function getErrorsByTopic(topic: TopicType): ErrorEntry[] {
        return errors.filter(e => e.topic === topic)
    }

    // Buscar progresso de um tópico
    function getTopicProgress(topic: TopicType): TopicProgress | null {
        return topicProgress.find(p => p.topic === topic) || null
    }

    // Últimas N sessões
    function getRecentSessions(n: number): MathSession[] {
        return sessions.slice(0, n)
    }

    // Tópicos mais fracos (menor accuracy com >3 tentativas)
    function getWeakTopics(n: number = 3): TopicProgress[] {
        return topicProgress
            .filter(p => p.totalAttempts >= 3)
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, n)
    }

    // Streak total (sessões consecutivas com >70% acerto)
    function getCurrentStreak(): number {
        let streak = 0
        for (const s of sessions) {
            const acc = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0
            if (acc >= 70) streak++
            else break
        }
        return streak
    }

    return {
        sessions,
        errors,
        topicProgress,
        loading,
        saveSession,
        removeError,
        getErrorsByTopic,
        getTopicProgress,
        getRecentSessions,
        getWeakTopics,
        getCurrentStreak,
        reload: loadHistory,
    }
}
