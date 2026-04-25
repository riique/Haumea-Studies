'use client'

import { PageLayout } from '@/components/PageLayout'
import { Sparkles, Image as ImageIcon, Coins, Plus, FileText, Clock, CheckCircle, XCircle, Loader2, Eye, BookOpen, Trash2, Lightbulb, MessageSquare } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRedacoes } from '@/hooks/useRedacoes'
import { db } from '@/lib/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { CorrecaoRedacao, CriterioAvaliacao } from '@/types/redacao'
import { BANCAS_CONFIG, getBancaConfig } from '@/types/banca'
import { TextoMarcado, LegendaMarcacoes } from '@/components/TextoMarcado'
import { corrigirRedacaoHTTP } from '@/lib/api/corrigirRedacao'

export default function CorrecaoRedacaoPage() {
  const { user, userData } = useAuth()
  const { redacoes, loading: loadingRedacoes } = useRedacoes()
  const [showNewCorrection, setShowNewCorrection] = useState(false)
  const [essayTheme, setEssayTheme] = useState('')
  const [essayText, setEssayText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCorrecao, setSelectedCorrecao] = useState<CorrecaoRedacao | null>(null)
  const [redacaoToDelete, setRedacaoToDelete] = useState<CorrecaoRedacao | null>(null)
  const [deleting, setDeleting] = useState(false)

  const credits = userData?.credits ?? 0

  // Helper para obter critérios da correção (suporta legado ENEM e novo formato genérico)
  const getCriteriosFromCorrecao = (correcao: CorrecaoRedacao): CriterioAvaliacao[] => {
    // Se já tem critérios no novo formato, usa eles
    if (correcao.criterios && correcao.criterios.length > 0) {
      return correcao.criterios
    }

    // Se tem competências legado (ENEM), converte para formato genérico
    if (correcao.competencias) {
      const bancaConfig = getBancaConfig('enem')
      return Object.entries(correcao.competencias).map(([key, comp]) => {
        const criterioConfig = bancaConfig.criterios.find(c => c.id === key)
        return {
          id: key,
          nome: criterioConfig?.nome || key.toUpperCase(),
          nota: comp.nota,
          notaMaxima: criterioConfig?.notaMaxima || 200,
          feedback: comp.feedback,
          pontosFortes: comp.pontosFortes,
          pontosAMelhorar: comp.pontosAMelhorar,
        }
      })
    }

    return []
  }

  // Critérios da correção selecionada
  const criteriosSelecionados = useMemo(() => {
    if (!selectedCorrecao) return []
    return getCriteriosFromCorrecao(selectedCorrecao)
  }, [selectedCorrecao])

  // Nota máxima da banca
  const notaMaximaBanca = useMemo(() => {
    if (!selectedCorrecao) return 1000
    return selectedCorrecao.notaMaxima || 1000
  }, [selectedCorrecao])

  const handleSubmitCorrection = async () => {
    if (!user) {
      setError('Você precisa estar autenticado')
      return
    }

    if (!essayTheme.trim() || !essayText.trim()) {
      setError('Preencha o tema e o texto da redação')
      return
    }

    if (essayText.length < 100) {
      setError('O texto deve ter pelo menos 100 caracteres')
      return
    }

    if (credits < 1) {
      setError('Créditos insuficientes. Você precisa de pelo menos 1 crédito.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await corrigirRedacaoHTTP({
        tema: essayTheme,
        texto: essayText,
      })

      if (result.success) {
        setShowNewCorrection(false)
        setEssayTheme('')
        setEssayText('')

        // Feedback se está usando API Key do sistema
        if (result.usandoApiKeySistema) {
          console.log('✓ Correção realizada usando API Key padrão do sistema')
        }

        // A correção será exibida automaticamente via hook useRedacoes
      } else {
        setError('Erro ao processar correção')
      }
    } catch (err: unknown) {
      console.error('Erro ao submeter correção:', err)

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'

      // Se for timeout, mostra mensagem especial
      if (errorMessage.includes('Tempo limite excedido')) {
        setError('A correção está demorando mais que o esperado, mas está sendo processada. Aguarde alguns instantes e ela aparecerá no histórico.')
      } else {
        setError(errorMessage || 'Erro ao processar correção. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'concluida':
        return 'text-green-600 dark:text-green-400'
      case 'processando':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'erro':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="w-5 h-5" />
      case 'processando':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'erro':
        return <XCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const handleDeleteRedacao = async () => {
    if (!user || !redacaoToDelete) return

    setDeleting(true)
    try {
      const redacaoRef = doc(db, 'users', user.uid, 'redacoes', redacaoToDelete.id)
      await deleteDoc(redacaoRef)
      setRedacaoToDelete(null)
    } catch (err) {
      console.error('Erro ao deletar redação:', err)
      setError('Erro ao deletar redação. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageLayout
      title="Correção de Redação"
      description="Use inteligência artificial para corrigir suas redações e obter feedback detalhado"
    >
      <div className="space-y-6">
        {/* Credits Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Correção Inteligente com IA
                </h3>
                <p className="text-muted-foreground text-sm">
                  Análise completa baseada nos critérios do ENEM
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card border border-primary/30 rounded-lg px-4 py-3">
              <Coins className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Créditos disponíveis</p>
                <p className="text-xl font-bold text-primary">{credits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Correction Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowNewCorrection(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            Nova Correção
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Erro</p>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        )}

        {/* Recent Corrections */}
        {loadingRedacoes ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando correções...</p>
          </div>
        ) : redacoes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma correção realizada ainda
            </h3>
            <p className="text-muted-foreground">
              Clique em "Nova Correção" para enviar sua primeira redação
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Histórico de Correções</h3>
            <div className="grid gap-4">
              {redacoes.map((redacao) => (
                <div
                  key={redacao.id}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => redacao.status === 'concluida' && setSelectedCorrecao(redacao)}
                    >
                      <h4 className="font-semibold text-foreground mb-1">{redacao.tema}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(redacao.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 ${getStatusColor(redacao.status)}`}>
                        {getStatusIcon(redacao.status)}
                        <span className="text-sm font-medium">
                          {redacao.status === 'concluida' && `${redacao.notaFinal} pts`}
                          {redacao.status === 'processando' && 'Processando'}
                          {redacao.status === 'erro' && 'Erro'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRedacaoToDelete(redacao)
                        }}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar redação"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {redacao.status === 'concluida' && (
                    <div
                      className="flex items-center gap-2 text-sm text-primary cursor-pointer"
                      onClick={() => setSelectedCorrecao(redacao)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Clique para ver detalhes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Correction Modal */}
      {showNewCorrection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-3xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Nova Correção de Redação
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>Custo: <strong className="text-primary">1 crédito</strong></span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Essay Theme */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tema da Redação *
                </label>
                <input
                  type="text"
                  value={essayTheme}
                  onChange={(e) => setEssayTheme(e.target.value)}
                  placeholder="Ex: A importância da educação ambiental no Brasil contemporâneo"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>

              {/* Transcribe from Image Button */}
              <div className="flex items-center justify-between p-4 bg-secondary border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Transcrever de Imagem</p>
                    <p className="text-xs text-muted-foreground">Use IA para transcrever texto de uma foto</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  Selecionar Imagem
                </button>
              </div>

              {/* Essay Text */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Texto da Redação *
                </label>
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Cole ou digite o texto da sua redação aqui..."
                  rows={12}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {essayText.length} caracteres • Recomendado: entre 800-1200 palavras
                </p>
              </div>

              {/* Info Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">O que você receberá:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Nota detalhada por competência (C1 a C5)</li>
                      <li>• Análise de gramática e ortografia</li>
                      <li>• Sugestões de melhoria personalizadas</li>
                      <li>• Feedback sobre estrutura e argumentação</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewCorrection(false)
                  setEssayTheme('')
                  setEssayText('')
                }}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitCorrection}
                disabled={!essayTheme.trim() || !essayText.trim() || essayText.length < 100 || submitting}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Enviar para Correção
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Correction Modal */}
      {selectedCorrecao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-7xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Correção Detalhada
                </h3>
                <p className="text-muted-foreground">{selectedCorrecao.tema}</p>
              </div>
              <button
                onClick={() => setSelectedCorrecao(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Grid Layout: Nota + Competências */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Nota Final - Destaque maior */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 rounded-xl p-8 h-full flex flex-col justify-center items-center sticky top-6">
                  <Sparkles className="w-12 h-12 text-primary mb-4" />
                  <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Nota Final</p>
                  <p className="text-6xl font-bold text-primary mb-2">{selectedCorrecao.notaFinal}</p>
                  <p className="text-sm text-muted-foreground">de {notaMaximaBanca} pontos</p>
                  <div className="w-full bg-secondary rounded-full h-3 mt-4">
                    <div
                      className="bg-primary rounded-full h-3 transition-all duration-500"
                      style={{ width: `${(selectedCorrecao.notaFinal / notaMaximaBanca) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Critérios em Cards Menores */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {criteriosSelecionados.map((criterio) => (
                  <div key={criterio.id} className="bg-secondary border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-foreground text-lg">
                        {criterio.id.toUpperCase()}
                      </h5>
                      <span className="text-3xl font-bold text-primary">{criterio.nota}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {criterio.nome}
                    </p>
                    <div className="w-full bg-background rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${(criterio.nota / criterio.notaMaxima) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Texto Marcado/Marcacoes pela IA */}
            {(selectedCorrecao.marcacoesTexto || selectedCorrecao.textoMarcado) && (
              <div className="bg-gradient-to-br from-background to-secondary border-2 border-primary/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <h4 className="text-lg font-semibold text-foreground">Sua Redação com Análise da IA</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Legenda */}
                  <div className="lg:col-span-1">
                    <LegendaMarcacoes />
                  </div>

                  {/* Texto Marcado */}
                  <div className="lg:col-span-3">
                    <div className="bg-card rounded-lg p-6 border-2 border-border shadow-sm">
                      <TextoMarcado
                        marcacoesTexto={selectedCorrecao.marcacoesTexto}
                        textoXML={selectedCorrecao.textoMarcado}
                        className="text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Dica:</span>
                    <span>
                      As marcações coloridas indicam pontos importantes identificados pela IA. Clique nos ícones azuis
                    </span>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white mx-1">
                      <MessageSquare className="w-3 h-3" />
                    </span>
                    <span>para ver comentários detalhados.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Critérios/Competências */}
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold text-foreground">Avaliação Detalhada por Critério</h4>
              {criteriosSelecionados.map((criterio) => (
                <div key={criterio.id} className="bg-secondary rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-foreground">
                      {criterio.id.toUpperCase()}: {criterio.nome}
                    </h5>
                    <span className="text-2xl font-bold text-primary">{criterio.nota}/{criterio.notaMaxima}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{criterio.feedback}</p>

                  {criterio.pontosFortes && criterio.pontosFortes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✓ Pontos Fortes:</p>
                      <ul className="space-y-1">
                        {criterio.pontosFortes.map((ponto, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground pl-4">• {ponto}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {criterio.pontosAMelhorar && criterio.pontosAMelhorar.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-700 mb-2">⚠ Pontos a Melhorar:</p>
                      <ul className="space-y-1">
                        {criterio.pontosAMelhorar.map((ponto, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground pl-4">• {ponto}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Feedback Geral */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-foreground mb-3">Feedback Geral</h4>
              <p className="text-muted-foreground whitespace-pre-line">{selectedCorrecao.feedbackGeral}</p>
            </div>

            {/* Sugestões de Melhoria */}
            {selectedCorrecao.sugestoesMelhoria && selectedCorrecao.sugestoesMelhoria.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-foreground mb-3">Sugestões de Melhoria</h4>
                <ul className="space-y-3">
                  {selectedCorrecao.sugestoesMelhoria.map((sugestao, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        {typeof sugestao === 'string' ? (
                          <p className="text-muted-foreground">{sugestao}</p>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-primary mb-1">{sugestao.area}</p>
                            <p className="text-muted-foreground">{sugestao.sugestao}</p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Erros Gramaticais */}
            {selectedCorrecao.errosGramaticais && selectedCorrecao.errosGramaticais.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h4 className="text-lg font-semibold text-foreground mb-3">Erros Gramaticais</h4>
                <div className="space-y-3">
                  {selectedCorrecao.errosGramaticais.map((erro, idx) => (
                    <div key={idx} className="bg-secondary rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {erro.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Trecho:</span> "{erro.trecho}"
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        <span className="font-medium">Sugestão:</span> {erro.sugestao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCorrecao(null)}
                className="px-6 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {redacaoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Deletar Redação?
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Tem certeza que deseja deletar esta redação?
                </p>
                <p className="text-sm font-medium text-foreground">
                  {redacaoToDelete.tema}
                </p>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-destructive">
                Esta ação não pode ser desfeita. Todas as informações da correção serão perdidas permanentemente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRedacaoToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRedacao}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Deletar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
