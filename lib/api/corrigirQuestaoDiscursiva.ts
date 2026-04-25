import { auth } from '@/lib/firebase'

const FUNCTION_URL = 'https://us-central1-haumea-studies.cloudfunctions.net/corrigirQuestaoDiscursiva'

export interface CorrecaoDiscursivaRequest {
    enunciado: string
    resposta: string
}

export interface CriterioAvaliacao {
    nota: number
    justificativa: string
}

export interface FalhaEncontrada {
    trecho: string
    problema: string
}

export interface SugestaoMelhoria {
    area: string
    sugestao: string
}

export interface CorrecaoDiscursivaResponse {
    success: boolean
    tipoQuestao: 'direta' | 'explicativa'
    notaFinal: number
    criterios: {
        adequacaoAoComando: CriterioAvaliacao
        correcaoConceitual: CriterioAvaliacao
        profundidadeExplicativa: CriterioAvaliacao
        clarezaLinguistica: CriterioAvaliacao
    }
    classificacaoEstrutural: 'fora_do_escopo' | 'parcialmente_adequada' | 'estruturalmente_adequada'
    justificativaEstrutural: string
    falhasEncontradas: FalhaEncontrada[]
    oQueFaltouParaNotaMaxima: string[]
    sugestoesDeMelhoria: SugestaoMelhoria[]
    veredito: string
    usandoApiKeySistema?: boolean
}

export async function corrigirQuestaoDiscursivaHTTP(
    request: CorrecaoDiscursivaRequest
): Promise<CorrecaoDiscursivaResponse> {
    const user = auth.currentUser

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    // Obter token de autenticação
    const token = await user.getIdToken()

    // Fazer requisição HTTP com token no header
    const controller = new AbortController()
    // Timeout de 2 minutos
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Erro ao processar correção')
        }

        const data = await response.json()
        return data
    } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Tempo limite excedido. A correção está demorando muito.')
        }

        throw error
    }
}
