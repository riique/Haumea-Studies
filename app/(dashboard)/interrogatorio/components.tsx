'use client'

import {
    Sparkles, FileText, Loader2, AlertTriangle, XCircle, CheckCircle,
    MessageSquare, Target, Upload, Mic, MicOff, Send, ChevronRight,
    RefreshCw, BookOpen, Lightbulb, Edit3, Image, Paperclip, X, Pencil,
    History, Eye, ChevronDown, ChevronUp, Clock, Star, Trash2, FileImage,
    ExternalLink, Timer, Download, Tag, Zap, RotateCcw, ListChecks,
    ArrowRight, Brain, BarChart3, Calendar, Award
} from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Pergunta, Avaliacao, AnexoResposta, InterrogatorioHistorico, Explicacao,
    RevisaoPendente, ModoInterrogatorio, TimerConfig, Materia, MATERIAS,
    fileToBase64, fileToAnexo, exportarResultadoPDF,
    gerarExplicacaoInterrogatorioHTTP, transcreverAudioInterrogatorioHTTP,
} from '@/lib/api/interrogatorio'
import { LatexRenderer } from '@/components/LatexRenderer'

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── ErrorModal ─────────────────────────────────────────────────────────────

export function ErrorModal({ error, onClose }: { error: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Erro</h3>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Fechar
                </button>
            </div>
        </div>
    )
}

// ─── DeleteModal ────────────────────────────────────────────────────────────

export function DeleteModal({ item, deleting, onConfirm, onCancel }: {
    item: InterrogatorioHistorico; deleting: boolean; onConfirm: () => void; onCancel: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Excluir Interrogatório</h3>
                        <p className="text-sm text-muted-foreground">Ação irreversível.</p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.conteudoResumo}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</> : <><Trash2 className="w-4 h-4" /> Excluir</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── TimerDisplay ───────────────────────────────────────────────────────────

export function TimerDisplay({ segundos, limite }: { segundos: number; limite: number }) {
    const pct = Math.min(100, (segundos / limite) * 100)
    const urgente = pct > 80
    return (
        <div className="flex items-center gap-3">
            <Timer className={`w-5 h-5 ${urgente ? 'text-rose-500 animate-pulse' : 'text-muted-foreground'}`} />
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${urgente ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-sm font-mono font-bold tabular-nums ${urgente ? 'text-rose-500' : 'text-muted-foreground'}`}>
                {formatTempo(Math.max(0, limite - segundos))}
            </span>
        </div>
    )
}

// ─── MateriaSelector ────────────────────────────────────────────────────────

export function MateriaSelector({ value, onChange }: { value: Materia | null; onChange: (v: Materia | null) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="w-4 h-4 inline mr-1" /> Matéria (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
                {MATERIAS.map(m => (
                    <button key={m} onClick={() => onChange(value === m ? null : m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${value === m
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}>
                        {m}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── ModoSelector ───────────────────────────────────────────────────────────

export function ModoSelector({ value, onChange }: { value: ModoInterrogatorio; onChange: (v: ModoInterrogatorio) => void }) {
    const modos: { id: ModoInterrogatorio; label: string; desc: string; icon: React.ReactNode }[] = [
        { id: 'normal', label: 'Normal', desc: 'Responda uma a uma', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'simulado', label: 'Simulado', desc: 'Todas de vez, timer global', icon: <Zap className="w-5 h-5" /> },
    ]
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-2">Modo</label>
            <div className="grid grid-cols-2 gap-3">
                {modos.map(m => (
                    <button key={m.id} onClick={() => onChange(m.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${value === m.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={value === m.id ? 'text-primary' : 'text-muted-foreground'}>{m.icon}</span>
                            <span className="font-medium text-foreground text-sm">{m.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── TimerSelector ──────────────────────────────────────────────────────────

export function TimerSelector({ value, onChange }: { value: TimerConfig; onChange: (v: TimerConfig) => void }) {
    const opts: { v: TimerConfig; label: string }[] = [
        { v: null, label: 'Sem timer' },
        { v: 180, label: '3 min' },
        { v: 300, label: '5 min' },
        { v: 600, label: '10 min' },
    ]
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-2">
                <Timer className="w-4 h-4 inline mr-1" /> Timer por pergunta
            </label>
            <div className="flex gap-2">
                {opts.map(o => (
                    <button key={String(o.v)} onClick={() => onChange(o.v)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${value === o.v
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── PerguntaCard ───────────────────────────────────────────────────────────

export function PerguntaCard({ pergunta, index, compact }: { pergunta: Pergunta; index: number; compact?: boolean }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-foreground ${compact ? 'text-sm' : ''}`}><LatexRenderer content={pergunta.pergunta} /></div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{getTipoLabel(pergunta.tipo)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getDificuldadeColor(pergunta.dificuldade)}`}>{getDificuldadeLabel(pergunta.dificuldade)}</span>
                    {pergunta.tipo_formato === 'multipla_escolha' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">Múlt. Escolha</span>
                    )}
                    <span className="text-xs text-muted-foreground">{pergunta.topico}</span>
                </div>
            </div>
        </div>
    )
}

// ─── MultiplaEscolhaInput ───────────────────────────────────────────────────

export function MultiplaEscolhaInput({ alternativas, selected, onChange, adendo, onAdendoChange }: {
    alternativas: Record<string, string>; selected: string | null; onChange: (v: string) => void
    adendo?: string; onAdendoChange?: (v: string) => void
}) {
    return (
        <div className="space-y-3">
            {Object.entries(alternativas).map(([letra, texto]) => (
                <button key={letra} onClick={() => onChange(letra)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all flex gap-3 ${selected === letra
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${selected === letra
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'}`}>
                        {letra}
                    </span>
                    <span className="text-sm text-foreground pt-1"><LatexRenderer content={texto} /></span>
                </button>
            ))}
            {onAdendoChange && (
                <div className="pt-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        Adendo / Justificativa (opcional)
                    </label>
                    <textarea
                        value={adendo || ''}
                        onChange={e => onAdendoChange(e.target.value)}
                        placeholder="Explique seu raciocínio ou adicione observações..."
                        className="w-full h-24 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
            )}
        </div>
    )
}

// ─── AvaliacaoDisplay ───────────────────────────────────────────────────────

export function AvaliacaoDisplay({ avaliacao, pergunta, onExplicacao }: {
    avaliacao: Avaliacao; pergunta: Pergunta; onExplicacao?: () => void
}) {
    return (
        <div className="space-y-4">
            {/* Nota */}
            <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${getNotaColor(avaliacao.nota)}`}>{avaliacao.nota.toFixed(1)}</div>
                <div>
                    <p className="text-sm text-muted-foreground">de 10</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${avaliacao.classificacao === 'correta' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : avaliacao.classificacao === 'parcialmente_correta' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`}>
                        {getClassificacaoLabel(avaliacao.classificacao)}
                    </span>
                </div>
            </div>

            {/* Feedback */}
            <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">Feedback</p>
                        <div className="text-muted-foreground text-sm"><LatexRenderer content={avaliacao.feedbackGeral} /></div>
                    </div>
                </div>
            </div>

            {/* Pontos corretos */}
            {avaliacao.pontosCorretos.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Pontos Corretos
                    </h4>
                    <ul className="space-y-1">
                        {avaliacao.pontosCorretos.map((p, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span>{p}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Erros */}
            {avaliacao.errosEncontrados.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Erros
                    </h4>
                    <div className="space-y-3">
                        {avaliacao.errosEncontrados.map((e, i) => (
                            <div key={i} className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-lg p-3">
                                {e.trecho && <p className="text-sm text-rose-700 dark:text-rose-400 font-medium mb-1">&ldquo;{e.trecho}&rdquo;</p>}
                                <p className="text-sm text-muted-foreground">{e.erro}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* O que faltou */}
            {avaliacao.oQueFaltou.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> O Que Faltou
                    </h4>
                    <ul className="space-y-1">
                        {avaliacao.oQueFaltou.map((f, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-amber-500 mt-1">{i + 1}.</span>{f}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Dica */}
            {avaliacao.dicaParaMelhorar && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
                        <div>
                            <p className="font-medium text-primary text-sm mb-1">Dica</p>
                            <div className="text-muted-foreground text-sm"><LatexRenderer content={avaliacao.dicaParaMelhorar} /></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Botão explicação */}
            {onExplicacao && (
                <button onClick={onExplicacao} className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 border border-border">
                    <Brain className="w-5 h-5 text-primary" />
                    Ver Explicação Passo a Passo
                </button>
            )}
        </div>
    )
}

// ─── ExplicacaoDisplay ──────────────────────────────────────────────────────

export function ExplicacaoDisplay({ explicacao, onClose }: { explicacao: Explicacao; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" /> Explicação Passo a Passo
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="text-muted-foreground"><LatexRenderer content={explicacao.resumo} /></div>
                    {explicacao.passos.map((p, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-primary">{p.numero}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-foreground mb-1">{p.titulo}</h4>
                                <div className="text-sm text-muted-foreground"><LatexRenderer content={p.conteudo} /></div>
                                {p.dica && (
                                    <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 text-amber-700 dark:text-amber-400">
                                        <Lightbulb className="w-3 h-3 inline mr-1" /> <LatexRenderer content={p.dica} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Conclusão</p>
                        <div className="text-sm text-muted-foreground"><LatexRenderer content={explicacao.conclusao} /></div>
                    </div>
                    {explicacao.conceitosRelacionados.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Conceitos relacionados:</p>
                            <div className="flex flex-wrap gap-2">
                                {explicacao.conceitosRelacionados.map((c, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-lg text-foreground">{c}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── DashboardStats ─────────────────────────────────────────────────────────

export function DashboardStats({ historico }: { historico: InterrogatorioHistorico[] }) {
    const concluidos = historico.filter(h => h.status === 'concluido')
    const totalPerguntas = concluidos.reduce((s, h) => s + h.respostas.filter(r => r).length, 0)
    const todasNotas = concluidos.flatMap(h => h.avaliacoes.filter(a => a?.nota !== undefined).map(a => a.nota))
    const mediaGeral = todasNotas.length ? todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length : 0

    // Por matéria
    const porMateria: Record<string, number[]> = {}
    concluidos.forEach(h => {
        const mat = h.materia || 'Sem matéria'
        if (!porMateria[mat]) porMateria[mat] = []
        h.avaliacoes.forEach(a => { if (a?.nota !== undefined) porMateria[mat].push(a.nota) })
    })

    // Por tipo
    const porTipo: Record<string, number[]> = {}
    concluidos.forEach(h => {
        h.perguntas.forEach((p, i) => {
            const av = h.avaliacoes[i]
            if (av?.nota !== undefined) {
                if (!porTipo[p.tipo]) porTipo[p.tipo] = []
                porTipo[p.tipo].push(av.nota)
            }
        })
    })

    // Tempo médio
    const todosTempos = concluidos.flatMap(h => (h.tempos || []).filter(t => t > 0))
    const tempoMedio = todosTempos.length ? todosTempos.reduce((a, b) => a + b, 0) / todosTempos.length : 0

    if (concluidos.length === 0) return null

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Performance
            </h3>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{concluidos.length}</p>
                    <p className="text-xs text-muted-foreground">Sessões</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{totalPerguntas}</p>
                    <p className="text-xs text-muted-foreground">Perguntas</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${getNotaColor(mediaGeral)}`}>{mediaGeral.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{tempoMedio > 0 ? formatTempo(Math.round(tempoMedio)) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Tempo médio</p>
                </div>
            </div>

            {/* Por matéria */}
            {Object.keys(porMateria).length > 1 && (
                <div>
                    <p className="text-sm font-medium text-foreground mb-3">Por matéria</p>
                    <div className="space-y-2">
                        {Object.entries(porMateria).sort((a, b) => {
                            const mA = a[1].reduce((s, n) => s + n, 0) / a[1].length
                            const mB = b[1].reduce((s, n) => s + n, 0) / b[1].length
                            return mA - mB
                        }).map(([mat, notas]) => {
                            const med = notas.reduce((a, b) => a + b, 0) / notas.length
                            return (
                                <div key={mat} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-24 truncate">{mat}</span>
                                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${med >= 7 ? 'bg-emerald-500' : med >= 5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: `${med * 10}%` }} />
                                    </div>
                                    <span className={`text-sm font-bold w-10 text-right ${getNotaColor(med)}`}>{med.toFixed(1)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Por tipo */}
            {Object.keys(porTipo).length > 1 && (
                <div>
                    <p className="text-sm font-medium text-foreground mb-3">Por tipo de pergunta</p>
                    <div className="space-y-2">
                        {Object.entries(porTipo).map(([tipo, notas]) => {
                            const med = notas.reduce((a, b) => a + b, 0) / notas.length
                            return (
                                <div key={tipo} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-24 truncate">{getTipoLabel(tipo)}</span>
                                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${med >= 7 ? 'bg-emerald-500' : med >= 5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                            style={{ width: `${med * 10}%` }} />
                                    </div>
                                    <span className={`text-sm font-bold w-10 text-right ${getNotaColor(med)}`}>{med.toFixed(1)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── RevisoesPendentes ──────────────────────────────────────────────────────

export function RevisoesPendentesCard({ revisoes, onIniciar }: {
    revisoes: RevisaoPendente[]; onIniciar: (r: RevisaoPendente) => void
}) {
    if (revisoes.length === 0) return null
    return (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                    <h3 className="font-semibold text-foreground">{revisoes.length} revisões pendentes</h3>
                    <p className="text-xs text-muted-foreground">Spaced repetition — revise para fixar</p>
                </div>
            </div>
            <div className="space-y-2">
                {revisoes.slice(0, 5).map(r => {
                    const media = calcularMedia(r.avaliacoes)
                    return (
                        <div key={r.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">{r.nome || r.conteudoResumo.substring(0, 60)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {r.materia && <span className="text-xs text-muted-foreground">{r.materia}</span>}
                                    <span className={`text-xs font-bold ${getNotaColor(media)}`}>{media.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">· intervalo {r.intervaloRevisao}d</span>
                                </div>
                            </div>
                            <button onClick={() => onIniciar(r)}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Revisar
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── HistoricoItem ──────────────────────────────────────────────────────────

export function HistoricoItem({ item, onView, onDelete }: {
    item: InterrogatorioHistorico
    onView: () => void
    onDelete: (e?: React.MouseEvent) => void
}) {
    const media = calcularMedia(item.avaliacoes)
    const respondidas = item.respostas.filter(r => r).length
    const total = item.perguntas.length
    const concluido = item.status === 'concluido'

    return (
        <div className="p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${concluido
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                            {concluido ? 'Concluído' : 'Em andamento'}
                        </span>
                        {item.isPdf && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">PDF</span>}
                        {item.materia && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground">{item.materia}</span>}
                        {item.modo === 'simulado' && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">Simulado</span>}
                    </div>
                    {item.nome && <p className="text-sm font-medium text-foreground">{item.nome}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.conteudoResumo}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span>{respondidas}/{total}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {respondidas > 0 && (
                        <div className="flex items-center gap-1">
                            <Star className={`w-4 h-4 ${media >= 7 ? 'text-emerald-500' : media >= 5 ? 'text-amber-500' : 'text-rose-500'}`} />
                            <span className={`text-lg font-bold ${getNotaColor(media)}`}>{media.toFixed(1)}</span>
                        </div>
                    )}
                    <button onClick={onView} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Eye className="w-3 h-3" /> Detalhes
                    </button>
                    <button onClick={(e) => onDelete(e)} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 hover:underline">
                        <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                </div>
            </div>
        </div>
    )
}
