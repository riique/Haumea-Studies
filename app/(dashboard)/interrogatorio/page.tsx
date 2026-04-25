'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Sparkles, FileText, Loader2, Upload, Mic, MicOff, Send, ChevronRight,
    RefreshCw, Image, Paperclip, X, Pencil, History, Clock, Trash2,
    Download, Zap, RotateCcw, ListChecks, ArrowRight, Check, Target,
    Eye, Timer, Tag, ChevronDown, ChevronUp, Brain, Star, Edit3, BookOpen,
    ExternalLink
} from 'lucide-react'
import { PageLayout } from '@/components/PageLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
    Pergunta, Avaliacao, AnexoResposta, InterrogatorioHistorico, Explicacao,
    RevisaoPendente, ModoInterrogatorio, TimerConfig, Materia,
    GerarPerguntasRequest, AvaliarRespostaRequest,
    gerarPerguntasInterrogatorioHTTP, avaliarRespostaInterrogatorioHTTP,
    buscarHistoricoInterrogatoriosHTTP, salvarRespostaInterrogatorioHTTP,
    deletarInterrogatorioHTTP, renomearInterrogatorioHTTP,
    gerarExplicacaoInterrogatorioHTTP, transcreverAudioInterrogatorioHTTP,
    buscarRevisoesPendentesHTTP, exportarResultadoPDF,
    fileToBase64, fileToAnexo, calcularMedia, formatTempo, getNotaColor,
    getDificuldadeLabel, getDificuldadeColor, getTipoLabel,
} from '@/lib/api/interrogatorio'
import {
    ErrorModal, DeleteModal, TimerDisplay, MateriaSelector, ModoSelector,
    TimerSelector, PerguntaCard, MultiplaEscolhaInput, AvaliacaoDisplay,
    ExplicacaoDisplay, DashboardStats, RevisoesPendentesCard, HistoricoItem,
} from './components'

type State = 'input' | 'loading' | 'questions' | 'answering' | 'evaluating' |
    'result' | 'historico' | 'historico_detalhe' | 'simulado'

export default function InterrogatorioPage() {
    const { user } = useAuth()

    // ─── State ──────────────────────────────────────────────────────────
    const [state, setState] = useState<State>('input')
    const [error, setError] = useState<string | null>(null)

    // Input
    const [conteudo, setConteudo] = useState('')
    const [numPerguntas, setNumPerguntas] = useState(5)
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [pdfBase64, setPdfBase64] = useState<string | null>(null)
    const [modo, setModo] = useState<ModoInterrogatorio>('normal')
    const [incluirMC, setIncluirMC] = useState(false)
    const [materia, setMateria] = useState<Materia | null>(null)
    const [timerConfig, setTimerConfig] = useState<TimerConfig>(null)

    // Perguntas & Respostas
    const [perguntas, setPerguntas] = useState<Pergunta[]>([])
    const [interrogatorioId, setInterrogatorioId] = useState<string | null>(null)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [resposta, setResposta] = useState('')
    const [selectedAlt, setSelectedAlt] = useState<string | null>(null)
    const [mcAdendo, setMcAdendo] = useState('')
    const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
    const [anexos, setAnexos] = useState<AnexoResposta[]>([])
    const [todasRespostas, setTodasRespostas] = useState<string[]>([])
    const [todasAvaliacoes, setTodasAvaliacoes] = useState<(Avaliacao | null)[]>([])
    const [todosTempos, setTodosTempos] = useState<number[]>([])

    // Timer
    const [timerSegundos, setTimerSegundos] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Simulado
    const [simRespostas, setSimRespostas] = useState<string[]>([])
    const [simAlts, setSimAlts] = useState<(string | null)[]>([])
    const [simAdendos, setSimAdendos] = useState<string[]>([])
    const [simFocusIdx, setSimFocusIdx] = useState(0)
    const [simTimerTotal, setSimTimerTotal] = useState(0)
    const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Audio
    const [recording, setRecording] = useState(false)
    const [transcribing, setTranscribing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // Explicação
    const [explicacao, setExplicacao] = useState<Explicacao | null>(null)
    const [loadingExplicacao, setLoadingExplicacao] = useState(false)

    // Histórico
    const [historico, setHistorico] = useState<InterrogatorioHistorico[]>([])
    const [loadingHistorico, setLoadingHistorico] = useState(false)
    const [historicoDetalhe, setHistoricoDetalhe] = useState<InterrogatorioHistorico | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<InterrogatorioHistorico | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [editandoNome, setEditandoNome] = useState<string | null>(null)
    const [novoNome, setNovoNome] = useState('')
    const [revisoes, setRevisoes] = useState<RevisaoPendente[]>([])

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const anexoInputRef = useRef<HTMLInputElement>(null)

    // ─── Timer Logic ────────────────────────────────────────────────────

    const startTimer = useCallback(() => {
        setTimerSegundos(0)
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => setTimerSegundos(s => s + 1), 1000)
    }, [])

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    const startSimTimer = useCallback(() => {
        setSimTimerTotal(0)
        if (simTimerRef.current) clearInterval(simTimerRef.current)
        simTimerRef.current = setInterval(() => setSimTimerTotal(s => s + 1), 1000)
    }, [])

    const stopSimTimer = useCallback(() => {
        if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null }
    }, [])

    useEffect(() => () => { stopTimer(); stopSimTimer() }, [stopTimer, stopSimTimer])

    // Auto-submit on timer expiry
    useEffect(() => {
        if (timerConfig && timerSegundos >= timerConfig && state === 'answering') {
            handleSubmitResposta()
        }
    }, [timerSegundos, timerConfig, state])

    // ─── Audio ──────────────────────────────────────────────────────────

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            audioChunksRef.current = []
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                // Transcrever via OpenRouter
                setTranscribing(true)
                try {
                    const reader = new FileReader()
                    reader.readAsDataURL(blob)
                    reader.onload = async () => {
                        const base64 = (reader.result as string).split(',')[1]
                        try {
                            const result = await transcreverAudioInterrogatorioHTTP(base64, 'audio/webm')
                            if (result.transcricao) {
                                setResposta(prev => prev ? prev + ' ' + result.transcricao : result.transcricao)
                            } else if (result.erro) {
                                setError(`Transcrição falhou: ${result.erro}`)
                            }
                        } catch (err: unknown) {
                            setError(err instanceof Error ? err.message : 'Erro na transcrição')
                        } finally {
                            setTranscribing(false)
                        }
                    }
                } catch {
                    setTranscribing(false)
                    setError('Erro ao processar áudio')
                }
            }
            recorder.start(200)
            mediaRecorderRef.current = recorder
            setRecording(true)
        } catch {
            setError('Permissão de microfone negada')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop()
            setRecording(false)
        }
    }

    // ─── PDF handling ───────────────────────────────────────────────────

    const handlePdfUpload = async (file: File) => {
        if (file.type !== 'application/pdf') { setError('Apenas PDFs'); return }
        if (file.size > 10 * 1024 * 1024) { setError('Max 10MB'); return }
        setPdfFile(file)
        const base64 = await fileToBase64(file)
        setPdfBase64(base64)
    }

    const handleAnexoUpload = async (files: FileList) => {
        if (anexos.length + files.length > 5) { setError('Máximo 5 anexos'); return }
        const novos: AnexoResposta[] = []
        for (let i = 0; i < files.length; i++) {
            const f = files[i]
            if (!f.type.startsWith('image/') && f.type !== 'application/pdf') continue
            novos.push(await fileToAnexo(f))
        }
        setAnexos(prev => [...prev, ...novos])
    }

    // ─── Core Actions ───────────────────────────────────────────────────

    const handleGerar = async () => {
        if (!conteudo.trim() && !pdfBase64) { setError('Insira conteúdo ou PDF'); return }
        setState('loading')
        try {
            const request: GerarPerguntasRequest = {
                conteudo: conteudo.trim(),
                numeroPerguntasDesejado: numPerguntas,
                isPdf: !!pdfFile,
                pdfBase64: pdfBase64 || undefined,
                modo,
                incluirMultiplaEscolha: incluirMC,
                materia,
                timerPorPergunta: timerConfig,
            }
            const result = await gerarPerguntasInterrogatorioHTTP(request)
            setPerguntas(result.perguntas)
            setInterrogatorioId(result.interrogatorioId || null)
            setCurrentIdx(0)
            setTodasRespostas(new Array(result.perguntas.length).fill(''))
            setTodasAvaliacoes(new Array(result.perguntas.length).fill(null))
            setTodosTempos(new Array(result.perguntas.length).fill(0))

            if (modo === 'simulado') {
                setSimRespostas(new Array(result.perguntas.length).fill(''))
                setSimAlts(new Array(result.perguntas.length).fill(null))
                setSimAdendos(new Array(result.perguntas.length).fill(''))
                setSimFocusIdx(0)
                setState('simulado')
                startSimTimer()
            } else {
                setState('questions')
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar perguntas')
            setState('input')
        }
    }

    const handleStartAnswer = (idx: number) => {
        setCurrentIdx(idx)
        setResposta(todasRespostas[idx] || '')
        setSelectedAlt(null)
        setMcAdendo('')
        setAvaliacao(null)
        setAnexos([])
        setExplicacao(null)
        setState('answering')
        startTimer()
    }

    const handleSubmitResposta = async () => {
        stopTimer()
        const p = perguntas[currentIdx]
        let respostaFinal = resposta.trim()
        if (p.tipo_formato === 'multipla_escolha' && selectedAlt) {
            respostaFinal = `Alternativa ${selectedAlt}: ${p.alternativas?.[selectedAlt] || ''}`
            if (mcAdendo.trim()) respostaFinal += `\n\nJustificativa do aluno: ${mcAdendo.trim()}`
        }
        if (!respostaFinal) { setError('Resposta vazia'); startTimer(); return }

        setState('evaluating')
        try {
            const result = await avaliarRespostaInterrogatorioHTTP({ pergunta: p, respostaAluno: respostaFinal, anexos })
            setAvaliacao(result.avaliacao)

            const newRespostas = [...todasRespostas]; newRespostas[currentIdx] = respostaFinal; setTodasRespostas(newRespostas)
            const newAvaliacoes = [...todasAvaliacoes]; newAvaliacoes[currentIdx] = result.avaliacao; setTodasAvaliacoes(newAvaliacoes)
            const newTempos = [...todosTempos]; newTempos[currentIdx] = timerSegundos; setTodosTempos(newTempos)

            // Salvar no backend
            if (interrogatorioId) {
                await salvarRespostaInterrogatorioHTTP({
                    interrogatorioId, perguntaIndex: currentIdx,
                    resposta: respostaFinal, avaliacao: result.avaliacao,
                    tempoGasto: timerSegundos,
                })
            }
            setState('result')
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao avaliar')
            setState('answering')
            startTimer()
        }
    }

    const handleProxima = () => {
        if (currentIdx < perguntas.length - 1) {
            handleStartAnswer(currentIdx + 1)
        } else {
            setState('questions')
        }
    }

    const handleRefazer = () => {
        setResposta('')
        setSelectedAlt(null)
        setAvaliacao(null)
        setAnexos([])
        setExplicacao(null)
        setState('answering')
        startTimer()
    }

    const handleExplicacao = async () => {
        setLoadingExplicacao(true)
        try {
            const result = await gerarExplicacaoInterrogatorioHTTP(perguntas[currentIdx])
            setExplicacao(result.explicacao)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao gerar explicação')
        } finally {
            setLoadingExplicacao(false)
        }
    }

    // ─── Simulado ───────────────────────────────────────────────────────

    const handleSimSubmitAll = async () => {
        stopSimTimer()
        setState('evaluating')
        const avaliacoesNovas: (Avaliacao | null)[] = []
        const respostasFinais: string[] = []

        for (let i = 0; i < perguntas.length; i++) {
            const p = perguntas[i]
            let resp = simRespostas[i]?.trim() || ''
            if (p.tipo_formato === 'multipla_escolha' && simAlts[i]) {
                resp = `Alternativa ${simAlts[i]}: ${p.alternativas?.[simAlts[i]!] || ''}`
                if (simAdendos[i]?.trim()) resp += `\n\nJustificativa do aluno: ${simAdendos[i].trim()}`
            }
            respostasFinais.push(resp)

            if (resp) {
                try {
                    const result = await avaliarRespostaInterrogatorioHTTP({ pergunta: p, respostaAluno: resp })
                    avaliacoesNovas.push(result.avaliacao)
                    if (interrogatorioId) {
                        await salvarRespostaInterrogatorioHTTP({
                            interrogatorioId, perguntaIndex: i,
                            resposta: resp, avaliacao: result.avaliacao,
                            tempoGasto: simTimerTotal,
                        })
                    }
                } catch {
                    avaliacoesNovas.push(null)
                }
            } else {
                avaliacoesNovas.push(null)
            }
        }

        setTodasRespostas(respostasFinais)
        setTodasAvaliacoes(avaliacoesNovas)
        setState('questions')
    }

    // ─── Revisão de Erros ───────────────────────────────────────────────

    const handleRevisaoErros = async (item: InterrogatorioHistorico) => {
        const perguntasFracas = item.perguntas.filter((_, i) => {
            const av = item.avaliacoes[i]
            return av && av.nota < 7
        })
        if (perguntasFracas.length === 0) { setError('Sem perguntas para revisar (todas >= 7)'); return }

        setConteudo(item.conteudo || '')
        setMateria(item.materia || null)
        setModo('revisao_erros')
        setNumPerguntas(Math.min(perguntasFracas.length, 10))
        setState('input')
    }

    const handleRevisaoFromPendente = (rev: RevisaoPendente) => {
        handleRevisaoErros(rev as unknown as InterrogatorioHistorico)
    }

    // ─── Historico ──────────────────────────────────────────────────────

    const loadHistorico = async () => {
        setLoadingHistorico(true)
        try {
            const [histResult, revResult] = await Promise.all([
                buscarHistoricoInterrogatoriosHTTP(),
                buscarRevisoesPendentesHTTP(),
            ])
            setHistorico(histResult.interrogatorios)
            setRevisoes(revResult.revisoes)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
        } finally {
            setLoadingHistorico(false)
        }
    }

    const handleShowHistorico = () => {
        setState('historico')
        loadHistorico()
    }

    const handleViewDetalhe = (item: InterrogatorioHistorico) => {
        setHistoricoDetalhe(item)
        setState('historico_detalhe')
    }

    const handleContinuar = (item: InterrogatorioHistorico) => {
        setPerguntas(item.perguntas)
        setInterrogatorioId(item.id)
        setTodasRespostas(item.respostas || new Array(item.perguntas.length).fill(''))
        setTodasAvaliacoes(item.avaliacoes || new Array(item.perguntas.length).fill(null))
        setTodosTempos(item.tempos || new Array(item.perguntas.length).fill(0))
        setTimerConfig(item.timerPorPergunta)
        const nextIdx = item.respostas?.findIndex(r => !r) ?? 0
        setCurrentIdx(nextIdx >= 0 ? nextIdx : 0)
        setState('questions')
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deletarInterrogatorioHTTP(deleteTarget.id)
            setHistorico(prev => prev.filter(h => h.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir')
        } finally {
            setDeleting(false)
        }
    }

    const handleRename = async (id: string) => {
        if (!novoNome.trim()) { setEditandoNome(null); return }
        try {
            await renomearInterrogatorioHTTP(id, novoNome.trim())
            setHistorico(prev => prev.map(h => h.id === id ? { ...h, nome: novoNome.trim() } : h))
            if (historicoDetalhe?.id === id) setHistoricoDetalhe({ ...historicoDetalhe!, nome: novoNome.trim() })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao renomear')
        }
        setEditandoNome(null)
    }

    const handleVoltar = () => {
        stopTimer(); stopSimTimer()
        setState('input')
        setPerguntas([]); setAvaliacao(null); setExplicacao(null)
        setTodasRespostas([]); setTodasAvaliacoes([]); setTodosTempos([])
    }

    // ─── Render ─────────────────────────────────────────────────────────

    const todasRespondidas = todasAvaliacoes.filter(a => a !== null).length >= perguntas.length && perguntas.length > 0
    const mediaAtual = calcularMedia(todasAvaliacoes.filter(Boolean) as Avaliacao[])
    const perguntasComErro = todasAvaliacoes.reduce((s, a, i) => a && a.nota < 7 ? s + 1 : s, 0)

    return (
        <PageLayout title="Interrogatório" description="Teste seu conhecimento com IA">
            {error && <ErrorModal error={error} onClose={() => setError(null)} />}
            {deleteTarget && <DeleteModal item={deleteTarget} deleting={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
            {explicacao && <ExplicacaoDisplay explicacao={explicacao} onClose={() => setExplicacao(null)} />}

            {/* ─── INPUT STATE ─────────────────────────────────────────────── */}
            {state === 'input' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Conteúdo */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Conteúdo</label>
                        <textarea ref={textareaRef} value={conteudo} onChange={e => setConteudo(e.target.value)}
                            placeholder="Cole ou digite o conteúdo da aula..."
                            className="w-full h-48 px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        <div className="flex items-center gap-3 mt-2">
                            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                                onChange={e => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
                            <button onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                                <Upload className="w-4 h-4" /> {pdfFile ? pdfFile.name : 'Anexar PDF'}
                            </button>
                            {pdfFile && <button onClick={() => { setPdfFile(null); setPdfBase64(null) }} className="text-xs text-rose-500 hover:underline">Remover</button>}
                        </div>
                    </div>

                    {/* Num perguntas */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Número de perguntas: {numPerguntas}</label>
                        <input type="range" min={3} max={15} value={numPerguntas} onChange={e => setNumPerguntas(Number(e.target.value))}
                            className="w-full accent-primary" />
                        <div className="flex justify-between text-xs text-muted-foreground"><span>3</span><span>15</span></div>
                    </div>

                    {/* Modo */}
                    <ModoSelector value={modo} onChange={setModo} />

                    {/* Timer */}
                    <TimerSelector value={timerConfig} onChange={setTimerConfig} />

                    {/* Múltipla escolha toggle */}
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-primary" /> Incluir múltipla escolha
                            </p>
                            <p className="text-xs text-muted-foreground">Metade dissertativas, metade múltipla escolha</p>
                        </div>
                        <button onClick={() => setIncluirMC(!incluirMC)}
                            className={`w-12 h-7 rounded-full transition-all ${incluirMC ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${incluirMC ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Matéria */}
                    <MateriaSelector value={materia} onChange={setMateria} />

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={handleGerar} disabled={!conteudo.trim() && !pdfBase64}
                            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                            <Sparkles className="w-5 h-5" /> Gerar Interrogatório
                        </button>
                        <button onClick={handleShowHistorico}
                            className="px-4 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm border border-border">
                            <History className="w-5 h-5" /> Histórico
                        </button>
                    </div>
                </div>
            )}

            {/* ─── LOADING ─────────────────────────────────────────────────── */}
            {state === 'loading' && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Gerando perguntas...</p>
                </div>
            )}

            {/* ─── QUESTIONS OVERVIEW ──────────────────────────────────────── */}
            {state === 'questions' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Resumo */}
                    {todasRespondidas && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Resultado Final</h3>
                                    <p className="text-sm text-muted-foreground">{perguntas.length} perguntas</p>
                                </div>
                                <div className={`text-4xl font-bold ${getNotaColor(mediaAtual)}`}>{mediaAtual.toFixed(1)}</div>
                            </div>

                            <div className="flex gap-3 flex-wrap">
                                {perguntasComErro > 0 && (
                                    <button onClick={() => {
                                        const item: InterrogatorioHistorico = {
                                            id: interrogatorioId || '', nome: null, conteudoResumo: conteudo.substring(0, 500),
                                            conteudo, isPdf: !!pdfFile, pdfFilename: null, pdfBase64: null,
                                            perguntas, respostas: todasRespostas, avaliacoes: todasAvaliacoes as Avaliacao[],
                                            tempos: todosTempos, status: 'concluido', modo, materia, timerPorPergunta: timerConfig,
                                            incluirMultiplaEscolha: incluirMC, proximaRevisao: null, intervaloRevisao: null,
                                            createdAt: null, updatedAt: null,
                                        }
                                        handleRevisaoErros(item)
                                    }}
                                        className="px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors">
                                        <RotateCcw className="w-4 h-4" /> Revisar {perguntasComErro} erros
                                    </button>
                                )}
                                <button onClick={() => {
                                    const item: InterrogatorioHistorico = {
                                        id: interrogatorioId || '', nome: null, conteudoResumo: conteudo.substring(0, 500),
                                        conteudo, isPdf: !!pdfFile, pdfFilename: null, pdfBase64: null,
                                        perguntas, respostas: todasRespostas, avaliacoes: todasAvaliacoes as Avaliacao[],
                                        tempos: todosTempos, status: 'concluido', modo, materia, timerPorPergunta: timerConfig,
                                        incluirMultiplaEscolha: incluirMC, proximaRevisao: null, intervaloRevisao: null,
                                        createdAt: null, updatedAt: null,
                                    }
                                    exportarResultadoPDF(item)
                                }}
                                    className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors border border-border">
                                    <Download className="w-4 h-4" /> Exportar PDF
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lista de perguntas */}
                    <div className="space-y-3">
                        {perguntas.map((p, i) => {
                            const av = todasAvaliacoes[i]
                            const respondida = !!todasRespostas[i]
                            return (
                                <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                                    <div className="p-4">
                                        <PerguntaCard pergunta={p} index={i} compact />
                                        {av && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <span className={`text-lg font-bold ${getNotaColor(av.nota)}`}>{av.nota.toFixed(1)}</span>
                                                <span className="text-xs text-muted-foreground">{av.feedbackGeral.substring(0, 80)}...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-border px-4 py-2 bg-secondary/30 flex justify-end gap-2">
                                        {respondida && av ? (
                                            <button onClick={() => handleStartAnswer(i)} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                <RefreshCw className="w-3 h-3" /> Refazer
                                            </button>
                                        ) : (
                                            <button onClick={() => handleStartAnswer(i)} className="text-xs text-primary font-medium flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3" /> Responder
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button onClick={handleVoltar} className="w-full px-4 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors text-sm">
                        Novo Interrogatório
                    </button>
                </div>
            )}

            {/* ─── ANSWERING ───────────────────────────────────────────────── */}
            {(state === 'answering' || state === 'evaluating') && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Progress */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Pergunta {currentIdx + 1} de {perguntas.length}</span>
                        <span>{currentIdx + 1}/{perguntas.length}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${((currentIdx + 1) / perguntas.length) * 100}%` }} />
                    </div>

                    {/* Timer */}
                    {timerConfig && state === 'answering' && (
                        <TimerDisplay segundos={timerSegundos} limite={timerConfig} />
                    )}

                    {/* Pergunta */}
                    <PerguntaCard pergunta={perguntas[currentIdx]} index={currentIdx} />

                    {state === 'answering' && (
                        <>
                            {/* Input */}
                            {perguntas[currentIdx].tipo_formato === 'multipla_escolha' && perguntas[currentIdx].alternativas ? (
                                <MultiplaEscolhaInput
                                    alternativas={perguntas[currentIdx].alternativas!}
                                    selected={selectedAlt}
                                    onChange={setSelectedAlt}
                                    adendo={mcAdendo}
                                    onAdendoChange={setMcAdendo}
                                />
                            ) : (
                                <div className="space-y-3">
                                    <textarea value={resposta} onChange={e => setResposta(e.target.value)}
                                        placeholder="Digite sua resposta..."
                                        className="w-full h-40 px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                    {/* Ações de input */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button onClick={recording ? stopRecording : startRecording} disabled={transcribing}
                                            className={`p-2 rounded-lg transition-colors ${recording ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                                            {transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> : recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                        <input ref={anexoInputRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                                            onChange={e => e.target.files && handleAnexoUpload(e.target.files)} />
                                        <button onClick={() => anexoInputRef.current?.click()}
                                            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        {transcribing && <span className="text-xs text-muted-foreground">Transcrevendo áudio...</span>}
                                    </div>
                                    {anexos.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {anexos.map((a, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-xs">
                                                    {a.tipo === 'image' ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                                    <span className="truncate max-w-24">{a.filename}</span>
                                                    <button onClick={() => setAnexos(prev => prev.filter((_, j) => j !== i))}>
                                                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button onClick={handleSubmitResposta}
                                disabled={(!resposta.trim() && !selectedAlt)}
                                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm">
                                <Send className="w-5 h-5" /> Enviar Resposta
                            </button>
                        </>
                    )}

                    {state === 'evaluating' && (
                        <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-muted-foreground text-sm">Avaliando sua resposta...</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── RESULT ──────────────────────────────────────────────────── */}
            {state === 'result' && avaliacao && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <PerguntaCard pergunta={perguntas[currentIdx]} index={currentIdx} />

                    {/* Resposta do aluno */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Sua resposta:</p>
                        <p className="text-sm text-foreground">{todasRespostas[currentIdx]}</p>
                        {todosTempos[currentIdx] > 0 && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatTempo(todosTempos[currentIdx])}
                            </p>
                        )}
                    </div>

                    <AvaliacaoDisplay
                        avaliacao={avaliacao}
                        pergunta={perguntas[currentIdx]}
                        onExplicacao={loadingExplicacao ? undefined : handleExplicacao}
                    />
                    {loadingExplicacao && (
                        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" /> Gerando explicação...
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={handleRefazer} className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 text-sm border border-border">
                            <RefreshCw className="w-4 h-4" /> Refazer
                        </button>
                        <button onClick={handleProxima} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm">
                            {currentIdx < perguntas.length - 1 ? <><ChevronRight className="w-4 h-4" /> Próxima</> : <><Check className="w-4 h-4" /> Finalizar</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── SIMULADO ────────────────────────────────────────────────── */}
            {state === 'simulado' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-3">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" /> Simulado
                        </h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-mono text-muted-foreground">
                                <Timer className="w-4 h-4 inline mr-1" />{formatTempo(simTimerTotal)}
                            </span>
                            <button onClick={handleSimSubmitAll}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2">
                                <Send className="w-4 h-4" /> Entregar Tudo
                            </button>
                        </div>
                    </div>

                    {/* Nav de perguntas */}
                    <div className="flex gap-2 flex-wrap">
                        {perguntas.map((_, i) => {
                            const answered = !!(simRespostas[i]?.trim() || simAlts[i])
                            return (
                                <button key={i} onClick={() => setSimFocusIdx(i)}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${simFocusIdx === i
                                        ? 'bg-primary text-primary-foreground'
                                        : answered
                                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'
                                            : 'bg-secondary text-muted-foreground border border-border'}`}>
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>

                    {/* Pergunta atual */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <PerguntaCard pergunta={perguntas[simFocusIdx]} index={simFocusIdx} />

                        <div className="mt-6">
                            {perguntas[simFocusIdx].tipo_formato === 'multipla_escolha' && perguntas[simFocusIdx].alternativas ? (
                                <MultiplaEscolhaInput
                                    alternativas={perguntas[simFocusIdx].alternativas!}
                                    selected={simAlts[simFocusIdx]}
                                    onChange={v => {
                                        const n = [...simAlts]; n[simFocusIdx] = v; setSimAlts(n)
                                    }}
                                    adendo={simAdendos[simFocusIdx] || ''}
                                    onAdendoChange={v => {
                                        const n = [...simAdendos]; n[simFocusIdx] = v; setSimAdendos(n)
                                    }}
                                />
                            ) : (
                                <textarea value={simRespostas[simFocusIdx] || ''}
                                    onChange={e => {
                                        const n = [...simRespostas]; n[simFocusIdx] = e.target.value; setSimRespostas(n)
                                    }}
                                    placeholder="Sua resposta..."
                                    className="w-full h-32 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            )}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setSimFocusIdx(Math.max(0, simFocusIdx - 1))} disabled={simFocusIdx === 0}
                                className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm disabled:opacity-30">← Anterior</button>
                            <button onClick={() => setSimFocusIdx(Math.min(perguntas.length - 1, simFocusIdx + 1))} disabled={simFocusIdx === perguntas.length - 1}
                                className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm disabled:opacity-30">Próxima →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── HISTORICO ───────────────────────────────────────────────── */}
            {state === 'historico' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <button onClick={() => setState('input')} className="text-sm text-primary hover:underline flex items-center gap-1">← Voltar</button>

                    {loadingHistorico ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                    ) : (
                        <>
                            <RevisoesPendentesCard revisoes={revisoes} onIniciar={handleRevisaoFromPendente} />
                            <DashboardStats historico={historico} />

                            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                                {historico.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">Nenhum interrogatório encontrado</div>
                                ) : (
                                    historico.map(h => (
                                        <HistoricoItem key={h.id} item={h}
                                            onView={() => handleViewDetalhe(h)}
                                            onDelete={() => setDeleteTarget(h)}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ─── HISTORICO DETALHE ───────────────────────────────────────── */}
            {state === 'historico_detalhe' && historicoDetalhe && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <button onClick={() => { setState('historico'); loadHistorico() }} className="text-sm text-primary hover:underline flex items-center gap-1">← Histórico</button>
                        <div className="flex gap-2">
                            {historicoDetalhe.status === 'em_andamento' && (
                                <button onClick={() => handleContinuar(historicoDetalhe)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" /> Continuar
                                </button>
                            )}
                            <button onClick={() => exportarResultadoPDF(historicoDetalhe)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-medium flex items-center gap-1 border border-border">
                                <Download className="w-3 h-3" /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Nome editável */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        {editandoNome === historicoDetalhe.id ? (
                            <div className="flex gap-2">
                                <input value={novoNome} onChange={e => setNovoNome(e.target.value)} autoFocus
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(historicoDetalhe.id); if (e.key === 'Escape') setEditandoNome(null) }}
                                />
                                <button onClick={() => handleRename(historicoDetalhe.id)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm"><Check className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">{historicoDetalhe.nome || historicoDetalhe.conteudoResumo.substring(0, 60)}</h2>
                                <button onClick={() => { setEditandoNome(historicoDetalhe.id); setNovoNome(historicoDetalhe.nome || '') }}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full ${historicoDetalhe.status === 'concluido' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                                {historicoDetalhe.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                            </span>
                            {historicoDetalhe.materia && <span className="px-2 py-0.5 bg-secondary rounded-full">{historicoDetalhe.materia}</span>}
                            {historicoDetalhe.modo !== 'normal' && <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full">{historicoDetalhe.modo}</span>}
                            {historicoDetalhe.createdAt && <span><Clock className="w-3 h-3 inline mr-1" />{new Date(historicoDetalhe.createdAt).toLocaleDateString('pt-BR')}</span>}
                        </div>
                        {historicoDetalhe.status === 'concluido' && (
                            <div className={`mt-3 text-3xl font-bold ${getNotaColor(calcularMedia(historicoDetalhe.avaliacoes))}`}>
                                {calcularMedia(historicoDetalhe.avaliacoes).toFixed(1)}<span className="text-sm text-muted-foreground font-normal">/10</span>
                            </div>
                        )}
                    </div>

                    {/* Perguntas e avaliacoes */}
                    {historicoDetalhe.perguntas.map((p, i) => {
                        const resp = historicoDetalhe.respostas?.[i]
                        const av = historicoDetalhe.avaliacoes?.[i]
                        const tempo = historicoDetalhe.tempos?.[i]
                        return (
                            <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                                <PerguntaCard pergunta={p} index={i} compact />
                                {resp && (
                                    <div className="mt-3 bg-secondary/50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Sua resposta:</p>
                                        <p className="text-sm text-foreground">{resp}</p>
                                        {typeof tempo === 'number' && tempo > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{formatTempo(tempo)}</p>
                                        )}
                                    </div>
                                )}
                                {av && <div className="mt-4"><AvaliacaoDisplay avaliacao={av} pergunta={p} /></div>}
                                {!resp && <p className="mt-3 text-sm text-muted-foreground italic">Não respondida</p>}
                            </div>
                        )
                    })}
                </div>
            )}
        </PageLayout>
    )
}
