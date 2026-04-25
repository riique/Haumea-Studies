/**
 * Math Tutor API - Firebase Function Integration
 * Análise de resoluções via imagem usando Cloud Functions
 */

import { auth } from '@/lib/firebase'
import { MathQuestion } from './math-generators'

export interface TutorAnalysisRequest {
    question: MathQuestion
    imageBase64: string // Foto do caderno com a resolução
    studentAnswer?: string // Resposta digitada pelo aluno (opcional)
}

export interface TutorAnalysisResponse {
    success: boolean
    isCorrect: boolean
    feedback: string // Markdown com feedback detalhado
    errors: string[] // Lista de erros encontrados
    suggestions: string[] // Sugestões de melhoria
    correctSolution?: string // Solução correta em LaTeX (se errado)
}

const FUNCTION_URL = 'https://us-central1-haumea-studies.cloudfunctions.net/analisarResolucaoMath'

export async function analyzeSolution(request: TutorAnalysisRequest): Promise<TutorAnalysisResponse> {
    const user = auth.currentUser

    if (!user) {
        return {
            success: false,
            isCorrect: false,
            feedback: '**Você precisa estar autenticado para usar o Tutor de IA.** Faça login e tente novamente.',
            errors: ['Usuário não autenticado'],
            suggestions: ['Faça login na plataforma']
        }
    }

    try {
        const token = await user.getIdToken()

        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                question: {
                    question: request.question.question,
                    answer: request.question.answer,
                    answerDisplay: request.question.answerDisplay,
                    topic: request.question.topic,
                    hint: request.question.hint
                },
                imageBase64: request.imageBase64,
                studentAnswer: request.studentAnswer
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || errorData.message || `Erro HTTP: ${response.status}`)
        }

        const data = await response.json()

        return {
            success: data.success ?? true,
            isCorrect: data.isCorrect ?? false,
            feedback: data.feedback || 'Análise realizada.',
            errors: data.errors || [],
            suggestions: data.suggestions || [],
            correctSolution: data.correctSolution
        }

    } catch (error: unknown) {
        console.error('Erro ao analisar solução:', error)
        const message = error instanceof Error ? error.message : 'Erro desconhecido'

        return {
            success: false,
            isCorrect: false,
            feedback: `**Erro ao analisar sua resolução:** ${message}\n\nTente novamente em alguns instantes. Se o problema persistir, verifique sua conexão ou entre em contato com o suporte.`,
            errors: [message],
            suggestions: [
                'Verifique sua conexão com a internet',
                'Tente novamente em alguns segundos',
                'Verifique se sua API Key está configurada no Perfil'
            ]
        }
    }
}

// Helper para converter arquivo para base64
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

// Helper para ler imagem da área de transferência
export async function getClipboardImage(): Promise<string | null> {
    try {
        const items = await navigator.clipboard.read()
        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    const blob = await item.getType(type)
                    return fileToBase64(new File([blob], 'clipboard.png', { type }))
                }
            }
        }
        return null
    } catch {
        return null
    }
}
