import { auth } from '@/lib/firebase'
import { CorrecaoRequest, CorrecaoResponse } from '@/types/redacao'

const FUNCTION_URL = 'https://us-central1-haumea-studies.cloudfunctions.net/corrigirRedacao'

export async function corrigirRedacaoHTTP(
  request: CorrecaoRequest
): Promise<CorrecaoResponse> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  // Obter token de autenticação
  const token = await user.getIdToken()

  // Fazer requisição HTTP com token no header
  const controller = new AbortController()
  // Timeout de 5 minutos para alinhar com o timeout do axios na função (300s)
  // A função Firebase pode demorar até 9 minutos, então damos margem suficiente
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutos

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
      throw new Error('Tempo limite excedido. A correção está sendo processada em segundo plano.')
    }

    throw error
  }
}
