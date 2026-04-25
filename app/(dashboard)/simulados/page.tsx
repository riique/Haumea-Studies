'use client'

import { PageLayout } from '@/components/PageLayout'
import { Plus, Search, GraduationCap, TrendingUp, Award, Clock, Eye, Pencil, Trash2, AlertTriangle, X, Check, XCircle, BookX, Brain } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useSimulados } from '@/hooks/useFirestoreData'
import { collection, addDoc, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { SimuladosChart } from '@/components/SimuladosChart'
import { ErrorAnalysisChart } from '@/components/ErrorAnalysisChart'

// Configuração das bancas
const BANCAS_CONFIG = {
  ENEM: {
    nome: 'ENEM',
    provas: [
      { id: 'prova1', nome: 'Prova 1 (Linguagens + Humanas)', questoes: 90 },
      { id: 'prova2', nome: 'Prova 2 (Natureza + Matemática)', questoes: 90 }
    ]
  },
  UFSM: {
    nome: 'UFSM',
    provas: [
      { id: 'prova1', nome: 'Prova 1', questoes: 40 },
      { id: 'prova2', nome: 'Prova 2', questoes: 40 },
      { id: 'prova3', nome: 'Prova 3', questoes: 40 }
    ]
  }
} as const

type BancaType = keyof typeof BANCAS_CONFIG | ''
type MotivoErro = 'falta_conteudo' | 'falta_atencao' | null

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function SimuladosPage() {
  const { user } = useAuth()
  const { simulados, loading } = useSimulados()
  const [showNewSimulado, setShowNewSimulado] = useState(false)
  const [simuladoType, setSimuladoType] = useState('')
  const [simuladoName, setSimuladoName] = useState('')
  const [dia1Enabled, setDia1Enabled] = useState(false)
  const [dia2Enabled, setDia2Enabled] = useState(false)
  const [redacaoEnabled, setRedacaoEnabled] = useState(false)
  const [linguagens, setLinguagens] = useState(0)
  const [humanas, setHumanas] = useState(0)
  const [naturezas, setNaturezas] = useState(0)
  const [matematica, setMatematica] = useState(0)
  const [notaRedacao, setNotaRedacao] = useState(0)
  const [anotacoes, setAnotacoes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [simuladoSelecionado, setSimuladoSelecionado] = useState<any>(null)
  const [simuladoEditando, setSimuladoEditando] = useState<any>(null)
  const [simuladoParaExcluir, setSimuladoParaExcluir] = useState<any>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Novos estados para bancas e questões
  const [bancaSelecionada, setBancaSelecionada] = useState<BancaType>('')
  const [questoesMarcadas, setQuestoesMarcadas] = useState<{
    [provaId: string]: {
      [questaoNum: number]: {
        acertou: boolean
        motivoErro: MotivoErro
      }
    }
  }>({})
  const [provaExpandida, setProvaExpandida] = useState<string | null>(null)
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null) // "provaId-questaoNum"

  const simuladoTypes = [
    'Poliedro',
    'Bernoulli',
    'SAS',
    'Ari de Sá',
    'Hexag',
    'SOMOS',
    'Prova antiga',
    'Outros'
  ]

  const stats = useMemo(() => {
    if (simulados.length === 0) {
      return { total: 0, mediaGeral: 0, melhorResultado: { nome: '-', pontos: 0 }, ultimoSimulado: null }
    }

    const totalPontos = simulados.reduce((acc, s) => {
      const pontosDia1 = s.dia1 ? s.dia1.linguagens + s.dia1.humanas : 0
      const pontosDia2 = s.dia2 ? s.dia2.natureza + s.dia2.matematica : 0
      return acc + pontosDia1 + pontosDia2
    }, 0)

    const totalQuestoes = simulados.reduce((acc, s) => {
      const questoesDia1 = s.dia1 ? 90 : 0 // 45 + 45
      const questoesDia2 = s.dia2 ? 90 : 0 // 45 + 45
      return acc + questoesDia1 + questoesDia2
    }, 0)

    const mediaGeral = totalQuestoes > 0 ? Math.round((totalPontos / totalQuestoes) * 100) : 0

    const melhor = simulados.reduce((prev, current) => {
      const pontosAtual = (
        (current.dia1 ? current.dia1.linguagens + current.dia1.humanas : 0) +
        (current.dia2 ? current.dia2.natureza + current.dia2.matematica : 0)
      )
      const pontosPrev = (
        (prev.dia1 ? prev.dia1.linguagens + prev.dia1.humanas : 0) +
        (prev.dia2 ? prev.dia2.natureza + prev.dia2.matematica : 0)
      )
      return pontosAtual > pontosPrev ? current : prev
    })

    const melhorPontos = (
      (melhor.dia1 ? melhor.dia1.linguagens + melhor.dia1.humanas : 0) +
      (melhor.dia2 ? melhor.dia2.natureza + melhor.dia2.matematica : 0)
    )

    return {
      total: simulados.length,
      mediaGeral,
      melhorResultado: { nome: melhor.nome, pontos: melhorPontos },
      ultimoSimulado: simulados[0] || null
    }
  }, [simulados])

  // Função para marcar questão
  const marcarQuestao = (provaId: string, questaoNum: number, acertou: boolean) => {
    setQuestoesMarcadas(prev => ({
      ...prev,
      [provaId]: {
        ...prev[provaId],
        [questaoNum]: {
          acertou,
          motivoErro: acertou ? null : prev[provaId]?.[questaoNum]?.motivoErro || null
        }
      }
    }))
  }

  // Função para definir motivo do erro
  const setMotivoErro = (provaId: string, questaoNum: number, motivo: MotivoErro) => {
    setQuestoesMarcadas(prev => ({
      ...prev,
      [provaId]: {
        ...prev[provaId],
        [questaoNum]: {
          ...prev[provaId]?.[questaoNum],
          acertou: false,
          motivoErro: motivo
        }
      }
    }))
  }

  // Calcular estatísticas das questões marcadas
  const getQuestoesStats = () => {
    let acertos = 0
    let erros = 0
    let faltaConteudo = 0
    let faltaAtencao = 0

    Object.values(questoesMarcadas).forEach(prova => {
      Object.values(prova).forEach(questao => {
        if (questao.acertou) {
          acertos++
        } else {
          erros++
          if (questao.motivoErro === 'falta_conteudo') faltaConteudo++
          if (questao.motivoErro === 'falta_atencao') faltaAtencao++
        }
      })
    })

    return { acertos, erros, faltaConteudo, faltaAtencao }
  }

  const handleSubmitSimulado = async () => {
    if (!user) return

    setSalvando(true)
    try {
      const simuladoData: any = {
        tipo: simuladoType,
        nome: simuladoName,
        data: simuladoEditando ? simuladoEditando.data : Timestamp.now()
      }

      // Adicionar banca se selecionada
      if (bancaSelecionada) {
        simuladoData.banca = bancaSelecionada
        simuladoData.questoes = questoesMarcadas
      }

      if (dia1Enabled) {
        simuladoData.dia1 = { linguagens, humanas }
      }

      if (dia2Enabled) {
        simuladoData.dia2 = { natureza: naturezas, matematica }
      }

      if (redacaoEnabled) {
        simuladoData.redacao = notaRedacao
      }

      if (anotacoes) {
        simuladoData.anotacoes = anotacoes
      }

      if (simuladoEditando) {
        // Atualizar simulado existente
        await updateDoc(doc(db, 'users', user.uid, 'simulados', simuladoEditando.id), simuladoData)
      } else {
        // Criar novo simulado
        await addDoc(collection(db, 'users', user.uid, 'simulados'), simuladoData)
      }

      // Reset form
      setShowNewSimulado(false)
      setSimuladoEditando(null)
      setSimuladoType('')
      setSimuladoName('')
      setDia1Enabled(false)
      setDia2Enabled(false)
      setRedacaoEnabled(false)
      setLinguagens(0)
      setHumanas(0)
      setNaturezas(0)
      setMatematica(0)
      setNotaRedacao(0)
      setAnotacoes('')
      setBancaSelecionada('')
      setQuestoesMarcadas({})
      setProvaExpandida(null)
    } catch (error) {
      console.error('Erro ao salvar simulado:', error)
      alert('Erro ao salvar simulado. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleEditarSimulado = (simulado: any) => {
    setSimuladoEditando(simulado)
    setSimuladoType(simulado.tipo)
    setSimuladoName(simulado.nome)
    setDia1Enabled(!!simulado.dia1)
    setDia2Enabled(!!simulado.dia2)
    setRedacaoEnabled(!!simulado.redacao || simulado.redacao === 0)
    setLinguagens(simulado.dia1?.linguagens || 0)
    setHumanas(simulado.dia1?.humanas || 0)
    setNaturezas(simulado.dia2?.natureza || 0)
    setMatematica(simulado.dia2?.matematica || 0)
    setNotaRedacao(simulado.redacao || 0)
    setAnotacoes(simulado.anotacoes || '')
    setBancaSelecionada(simulado.banca || '')
    setQuestoesMarcadas(simulado.questoes || {})
    setShowNewSimulado(true)
  }

  const handleExcluirSimulado = async () => {
    if (!user || !simuladoParaExcluir) return

    setExcluindo(true)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'simulados', simuladoParaExcluir.id))
      setSimuladoParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir simulado:', error)
      alert('Erro ao excluir simulado. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <PageLayout
      title="Simulados"
      description="Realize simulados para testar seus conhecimentos em condições reais"
    >
      <div className="space-y-6">
        {/* Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Estatísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Simulados"
              value={stats.total}
              icon={<GraduationCap className="w-6 h-6" />}
            />
            <StatCard
              title="Média Geral"
              value={`${stats.mediaGeral}%`}
              subtitle="Todas as áreas"
              icon={<TrendingUp className="w-6 h-6" />}
            />
            <StatCard
              title="Melhor Resultado"
              value={stats.melhorResultado.pontos}
              subtitle={stats.melhorResultado.nome}
              icon={<Award className="w-6 h-6" />}
            />
            <StatCard
              title="Último Simulado"
              value={stats.ultimoSimulado ? stats.ultimoSimulado.nome : '-'}
              subtitle={stats.ultimoSimulado ? stats.ultimoSimulado.data.toLocaleDateString('pt-BR') : 'Nenhum simulado'}
              icon={<Clock className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Gráfico de Evolução */}
        <div>
          <SimuladosChart simulados={simulados} />
        </div>

        {/* Gráfico de Análise de Erros */}
        <div>
          <ErrorAnalysisChart simulados={simulados} />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar simulados..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowNewSimulado(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Novo Simulado
          </button>
        </div>

        {/* Lista de Simulados ou Empty State */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando simulados...</p>
          </div>
        ) : simulados.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum simulado cadastrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece cadastrando seu primeiro simulado para acompanhar seu desempenho
            </p>
            <button
              onClick={() => setShowNewSimulado(true)}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Cadastrar Primeiro Simulado
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {simulados
              .filter(s =>
                searchTerm === '' ||
                s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.tipo.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((simulado) => {
                const pontosDia1 = simulado.dia1 ? simulado.dia1.linguagens + simulado.dia1.humanas : 0
                const pontosDia2 = simulado.dia2 ? simulado.dia2.natureza + simulado.dia2.matematica : 0
                const totalPontos = pontosDia1 + pontosDia2
                const questoesDia1 = simulado.dia1 ? 90 : 0
                const questoesDia2 = simulado.dia2 ? 90 : 0
                const totalQuestoes = questoesDia1 + questoesDia2
                const porcentagem = totalQuestoes > 0 ? Math.round((totalPontos / totalQuestoes) * 100) : 0

                return (
                  <div key={simulado.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {simulado.tipo}
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {porcentagem}% - {totalPontos}/{totalQuestoes}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{simulado.nome}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {simulado.dia1 && (
                            <span>• Dia 1: Ling. {simulado.dia1.linguagens}/45 | Hum. {simulado.dia1.humanas}/45</span>
                          )}
                          {simulado.dia2 && (
                            <span>• Dia 2: Nat. {simulado.dia2.natureza}/45 | Mat. {simulado.dia2.matematica}/45</span>
                          )}
                          {(simulado.redacao !== undefined && simulado.redacao !== null) && (
                            <span>• Redação: {simulado.redacao}/1000</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {simulado.data.toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSimuladoSelecionado(simulado)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditarSimulado(simulado)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => setSimuladoParaExcluir(simulado)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* New Simulado Modal */}
      {showNewSimulado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-5xl w-full my-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              {simuladoEditando ? 'Editar Simulado' : 'Novo Simulado'}
            </h3>

            <div className="space-y-6">
              {/* Linha 1: Tipo e Nome em grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Simulado */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Simulado *
                  </label>
                  <select
                    value={simuladoType}
                    onChange={(e) => setSimuladoType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  >
                    <option value="">Selecione o tipo</option>
                    {simuladoTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Nome do Simulado */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome do Simulado *
                  </label>
                  <input
                    type="text"
                    value={simuladoName}
                    onChange={(e) => setSimuladoName(e.target.value)}
                    placeholder="Ex: Simulado ENEM 2024 - 1º Aplicação"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Seleção de Banca */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Banca (opcional - para marcar questões individualmente)
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBancaSelecionada(bancaSelecionada === 'ENEM' ? '' : 'ENEM')
                      setQuestoesMarcadas({})
                      setProvaExpandida(null)
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${bancaSelecionada === 'ENEM'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                  >
                    ENEM (2 provas × 90 questões)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBancaSelecionada(bancaSelecionada === 'UFSM' ? '' : 'UFSM')
                      setQuestoesMarcadas({})
                      setProvaExpandida(null)
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${bancaSelecionada === 'UFSM'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                  >
                    UFSM (3 provas × 40 questões)
                  </button>
                </div>
              </div>

              {/* Grid de Questões por Prova */}
              {bancaSelecionada && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Marcar Questões - {bancaSelecionada}</h4>
                    {(() => {
                      const stats = getQuestoesStats()
                      return (
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600 font-medium">✓ {stats.acertos} acertos</span>
                          <span className="text-red-600 font-medium">✗ {stats.erros} erros</span>
                        </div>
                      )
                    })()}
                  </div>

                  {BANCAS_CONFIG[bancaSelecionada as keyof typeof BANCAS_CONFIG].provas.map((prova) => (
                    <div key={prova.id} className="border border-border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setProvaExpandida(provaExpandida === prova.id ? null : prova.id)}
                        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <span className="font-medium text-foreground">{prova.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {Object.values(questoesMarcadas[prova.id] || {}).filter(q => q.acertou).length}/{prova.questoes} acertos
                          </span>
                          <span className={`transition-transform ${provaExpandida === prova.id ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </button>

                      {provaExpandida === prova.id && (
                        <div className="p-4 bg-background">
                          <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-18 gap-1">
                            {Array.from({ length: prova.questoes }, (_, i) => i + 1).map((num) => {
                              const questao = questoesMarcadas[prova.id]?.[num]
                              const acertou = questao?.acertou
                              const errou = questao?.acertou === false
                              const dropdownKey = `${prova.id}-${num}`
                              const isDropdownOpen = dropdownAberto === dropdownKey

                              return (
                                <div key={num} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (acertou) {
                                        marcarQuestao(prova.id, num, false)
                                        setDropdownAberto(dropdownKey)
                                      } else if (errou) {
                                        // Se já está errado, toggle o dropdown ou remove
                                        if (isDropdownOpen) {
                                          // Remove a marcação
                                          setQuestoesMarcadas(prev => {
                                            const newState = { ...prev }
                                            if (newState[prova.id]) {
                                              delete newState[prova.id][num]
                                            }
                                            return newState
                                          })
                                          setDropdownAberto(null)
                                        } else {
                                          setDropdownAberto(dropdownKey)
                                        }
                                      } else {
                                        marcarQuestao(prova.id, num, true)
                                        setDropdownAberto(null)
                                      }
                                    }}
                                    className={`w-8 h-8 rounded text-xs font-medium transition-all ${acertou
                                      ? 'bg-green-500 text-white'
                                      : errou
                                        ? 'bg-red-500 text-white ring-2 ring-red-300'
                                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                                      }`}
                                  >
                                    {num}
                                  </button>

                                  {/* Menu de motivo do erro */}
                                  {errou && isDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
                                      <p className="text-xs text-muted-foreground mb-2">Motivo do erro:</p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setMotivoErro(prova.id, num, 'falta_conteudo')
                                          setDropdownAberto(null)
                                        }}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${questao?.motivoErro === 'falta_conteudo'
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                          : 'hover:bg-secondary'
                                          }`}
                                      >
                                        <BookX className="w-3 h-3" />
                                        Falta de conteúdo
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setMotivoErro(prova.id, num, 'falta_atencao')
                                          setDropdownAberto(null)
                                        }}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded flex items-center gap-2 ${questao?.motivoErro === 'falta_atencao'
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                          : 'hover:bg-secondary'
                                          }`}
                                      >
                                        <Brain className="w-3 h-3" />
                                        Falta de atenção
                                      </button>
                                      <div className="border-t border-border mt-2 pt-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDropdownAberto(null)
                                          }}
                                          className="w-full text-left px-2 py-1 text-xs text-muted-foreground hover:bg-secondary rounded"
                                        >
                                          Fechar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Legenda */}
                          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded bg-green-500"></span> Acerto
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded bg-red-500"></span> Erro
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded bg-secondary"></span> Não marcado
                            </span>
                            <span className="text-muted-foreground">• 1º clique = Acerto | 2º clique = Erro (abre menu) | 3º clique = Remove</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dias do Simulado */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Dias do Simulado</h4>

                {/* Dia 1 */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dia1Enabled}
                      onChange={(e) => setDia1Enabled(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <span className="font-medium text-foreground">Dia 1</span>
                  </label>

                  {dia1Enabled && (
                    <div className="pl-8 space-y-3">
                      {/* Linguagens */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Linguagens
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="45"
                            value={linguagens}
                            onChange={(e) => setLinguagens(Math.min(45, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-24 px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                          />
                          <span className="text-sm text-muted-foreground">/ 45</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${(linguagens / 45) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-12 text-right">
                            {Math.round((linguagens / 45) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Humanas */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ciências Humanas
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="45"
                            value={humanas}
                            onChange={(e) => setHumanas(Math.min(45, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-24 px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                          />
                          <span className="text-sm text-muted-foreground">/ 45</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${(humanas / 45) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-12 text-right">
                            {Math.round((humanas / 45) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dia 2 */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dia2Enabled}
                      onChange={(e) => setDia2Enabled(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <span className="font-medium text-foreground">Dia 2</span>
                  </label>

                  {dia2Enabled && (
                    <div className="pl-8 space-y-3">
                      {/* Naturezas */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ciências da Natureza
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="45"
                            value={naturezas}
                            onChange={(e) => setNaturezas(Math.min(45, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-24 px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                          />
                          <span className="text-sm text-muted-foreground">/ 45</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${(naturezas / 45) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-12 text-right">
                            {Math.round((naturezas / 45) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Matemática */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Matemática
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="45"
                            value={matematica}
                            onChange={(e) => setMatematica(Math.min(45, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-24 px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                          />
                          <span className="text-sm text-muted-foreground">/ 45</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${(matematica / 45) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-12 text-right">
                            {Math.round((matematica / 45) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Redação */}
                <div className="border border-border rounded-lg p-4 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redacaoEnabled}
                      onChange={(e) => setRedacaoEnabled(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <span className="font-medium text-foreground">Redação</span>
                  </label>

                  {redacaoEnabled && (
                    <div className="pl-8 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nota da Redação
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={notaRedacao}
                            onChange={(e) => setNotaRedacao(Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-24 px-4 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                          />
                          <span className="text-sm text-muted-foreground">/ 1000</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{ width: `${(notaRedacao / 1000) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-12 text-right">
                            {Math.round((notaRedacao / 1000) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Anotações */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Anotações (Opcional)
                </label>
                <textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Adicione observações sobre este simulado..."
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewSimulado(false)
                  setSimuladoEditando(null)
                  setSimuladoType('')
                  setSimuladoName('')
                  setDia1Enabled(false)
                  setDia2Enabled(false)
                  setRedacaoEnabled(false)
                  setLinguagens(0)
                  setHumanas(0)
                  setNaturezas(0)
                  setMatematica(0)
                  setNotaRedacao(0)
                  setAnotacoes('')
                  setBancaSelecionada('')
                  setQuestoesMarcadas({})
                  setProvaExpandida(null)
                }}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitSimulado}
                disabled={!simuladoType || !simuladoName || (!dia1Enabled && !dia2Enabled && !redacaoEnabled && !bancaSelecionada) || salvando}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? 'Salvando...' : (simuladoEditando ? 'Atualizar Simulado' : 'Salvar Simulado')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Simulado */}
      {simuladoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-3xl w-full my-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {simuladoSelecionado.tipo}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    {(() => {
                      const pontosDia1 = simuladoSelecionado.dia1 ? simuladoSelecionado.dia1.linguagens + simuladoSelecionado.dia1.humanas : 0
                      const pontosDia2 = simuladoSelecionado.dia2 ? simuladoSelecionado.dia2.natureza + simuladoSelecionado.dia2.matematica : 0
                      const totalPontos = pontosDia1 + pontosDia2
                      const questoesDia1 = simuladoSelecionado.dia1 ? 90 : 0
                      const questoesDia2 = simuladoSelecionado.dia2 ? 90 : 0
                      const totalQuestoes = questoesDia1 + questoesDia2
                      const porcentagem = totalQuestoes > 0 ? Math.round((totalPontos / totalQuestoes) * 100) : 0
                      return `${porcentagem}% - ${totalPontos}/${totalQuestoes}`
                    })()}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  {simuladoSelecionado.nome}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {simuladoSelecionado.data.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSimuladoSelecionado(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Dia 1 */}
              {simuladoSelecionado.dia1 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Dia 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Linguagens */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">Linguagens</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {simuladoSelecionado.dia1.linguagens}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 45</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(simuladoSelecionado.dia1.linguagens / 45) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {Math.round((simuladoSelecionado.dia1.linguagens / 45) * 100)}%
                      </p>
                    </div>

                    {/* Humanas */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">Ciências Humanas</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {simuladoSelecionado.dia1.humanas}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 45</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(simuladoSelecionado.dia1.humanas / 45) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {Math.round((simuladoSelecionado.dia1.humanas / 45) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dia 2 */}
              {simuladoSelecionado.dia2 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Dia 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Natureza */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">Ciências da Natureza</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {simuladoSelecionado.dia2.natureza}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 45</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(simuladoSelecionado.dia2.natureza / 45) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {Math.round((simuladoSelecionado.dia2.natureza / 45) * 100)}%
                      </p>
                    </div>

                    {/* Matemática */}
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">Matemática</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-foreground">
                          {simuladoSelecionado.dia2.matematica}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 45</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(simuladoSelecionado.dia2.matematica / 45) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {Math.round((simuladoSelecionado.dia2.matematica / 45) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Redação */}
              {(simuladoSelecionado.redacao !== undefined && simuladoSelecionado.redacao !== null) && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Redação</h4>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Nota da Redação</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-foreground">
                        {simuladoSelecionado.redacao}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 1000</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${(simuladoSelecionado.redacao / 1000) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      {Math.round((simuladoSelecionado.redacao / 1000) * 100)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Anotações */}
              {simuladoSelecionado.anotacoes && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Anotações</h4>
                  <div className="bg-secondary/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {simuladoSelecionado.anotacoes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSimuladoSelecionado(null)}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {simuladoParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Excluir Simulado?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir o simulado <strong className="text-foreground">"{simuladoParaExcluir.nome}"</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSimuladoParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirSimulado}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {excluindo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
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
