
import { auth } from '@/lib/firebase'

const FUNCTION_URL = 'https://us-central1-haumea-studies.cloudfunctions.net/gerarExplicacaoQuestao'
const TRANSCRICAO_FUNCTION_URL = 'https://us-central1-haumea-studies.cloudfunctions.net/transcreverQuestao'

export interface TranscricaoResult {
  titulo: string
  materia: string
  assunto: string
  enunciado: string
  alternativas: string[]
  respostaCorreta: string
}

export async function generateExplanation(
  enunciado: string,
  imageUrl: string | null,
  _apiKey?: string,
  _model?: string
): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Usuário não autenticado. Por favor, faça login novamente.')
  }

  const token = await user.getIdToken()

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        enunciado,
        imageUrl
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || 'Erro ao gerar explicação')
    }

    const data = await response.json()
    return data.explicacao
  } catch (error: any) {
    console.error('Erro na chamada da Function:', error)
    throw error
  }
}

export async function transcribeQuestion(
  imageBase64: string
): Promise<TranscricaoResult> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Usuario nao autenticado. Por favor, faca login novamente.')
  }

  const token = await user.getIdToken()

  try {
    const response = await fetch(TRANSCRICAO_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageBase64
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || 'Erro ao transcrever questao')
    }

    const data = await response.json()
    return data.transcricao
  } catch (error: any) {
    console.error('Erro na chamada da Function de transcricao:', error)
    throw error
  }
}
