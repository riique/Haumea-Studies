'use client'

import { PageLayout } from '@/components/PageLayout'
import {
  Plus,
  Search,
  FileText,
  Building2,
  TrendingUp,
  Calendar,
  Eye,
  X,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRedacoes, type Redacao } from '@/hooks/useFirestoreData'
import { collection, addDoc, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
}

type CompetenciaKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
type SupportedBanca = 'ENEM' | 'UFSC'
type CompetenciasForm = Record<CompetenciaKey, string>

interface CompetenciaConfig {
  banca: SupportedBanca
  title: string
  chartTitle: string
  keys: CompetenciaKey[]
  labels: Record<CompetenciaKey, string>
  chipLabels: Record<CompetenciaKey, string>
  helperText: string
  inputHint: string
  maxValue?: number
  colors: Record<CompetenciaKey, string>
}

const EMPTY_COMPETENCIAS: CompetenciasForm = {
  c1: '',
  c2: '',
  c3: '',
  c4: '',
  c5: ''
}

const COMPETENCIA_CONFIGS: Record<SupportedBanca, CompetenciaConfig> = {
  ENEM: {
    banca: 'ENEM',
    title: 'Competencias do ENEM',
    chartTitle: 'Evolucao por competencia - ENEM',
    keys: ['c1', 'c2', 'c3', 'c4', 'c5'],
    labels: {
      c1: 'C1 - Dominio da norma padrao',
      c2: 'C2 - Compreensao do tema',
      c3: 'C3 - Selecao e organizacao dos argumentos',
      c4: 'C4 - Coesao textual',
      c5: 'C5 - Proposta de intervencao'
    },
    chipLabels: { c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4', c5: 'C5' },
    helperText: 'Voce pode preencher so a nota total ou detalhar C1 a C5.',
    inputHint: '0 a 200 por competencia',
    maxValue: 200,
    colors: {
      c1: '#2563eb',
      c2: '#16a34a',
      c3: '#f59e0b',
      c4: '#ef4444',
      c5: '#7c3aed'
    }
  },
  UFSC: {
    banca: 'UFSC',
    title: 'Competencias da UFSC',
    chartTitle: 'Evolucao por competencia - UFSC',
    keys: ['c1', 'c2', 'c3', 'c4'],
    labels: {
      c1: '1 - Adequacao ao Tema e ao Genero',
      c2: '2 - Norma Padrao da Lingua',
      c3: '3 - Coesao e coerencia',
      c4: '4 - Informatividade e Argumentacao',
      c5: ''
    },
    chipLabels: { c1: '1', c2: '2', c3: '3', c4: '4', c5: '' },
    helperText: 'Voce pode preencher so a nota total ou detalhar os 4 criterios da UFSC.',
    inputHint: 'Preencha os valores conforme sua correcao',
    colors: {
      c1: '#0891b2',
      c2: '#4f46e5',
      c3: '#ea580c',
      c4: '#dc2626',
      c5: '#64748b'
    }
  }
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">{icon}</div>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

function getCompetenciaConfig(banca: string): CompetenciaConfig | null {
  if (banca === 'ENEM' || banca === 'UFSC') return COMPETENCIA_CONFIGS[banca]
  return null
}

function getCompetenciasFromRedacao(redacao: Redacao): CompetenciasForm {
  return {
    c1: redacao.competencias?.c1?.toString() || '',
    c2: redacao.competencias?.c2?.toString() || '',
    c3: redacao.competencias?.c3?.toString() || '',
    c4: redacao.competencias?.c4?.toString() || '',
    c5: redacao.competencias?.c5?.toString() || ''
  }
}

function hasCompetencias(redacao: Redacao, config: CompetenciaConfig | null): boolean {
  if (!config || !redacao.competencias) return false
  return config.keys.some((key) => redacao.competencias?.[key] !== undefined)
}

function CompetencyEvolutionCard({ config, redacoes }: { config: CompetenciaConfig; redacoes: Redacao[] }) {
  const chartData = useMemo(() => {
    return [...redacoes]
      .filter((redacao) => hasCompetencias(redacao, config))
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .map((redacao, index) => {
        const point: Record<string, string | number> = {
          nome: `${index + 1}`,
          data: redacao.data.toLocaleDateString('pt-BR'),
          titulo: redacao.titulo
        }

        config.keys.forEach((key) => {
          point[key] = redacao.competencias?.[key] ?? 0
        })

        return point
      })
  }, [config, redacoes])

  const ultimosValores = useMemo(() => {
    if (chartData.length === 0) return []
    const ultimo = chartData[chartData.length - 1]
    return config.keys.map((key) => ({
      key,
      label: config.chipLabels[key],
      value: Number(ultimo[key] || 0)
    }))
  }, [chartData, config])

  if (chartData.length === 0) return null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-semibold text-foreground mb-1">Redacao {label}</p>
        <p className="text-xs text-muted-foreground mb-2">{data.data}</p>
        <p className="text-sm text-foreground mb-2">{data.titulo}</p>
        <div className="space-y-1">
          {config.keys.map((key) => (
            <p key={key} className="text-xs text-muted-foreground">
              {config.chipLabels[key]}: <span className="text-foreground font-medium">{data[key]}</span>
            </p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-lg font-semibold text-foreground">{config.chartTitle}</h3>
        <p className="text-sm text-muted-foreground">Acompanhe como cada competencia evolui ao longo das suas redacoes.</p>
      </div>

      <div className={`grid gap-3 mb-6 ${config.keys.length === 5 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
        {ultimosValores.map((item) => (
          <div key={item.key} className="bg-secondary/40 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="nome" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={config.maxValue ? [0, config.maxValue] : undefined} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {config.keys.map((key) => (
              <Line key={key} type="monotone" dataKey={key} name={config.chipLabels[key]} stroke={config.colors[key]} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function RedacoesPage() {
  const { user } = useAuth()
  const { redacoes, loading } = useRedacoes()
  const [showNewRedacao, setShowNewRedacao] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [banca, setBanca] = useState('')
  const [tema, setTema] = useState('')
  const [nota, setNota] = useState('')
  const [competencias, setCompetencias] = useState<CompetenciasForm>(EMPTY_COMPETENCIAS)
  const [conteudo, setConteudo] = useState('')
  const [anotacoes, setAnotacoes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [redacaoSelecionada, setRedacaoSelecionada] = useState<Redacao | null>(null)
  const [redacaoEditando, setRedacaoEditando] = useState<Redacao | null>(null)
  const [redacaoParaExcluir, setRedacaoParaExcluir] = useState<Redacao | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const bancas = ['TODAS', 'ENEM', 'FUVEST', 'UNICAMP', 'UNESP', 'VUNESP', 'UFSC', 'UFRGS', 'UFSM', 'UFRJ', 'UERJ', 'UECE', 'OUTROS']

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const redacoesDoMes = redacoes.filter((r) => r.data >= thisMonth).length
    const bancasUnicas = new Set(redacoes.map((r) => r.banca)).size
    const notaMedia = redacoes.length > 0 ? Math.round(redacoes.reduce((acc, r) => acc + r.nota, 0) / redacoes.length) : 0

    return { total: redacoes.length, bancas: bancasUnicas, notaMedia, redacoesDoMes }
  }, [redacoes])

  const competenciaConfig = getCompetenciaConfig(banca)
  const activeCompetenciaKeys = competenciaConfig?.keys || []
  const algumaCompetenciaPreenchida = activeCompetenciaKeys.some((key) => competencias[key] !== '')
  const todasCompetenciasPreenchidas = activeCompetenciaKeys.length > 0 && activeCompetenciaKeys.every((key) => competencias[key] !== '')
  const notaCalculadaCompetencias = todasCompetenciasPreenchidas && competenciaConfig ? activeCompetenciaKeys.reduce((acc, key) => acc + Number(competencias[key]), 0) : null
  const notaFinalFormulario = notaCalculadaCompetencias ?? Number(nota || 0)
  const notaInformada = nota !== '' || notaCalculadaCompetencias !== null

  const filteredRedacoes = useMemo(() => {
    return redacoes.filter((r) => searchTerm === '' || r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || r.tema.toLowerCase().includes(searchTerm.toLowerCase()) || r.banca.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [redacoes, searchTerm])

  const evolutionConfigs = useMemo(() => {
    return (Object.keys(COMPETENCIA_CONFIGS) as SupportedBanca[])
      .map((key) => COMPETENCIA_CONFIGS[key])
      .filter((config) => redacoes.some((redacao) => hasCompetencias(redacao, config)))
  }, [redacoes])

  const resetForm = () => {
    setShowNewRedacao(false)
    setRedacaoEditando(null)
    setTitulo('')
    setBanca('')
    setTema('')
    setNota('')
    setCompetencias(EMPTY_COMPETENCIAS)
    setConteudo('')
    setAnotacoes('')
  }

  const openNewForm = () => {
    setRedacaoSelecionada(null)
    setShowNewRedacao(true)
    setRedacaoEditando(null)
    setTitulo('')
    setBanca('')
    setTema('')
    setNota('')
    setCompetencias(EMPTY_COMPETENCIAS)
    setConteudo('')
    setAnotacoes('')
  }

  const handleEditarRedacao = (redacao: Redacao) => {
    setRedacaoEditando(redacao)
    setTitulo(redacao.titulo)
    setBanca(redacao.banca)
    setTema(redacao.tema)
    setNota(redacao.nota.toString())
    setCompetencias(getCompetenciasFromRedacao(redacao))
    setConteudo(redacao.conteudo)
    setAnotacoes(redacao.anotacoes || '')
    setShowNewRedacao(true)
  }

  const handleExcluirRedacao = async () => {
    if (!user || !redacaoParaExcluir) return
    setExcluindo(true)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'redacoes', redacaoParaExcluir.id))
      setRedacaoParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir redacao:', error)
      alert('Erro ao excluir redacao. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleSubmitRedacao = async () => {
    if (!user) return

    if (competenciaConfig && algumaCompetenciaPreenchida && !todasCompetenciasPreenchidas) {
      alert(`Preencha todas as competencias de ${banca} ou deixe todas em branco.`)
      return
    }

    setSalvando(true)
    try {
      const redacaoData = {
        titulo,
        banca,
        tema,
        nota: notaFinalFormulario,
        ...(competenciaConfig && todasCompetenciasPreenchidas
          ? {
              competencias: activeCompetenciaKeys.reduce((acc, key) => {
                acc[key] = Number(competencias[key])
                return acc
              }, {} as Partial<Record<CompetenciaKey, number>>)
            }
          : { competencias: null }),
        conteudo,
        anotacoes,
        data: redacaoEditando ? redacaoEditando.data : Timestamp.now()
      }

      if (redacaoEditando) {
        await updateDoc(doc(db, 'users', user.uid, 'redacoes', redacaoEditando.id), redacaoData)
      } else {
        await addDoc(collection(db, 'users', user.uid, 'redacoes'), redacaoData)
      }

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar redacao:', error)
      alert('Erro ao salvar redacao. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <PageLayout title="Redacoes" description="Escreva e acompanhe suas redacoes para melhorar sua escrita">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Estatisticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total de Redacoes" value={stats.total} icon={<FileText className="w-6 h-6" />} />
            <StatCard title="Bancas Diferentes" value={stats.bancas} subtitle="Instituicoes praticadas" icon={<Building2 className="w-6 h-6" />} />
            <StatCard title="Nota Media" value={stats.notaMedia} subtitle="Media geral" icon={<TrendingUp className="w-6 h-6" />} />
            <StatCard title="Redacoes no Mes" value={stats.redacoesDoMes} subtitle="Este mes" icon={<Calendar className="w-6 h-6" />} />
          </div>
        </div>

        {evolutionConfigs.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {evolutionConfigs.map((config) => (
              <CompetencyEvolutionCard key={config.banca} config={config} redacoes={redacoes} />
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar redacoes..." className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
          </div>
          <button onClick={openNewForm} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" />
            Nova Redacao
          </button>
        </div>

        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando redacoes...</p>
          </div>
        ) : redacoes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma redacao cadastrada</h3>
            <p className="text-muted-foreground mb-6">Comece escrevendo sua primeira redacao e acompanhe seu progresso</p>
            <button onClick={openNewForm} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">Escrever Primeira Redacao</button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRedacoes.map((redacao) => {
              const redacaoConfig = getCompetenciaConfig(redacao.banca)

              return (
                <div key={redacao.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">{redacao.banca}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Nota: {redacao.nota}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{redacao.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{redacao.tema}</p>
                      {hasCompetencias(redacao, redacaoConfig) && redacaoConfig && (
                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          {redacaoConfig.keys.filter((key) => redacao.competencias?.[key] !== undefined).map((key) => (
                            <span key={key} className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md">{redacaoConfig.chipLabels[key]}: {redacao.competencias?.[key]}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{redacao.data.toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(redacao.conteudo.split(/\s+/).filter((w) => w.length > 0).length)} palavras</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRedacaoSelecionada(redacao)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"><Eye className="w-4 h-4" />Ver</button>
                      <button onClick={() => handleEditarRedacao(redacao)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"><Pencil className="w-4 h-4" />Editar</button>
                      <button onClick={() => setRedacaoParaExcluir(redacao)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" />Excluir</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {redacaoParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Excluir Redacao?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Tem certeza que deseja excluir <strong className="text-foreground">"{redacaoParaExcluir.titulo}"</strong>?</p>
                <p className="text-sm text-muted-foreground mt-2">Esta acao nao pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRedacaoParaExcluir(null)} disabled={excluindo} className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancelar</button>
              <button onClick={handleExcluirRedacao} disabled={excluindo} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {excluindo ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Excluindo...</> : <><Trash2 className="w-4 h-4" />Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {redacaoSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl w-full my-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-foreground mb-2">{redacaoSelecionada.titulo}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">{redacaoSelecionada.banca}</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Nota: {redacaoSelecionada.nota}</span>
                  <span className="text-sm text-muted-foreground">{redacaoSelecionada.data.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <button onClick={() => setRedacaoSelecionada(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Tema da Redacao</h4>
                <p className="text-muted-foreground">{redacaoSelecionada.tema}</p>
              </div>

              {(() => {
                const redacaoConfig = getCompetenciaConfig(redacaoSelecionada.banca)
                if (!hasCompetencias(redacaoSelecionada, redacaoConfig) || !redacaoConfig) return null

                return (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">{redacaoConfig.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      {redacaoConfig.keys.filter((key) => redacaoSelecionada.competencias?.[key] !== undefined).map((key) => (
                        <div key={key} className="bg-secondary/50 border border-border rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-1">{redacaoConfig.labels[key]}</p>
                          <p className="text-lg font-semibold text-foreground">{redacaoSelecionada.competencias?.[key]}{redacaoConfig.maxValue ? `/${redacaoConfig.maxValue}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Conteudo</h4>
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-foreground">{redacaoSelecionada.conteudo}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">{redacaoSelecionada.conteudo.length} caracteres • {Math.round(redacaoSelecionada.conteudo.split(/\s+/).filter((w: string) => w.length > 0).length)} palavras</p>
                  </div>
                </div>
              </div>

              {redacaoSelecionada.anotacoes && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Anotacoes</h4>
                  <div className="bg-secondary/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{redacaoSelecionada.anotacoes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setRedacaoSelecionada(null)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showNewRedacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-6 max-w-3xl w-full my-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">{redacaoEditando ? 'Editar Redacao' : 'Nova Redacao'}</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Titulo da Redacao *</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Redacao ENEM 2024 - Educacao Ambiental" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Banca Examinadora *</label>
                  <select value={banca} onChange={(e) => { setBanca(e.target.value); setCompetencias(EMPTY_COMPETENCIAS) }} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all">
                    <option value="">Selecione a banca</option>
                    {bancas.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nota Obtida *</label>
                  <input type="number" value={notaCalculadaCompetencias ?? nota} onChange={(e) => setNota(e.target.value)} placeholder={competenciaConfig ? 'Preencha a nota total ou use as competencias' : 'Ex: 880'} min="0" readOnly={Boolean(notaCalculadaCompetencias)} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
                  {competenciaConfig && <p className="text-xs text-muted-foreground mt-2">{todasCompetenciasPreenchidas ? 'Nota total calculada automaticamente a partir das competencias.' : competenciaConfig.helperText}</p>}
                </div>
              </div>

              {competenciaConfig && (
                <div>
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <label className="block text-sm font-medium text-foreground">{competenciaConfig.title}</label>
                    <span className="text-xs text-muted-foreground">{competenciaConfig.inputHint}</span>
                  </div>
                  <div className={`grid gap-4 ${competenciaConfig.keys.length === 5 ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
                    {competenciaConfig.keys.map((key) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">{competenciaConfig.labels[key]}</label>
                        <input type="number" value={competencias[key]} onChange={(e) => setCompetencias((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="0" min="0" max={competenciaConfig.maxValue} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tema da Redacao *</label>
                <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: A importancia da educacao ambiental no Brasil contemporaneo" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Conteudo da Redacao *</label>
                <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Digite ou cole o texto da sua redacao aqui..." rows={10} className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none font-serif text-sm leading-relaxed" />
                <p className="text-xs text-muted-foreground mt-2">{conteudo.length} caracteres • {Math.round(conteudo.split(/\s+/).filter((w) => w.length > 0).length)} palavras</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Anotacoes (Opcional)</label>
                <textarea value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)} placeholder="Adicione observacoes sobre esta redacao: dificuldades, aprendizados, feedback recebido..." rows={4} className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button onClick={handleSubmitRedacao} disabled={!titulo || !banca || !tema || !notaInformada || !conteudo || salvando} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{salvando ? 'Salvando...' : redacaoEditando ? 'Atualizar Redacao' : 'Salvar Redacao'}</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

