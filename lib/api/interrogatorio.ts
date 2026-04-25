import { auth } from '@/lib/firebase'

const BASE = 'https://us-central1-haumea-studies.cloudfunctions.net'
const URL_GERAR = `${BASE}/gerarPerguntasInterrogatorio`
const URL_AVALIAR = `${BASE}/avaliarRespostaInterrogatorio`
const URL_HISTORICO = `${BASE}/buscarHistoricoInterrogatorios`
const URL_SALVAR = `${BASE}/salvarRespostaInterrogatorio`
const URL_DELETAR = `${BASE}/deletarInterrogatorio`
const URL_RENOMEAR = `${BASE}/renomearInterrogatorio`
const URL_EXPLICACAO = `${BASE}/gerarExplicacaoInterrogatorio`
const URL_TRANSCREVER = `${BASE}/transcreverAudioInterrogatorio`
const URL_REVISOES = `${BASE}/buscarRevisoesPendentes`

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface Pergunta {
    id: number
    pergunta: string
    tipo: 'compreensao' | 'aplicacao' | 'analise' | 'sintese' | 'avaliacao'
    tipo_formato: 'dissertativa' | 'multipla_escolha'
    dificuldade: 'facil' | 'media' | 'alta' | 'muito_alta'
    topico: string
    respostaEsperada: string
    alternativas?: Record<string, string> | null
    alternativaCorreta?: string | null
}

export interface ErroEncontrado {
    trecho: string
    erro: string
}

export interface Avaliacao {
    nota: number
    classificacao: 'correta' | 'parcialmente_correta' | 'incorreta' | 'insuficiente'
    pontosCorretos: string[]
    errosEncontrados: ErroEncontrado[]
    oQueFaltou: string[]
    feedbackGeral: string
    dicaParaMelhorar: string
}

export interface AnexoResposta {
    tipo: 'image' | 'pdf'
    base64: string
    filename: string
    mimeType: string
}

export interface PassoExplicacao {
    numero: number
    titulo: string
    conteudo: string
    dica?: string
}

export interface Explicacao {
    resumo: string
    passos: PassoExplicacao[]
    conclusao: string
    conceitosRelacionados: string[]
}

export type ModoInterrogatorio = 'normal' | 'simulado' | 'revisao_erros'
export type TimerConfig = null | 180 | 300 | 600 // null=sem, 3min, 5min, 10min

export const MATERIAS = [
    'Biologia', 'Química', 'Física', 'Matemática',
    'Português', 'Literatura', 'História', 'Geografia',
    'Filosofia', 'Sociologia', 'Inglês', 'Espanhol',
] as const
export type Materia = typeof MATERIAS[number]

export interface InterrogatorioHistorico {
    id: string
    nome?: string | null
    conteudoResumo: string
    conteudo: string
    isPdf: boolean
    pdfFilename: string | null
    pdfBase64: string | null
    perguntas: Pergunta[]
    respostas: string[]
    avaliacoes: Avaliacao[]
    tempos: number[]
    status: 'em_andamento' | 'concluido'
    modo: ModoInterrogatorio
    materia: Materia | null
    timerPorPergunta: TimerConfig
    incluirMultiplaEscolha: boolean
    proximaRevisao: string | null
    intervaloRevisao: number | null
    createdAt: string | null
    updatedAt: string | null
}

export interface RevisaoPendente {
    id: string
    nome: string | null
    conteudoResumo: string
    materia: Materia | null
    perguntas: Pergunta[]
    avaliacoes: Avaliacao[]
    intervaloRevisao: number
    proximaRevisao: string | null
}

// ─── Requests / Responses ───────────────────────────────────────────────────

export interface GerarPerguntasRequest {
    conteudo: string
    numeroPerguntasDesejado: number
    isPdf?: boolean
    pdfBase64?: string
    modo?: ModoInterrogatorio
    incluirMultiplaEscolha?: boolean
    materia?: Materia | null
    timerPorPergunta?: TimerConfig
}

export interface GerarPerguntasResponse {
    success: boolean
    perguntas: Pergunta[]
    interrogatorioId?: string
}

export interface AvaliarRespostaRequest {
    pergunta: Pergunta
    respostaAluno: string
    anexos?: AnexoResposta[]
}

export interface AvaliarRespostaResponse {
    success: boolean
    avaliacao: Avaliacao
}

export interface SalvarRespostaRequest {
    interrogatorioId: string
    perguntaIndex: number
    resposta: string
    avaliacao: Avaliacao
    tempoGasto?: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
    const user = auth.currentUser
    if (!user) throw new Error('Não autenticado')
    return user.getIdToken()
}

async function post<T>(url: string, body: unknown): Promise<T> {
    const token = await getToken()
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.message || err.error || 'Erro na requisição')
    }
    return res.json()
}

async function get<T>(url: string): Promise<T> {
    const token = await getToken()
    const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.message || err.error || 'Erro na requisição')
    }
    return res.json()
}

async function del<T>(url: string): Promise<T> {
    const token = await getToken()
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.message || err.error || 'Erro na requisição')
    }
    return res.json()
}

// ─── API Functions ──────────────────────────────────────────────────────────

export function gerarPerguntasInterrogatorioHTTP(request: GerarPerguntasRequest) {
    return post<GerarPerguntasResponse>(URL_GERAR, request)
}

export function avaliarRespostaInterrogatorioHTTP(request: AvaliarRespostaRequest) {
    return post<AvaliarRespostaResponse>(URL_AVALIAR, request)
}

export function buscarHistoricoInterrogatoriosHTTP(limit = 20) {
    return get<{ success: boolean; interrogatorios: InterrogatorioHistorico[] }>(
        `${URL_HISTORICO}?limit=${limit}`
    )
}

export function salvarRespostaInterrogatorioHTTP(request: SalvarRespostaRequest) {
    return post<{ success: boolean }>(URL_SALVAR, request)
}

export function deletarInterrogatorioHTTP(interrogatorioId: string) {
    return del<{ success: boolean }>(`${URL_DELETAR}?id=${interrogatorioId}`)
}

export function renomearInterrogatorioHTTP(interrogatorioId: string, nome: string) {
    return post<{ success: boolean }>(URL_RENOMEAR, { interrogatorioId, nome })
}

export function gerarExplicacaoInterrogatorioHTTP(pergunta: Pergunta) {
    return post<{ success: boolean; explicacao: Explicacao }>(URL_EXPLICACAO, { pergunta })
}

export function transcreverAudioInterrogatorioHTTP(audioBase64: string, mimeType: string) {
    return post<{ success: boolean; transcricao: string; erro?: string | null }>(
        URL_TRANSCREVER,
        { audioBase64, mimeType }
    )
}

export function buscarRevisoesPendentesHTTP() {
    return get<{ success: boolean; revisoes: RevisaoPendente[] }>(URL_REVISOES)
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export const getTipoLabel = (t: string) => {
    const m: Record<string, string> = { analise: 'Análise', sintese: 'Síntese', avaliacao: 'Avaliação', aplicacao: 'Aplicação', compreensao: 'Compreensão' }
    return m[t] || t
}
export const getDificuldadeColor = (d: string) => {
    const m: Record<string, string> = {
        facil: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
        media: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
        alta: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
        muito_alta: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
    }
    return m[d] || 'text-muted-foreground bg-muted'
}
export const getDificuldadeLabel = (d: string) => {
    const m: Record<string, string> = { facil: 'Fácil', media: 'Média', alta: 'Alta', muito_alta: 'Muito Alta' }
    return m[d] || d
}
export const getNotaColor = (n: number) => n >= 8 ? 'text-emerald-600 dark:text-emerald-400' : n >= 6 ? 'text-amber-600 dark:text-amber-400' : n >= 4 ? 'text-orange-600 dark:text-orange-400' : 'text-rose-600 dark:text-rose-400'
export const getClassificacaoLabel = (c: string) => {
    const m: Record<string, string> = { correta: 'Correta', parcialmente_correta: 'Parcialmente Correta', incorreta: 'Incorreta', insuficiente: 'Insuficiente' }
    return m[c] || c
}
export const calcularMedia = (avs: Avaliacao[]) => {
    const notas = avs.filter(a => a?.nota !== undefined).map(a => a.nota)
    return notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0
}
export const formatTempo = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// ─── File utilities ─────────────────────────────────────────────────────────

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const result = reader.result as string
            const base64 = result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
    })
}

export async function fileToAnexo(file: File): Promise<AnexoResposta> {
    const base64 = await fileToBase64(file)
    return {
        tipo: file.type.startsWith('image/') ? 'image' : 'pdf',
        base64,
        filename: file.name,
        mimeType: file.type,
    }
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export function exportarResultadoPDF(item: InterrogatorioHistorico): void {
    const media = item.avaliacoes.length > 0
        ? item.avaliacoes.reduce((s, a) => s + (a?.nota || 0), 0) / item.avaliacoes.length
        : 0

    // Construir HTML para impressão
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Interrogatório - ${item.nome || item.conteudoResumo.substring(0, 50)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;color:#1a1a1a;padding:40px 60px;font-size:14px;line-height:1.6}
h1{font-size:22px;margin-bottom:4px;letter-spacing:-0.5px}
h2{font-size:16px;margin:28px 0 12px;padding-bottom:6px;border-bottom:1px solid #d0d0d0}
h3{font-size:14px;margin:16px 0 8px}
.meta{color:#666;font-size:12px;margin-bottom:24px}
.media{font-size:28px;font-weight:bold;margin:8px 0}
.pergunta{margin:20px 0;padding:16px;border:1px solid #e0e0e0;page-break-inside:avoid}
.pergunta-num{font-weight:bold;color:#333;font-size:13px;text-transform:uppercase;letter-spacing:0.5px}
.pergunta-text{margin:8px 0;font-size:15px}
.badges{display:flex;gap:8px;margin:8px 0}
.badge{font-size:11px;padding:2px 8px;border:1px solid #ccc;display:inline-block}
.resposta{margin:8px 0;padding:12px;background:#f7f7f7;border-left:3px solid #888}
.nota{font-size:18px;font-weight:bold;float:right}
.nota-alta{color:#16a34a}.nota-media{color:#ca8a04}.nota-baixa{color:#dc2626}
.feedback{margin:8px 0;font-style:italic;color:#555}
.correto{color:#16a34a}.erro{color:#dc2626}.faltou{color:#ca8a04}
.lista{margin:4px 0 4px 16px}
.lista li{margin:2px 0}
.esperada{margin:12px 0;padding:12px;background:#f0fdf4;border-left:3px solid #16a34a}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ccc;text-align:center;color:#999;font-size:11px}
@media print{body{padding:20px 30px}.pergunta{break-inside:avoid}}
</style></head><body>`

    html += `<h1>${item.nome || 'Interrogatório'}</h1>`
    html += `<div class="meta">`
    if (item.materia) html += `${item.materia} · `
    html += `${item.perguntas.length} perguntas · `
    html += item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
    html += `</div>`
    html += `<div class="media ${media >= 7 ? 'nota-alta' : media >= 5 ? 'nota-media' : 'nota-baixa'}">${media.toFixed(1)}/10</div>`

    html += `<h2>Perguntas e Respostas</h2>`

    item.perguntas.forEach((p, i) => {
        const resp = item.respostas[i]
        const av = item.avaliacoes[i]
        const tempo = item.tempos?.[i]

        html += `<div class="pergunta">`
        html += `<div class="pergunta-num">Pergunta ${i + 1}`
        if (av) {
            const cls = av.nota >= 7 ? 'nota-alta' : av.nota >= 5 ? 'nota-media' : 'nota-baixa'
            html += `<span class="nota ${cls}">${av.nota.toFixed(1)}</span>`
        }
        html += `</div>`
        html += `<div class="badges">`
        html += `<span class="badge">${p.tipo}</span>`
        html += `<span class="badge">${p.dificuldade}</span>`
        html += `<span class="badge">${p.tipo_formato === 'multipla_escolha' ? 'Múltipla Escolha' : 'Dissertativa'}</span>`
        if (tempo) html += `<span class="badge">${Math.floor(tempo / 60)}m${tempo % 60}s</span>`
        html += `</div>`
        html += `<div class="pergunta-text">${p.pergunta}</div>`

        if (p.tipo_formato === 'multipla_escolha' && p.alternativas) {
            html += `<div style="margin:8px 0">`
            Object.entries(p.alternativas).forEach(([letra, texto]) => {
                const isCorreta = letra === p.alternativaCorreta
                html += `<div style="margin:2px 0;${isCorreta ? 'font-weight:bold;color:#16a34a' : ''}">${letra}) ${texto}</div>`
            })
            html += `</div>`
        }

        if (resp) {
            html += `<div class="resposta"><strong>Sua resposta:</strong> ${resp}</div>`
        }

        if (av) {
            html += `<div class="feedback">${av.feedbackGeral}</div>`
            if (av.pontosCorretos.length) {
                html += `<h3 class="correto">✓ Pontos Corretos</h3><ul class="lista">`
                av.pontosCorretos.forEach(p => { html += `<li>${p}</li>` })
                html += `</ul>`
            }
            if (av.errosEncontrados.length) {
                html += `<h3 class="erro">✗ Erros</h3><ul class="lista">`
                av.errosEncontrados.forEach(e => { html += `<li>"${e.trecho}" — ${e.erro}</li>` })
                html += `</ul>`
            }
            if (av.oQueFaltou.length) {
                html += `<h3 class="faltou">⚠ O que faltou</h3><ul class="lista">`
                av.oQueFaltou.forEach(f => { html += `<li>${f}</li>` })
                html += `</ul>`
            }
        }

        html += `<div class="esperada"><strong>Resposta esperada:</strong> ${p.respostaEsperada}</div>`
        html += `</div>`
    })

    html += `<div class="footer">Haumea Studies — Interrogatório</div>`
    html += `</body></html>`

    const w = window.open('', '_blank')
    if (w) {
        w.document.write(html)
        w.document.close()
        setTimeout(() => w.print(), 500)
    }
}
