'use client'

import { PageLayout } from '@/components/PageLayout'
import {
    Sparkles,
    FileQuestion,
    Loader2,
    XCircle,
    AlertTriangle,
    Target,
    BookOpen,
    Lightbulb,
    MessageSquare,
    TrendingUp,
    RefreshCw
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
    corrigirQuestaoDiscursivaHTTP,
    CorrecaoDiscursivaResponse
} from '@/lib/api/corrigirQuestaoDiscursiva'

export default function CorrecaoDiscursivaPage() {
    const { user
    } = useAuth()
    const [enunciado, setEnunciado] = useState('')
    const [resposta, setResposta] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [correcao, setCorrecao] = useState<CorrecaoDiscursivaResponse | null>(null)

    const handleSubmitCorrection = async () => {
        if (!user) {
            setError('Você precisa estar autenticado')
            return
        }

        if (!enunciado.trim()) {
            setError('Preencha o enunciado da questão')
            return
        }

        if (!resposta.trim()) {
            setError('Preencha a resposta da questão')
            return
        }

        setSubmitting(true)
        setError(null)
        setCorrecao(null)

        try {
            const result = await corrigirQuestaoDiscursivaHTTP({
                enunciado: enunciado.trim(),
                resposta: resposta.trim(),
            })

            if (result.success) {
                setCorrecao(result)
            } else {
                setError('Erro ao processar correção')
            }
        } catch (err: unknown) {
            console.error('Erro ao submeter correção:', err)
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
            setError(errorMessage || 'Erro ao processar correção. Tente novamente.')
            setShowErrorModal(true)
        } finally {
            setSubmitting(false)
        }
    }

    const getClassificacaoColor = (classificacao: string) => {
        switch (classificacao) {
            case 'estruturalmente_adequada':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            case 'parcialmente_adequada':
                return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
            case 'fora_do_escopo':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            default:
                return 'text-muted-foreground bg-muted'
        }
    }

    const getClassificacaoLabel = (classificacao: string) => {
        switch (classificacao) {
            case 'estruturalmente_adequada':
                return 'Estruturalmente Adequada'
            case 'parcialmente_adequada':
                return 'Parcialmente Adequada'
            case 'fora_do_escopo':
                return 'Fora do Escopo'
            default:
                return classificacao
        }
    }

    const getNotaColor = (nota: number) => {
        if (nota >= 8) return 'text-green-600 dark:text-green-400'
        if (nota >= 6) return 'text-yellow-600 dark:text-yellow-400'
        if (nota >= 4) return 'text-orange-600 dark:text-orange-400'
        return 'text-red-600 dark:text-red-400'
    }

    const handleNewCorrection = () => {
        setCorrecao(null)
        setEnunciado('')
        setResposta('')
        setError(null)
        setShowErrorModal(false)
    }

    const handleRetry = () => {
        setShowErrorModal(false)
        setError(null)
        handleSubmitCorrection()
    }

    const handleCloseErrorModal = () => {
        setShowErrorModal(false)
    }

    return (
        <PageLayout
            title="Correção de Questões Discursivas"
            description="Use inteligência artificial para corrigir suas respostas discursivas com avaliação rigorosa"
        >
            <div className="space-y-6">
                {/* Banner de Informação */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileQuestion className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                Banca Avaliadora Rigorosa
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                A IA atua como uma banca exigente de vestibular (nível UFSC/FUVEST),
                                avaliando sua resposta com rigor técnico e apontando todas as falhas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Modal de Erro com Retry */}
                {showErrorModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        Erro na Correção
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {error || 'Ocorreu um erro ao processar sua correção.'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-6">
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    Isso pode acontecer por sobrecarga no servidor ou problemas de conexão. Tente novamente em alguns segundos.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCloseErrorModal}
                                    className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRetry}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Tentando...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-5 h-5" />
                                            Tentar Novamente
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulário ou Resultado */}
                {!correcao ? (
                    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Enviar para Correção
                        </h3>

                        {/* Enunciado */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Enunciado da Questão *
                            </label>
                            <textarea
                                value={enunciado}
                                onChange={(e) => setEnunciado(e.target.value)}
                                placeholder="Cole ou digite o enunciado completo da questão aqui..."
                                rows={6}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Inclua todo o contexto, textos de apoio e o comando da questão.
                            </p>
                        </div>

                        {/* Resposta */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Sua Resposta *
                            </label>
                            <textarea
                                value={resposta}
                                onChange={(e) => setResposta(e.target.value)}
                                placeholder="Cole ou digite sua resposta aqui..."
                                rows={8}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                {resposta.length} caracteres
                            </p>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-foreground mb-1">Avaliação será feita com rigor de vestibular:</p>
                                    <ul className="text-muted-foreground space-y-1">
                                        <li>• Adequação ao comando (0-2 pontos)</li>
                                        <li>• Correção conceitual (0-4 pontos)</li>
                                        <li>• Profundidade explicativa (0-2 pontos)</li>
                                        <li>• Clareza e precisão linguística (0-2 pontos)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmitCorrection}
                            disabled={!enunciado.trim() || !resposta.trim() || submitting}
                            className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Corrigindo... (pode levar até 1 minuto)
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Enviar para Correção
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    /* Resultado da Correção */
                    <div className="space-y-6">
                        {/* Header com Nota e Botão Nova Correção */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`text-5xl font-bold ${getNotaColor(correcao.notaFinal)}`}>
                                    {correcao.notaFinal.toFixed(1)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">de 10 pontos</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getClassificacaoColor(correcao.classificacaoEstrutural)}`}>
                                        {getClassificacaoLabel(correcao.classificacaoEstrutural)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleNewCorrection}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                Nova Correção
                            </button>
                        </div>

                        {/* Tipo da Questão e Veredito */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Target className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Tipo de Questão</p>
                                    <p className="font-semibold text-foreground capitalize">
                                        {correcao.tipoQuestao === 'direta' ? 'Questão Direta' : 'Questão Explicativa'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-secondary rounded-lg p-4">
                                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Veredito da Banca
                                </p>
                                <p className="text-foreground">{correcao.veredito}</p>
                            </div>
                        </div>

                        {/* Critérios de Avaliação */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Avaliação por Critério
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Adequação ao Comando */}
                                <div className="bg-secondary rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-foreground text-sm">Adequação ao Comando</p>
                                        <span className={`text-lg font-bold ${getNotaColor(correcao.criterios.adequacaoAoComando.nota * 5)}`}>
                                            {correcao.criterios.adequacaoAoComando.nota}/2
                                        </span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 mb-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${(correcao.criterios.adequacaoAoComando.nota / 2) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {correcao.criterios.adequacaoAoComando.justificativa}
                                    </p>
                                </div>

                                {/* Correção Conceitual */}
                                <div className="bg-secondary rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-foreground text-sm">Correção Conceitual</p>
                                        <span className={`text-lg font-bold ${getNotaColor(correcao.criterios.correcaoConceitual.nota * 2.5)}`}>
                                            {correcao.criterios.correcaoConceitual.nota}/4
                                        </span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 mb-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${(correcao.criterios.correcaoConceitual.nota / 4) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {correcao.criterios.correcaoConceitual.justificativa}
                                    </p>
                                </div>

                                {/* Profundidade Explicativa */}
                                <div className="bg-secondary rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-foreground text-sm">Profundidade Explicativa</p>
                                        <span className={`text-lg font-bold ${getNotaColor(correcao.criterios.profundidadeExplicativa.nota * 5)}`}>
                                            {correcao.criterios.profundidadeExplicativa.nota}/2
                                        </span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 mb-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${(correcao.criterios.profundidadeExplicativa.nota / 2) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {correcao.criterios.profundidadeExplicativa.justificativa}
                                    </p>
                                </div>

                                {/* Clareza Linguística */}
                                <div className="bg-secondary rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-foreground text-sm">Clareza e Precisão</p>
                                        <span className={`text-lg font-bold ${getNotaColor(correcao.criterios.clarezaLinguistica.nota * 5)}`}>
                                            {correcao.criterios.clarezaLinguistica.nota}/2
                                        </span>
                                    </div>
                                    <div className="w-full bg-background rounded-full h-2 mb-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all duration-500"
                                            style={{ width: `${(correcao.criterios.clarezaLinguistica.nota / 2) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {correcao.criterios.clarezaLinguistica.justificativa}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Justificativa Estrutural */}
                        {correcao.justificativaEstrutural && (
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Análise Estrutural
                                </h4>
                                <p className="text-muted-foreground">{correcao.justificativaEstrutural}</p>
                            </div>
                        )}

                        {/* Falhas Encontradas */}
                        {correcao.falhasEncontradas && correcao.falhasEncontradas.length > 0 && (
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-500" />
                                    Falhas Encontradas
                                </h4>
                                <div className="space-y-4">
                                    {correcao.falhasEncontradas.map((falha, idx) => (
                                        <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                            <div className="mb-2">
                                                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Trecho problemático:</p>
                                                <p className="text-sm text-foreground bg-red-100 dark:bg-red-900/20 rounded px-2 py-1 italic">
                                                    &ldquo;{falha.trecho}&rdquo;
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Problema:</span> {falha.problema}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* O Que Faltou Para Nota Máxima */}
                        {correcao.oQueFaltouParaNotaMaxima && correcao.oQueFaltouParaNotaMaxima.length > 0 && (
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    O Que Faltou Para Nota Máxima
                                </h4>
                                <ul className="space-y-2">
                                    {correcao.oQueFaltouParaNotaMaxima.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <p className="text-muted-foreground">{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Sugestões de Melhoria */}
                        {correcao.sugestoesDeMelhoria && correcao.sugestoesDeMelhoria.length > 0 && (
                            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Como Melhorar Sua Resposta
                                </h4>
                                <div className="space-y-4">
                                    {correcao.sugestoesDeMelhoria.map((sugestao, idx) => (
                                        <div key={idx} className="bg-card border border-border rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Lightbulb className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary text-sm mb-1">{sugestao.area}</p>
                                                    <p className="text-muted-foreground text-sm">{sugestao.sugestao}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enunciado e Resposta Original */}
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Dados Enviados
                            </h4>

                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">Enunciado:</p>
                                <div className="bg-secondary rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {enunciado}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">Sua Resposta:</p>
                                <div className="bg-secondary rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {resposta}
                                </div>
                            </div>
                        </div>

                        {/* Botão Nova Correção no Final */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleNewCorrection}
                                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Sparkles className="w-6 h-6" />
                                Nova Correção
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}
