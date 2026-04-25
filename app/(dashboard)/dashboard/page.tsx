"use client"

import Link from 'next/link'
import {
  FileQuestion,
  FileText,
  GraduationCap,
  Target,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  Coins,
  BookOpen,
  Library,
  BookMarked
} from 'lucide-react'
import { useQuestoes, useRedacoes, useSimulados, useMaterias, useCategorias } from '@/hooks/useFirestoreData'
import { useAuth } from '@/contexts/AuthContext'
import { useMemo, useState } from 'react'
import PerformanceChart from '@/components/PerformanceChart'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { useReadings } from '@/hooks/useReadings'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { useMissions } from '@/hooks/useMissions'
import { useExams } from '@/hooks/useExams'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AddExamModal from '@/components/AddExamModal'
import ExamCountdown from '@/components/ExamCountdown'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
  icon: React.ReactNode
}

function ActivityItem({ title, description, time, icon }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-secondary transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <div className="text-primary">
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  )
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Dashboard() {
  const { userData } = useAuth()
  const { questoes, loading: loadingQuestoes } = useQuestoes()
  const { redacoes, loading: loadingRedacoes } = useRedacoes()
  const { simulados, loading: loadingSimulados } = useSimulados()
  const { materias, loading: loadingMaterias } = useMaterias()
  const { categorias, loading: loadingCategorias } = useCategorias()
  const { readings, loading: loadingReadings } = useReadings()
  const { entries, loading: loadingJournal } = useJournalEntries()
  const { exams, loading: loadingExams, addExam, deleteExam } = useExams()
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false)
  const today = new Date()
  const monday = getMonday(today)
  const weekStartDate = formatDate(monday)
  const { missions, loading: loadingMissions } = useMissions(weekStartDate)

  // Calcular estatísticas reais
  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Questões do mês
    const questoesDoMes = questoes.filter(q => q.data >= thisMonth).length

    // Redações do mês
    const redacoesDoMes = redacoes.filter(r => r.data >= thisMonth).length

    // Simulados do mês
    const simuladosDoMes = simulados.filter(s => s.data >= thisMonth).length

    // Taxa de acerto (questões respondidas)
    const questoesRespondidas = questoes.filter(q => q.respondida)
    const questoesAcertadas = questoesRespondidas.filter(q => q.acertou)
    const taxaAcerto = questoesRespondidas.length > 0
      ? Math.round((questoesAcertadas.length / questoesRespondidas.length) * 100)
      : 0

    return {
      questoesDoMes,
      redacoesDoMes,
      simuladosDoMes,
      taxaAcerto,
      totalQuestoes: questoes.length,
      totalRedacoes: redacoes.length,
      totalSimulados: simulados.length
    }
  }, [questoes, redacoes, simulados])

  const missionStats = useMemo(() => {
    const total = missions.length
    const completed = missions.filter(m => m.status === 'concluido').length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, percentage }
  }, [missions])

  const todayMissions = useMemo(() => {
    const dayMap: Record<number, string> = {
      0: 'domingo',
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado'
    }

    const key = dayMap[today.getDay()]
    return missions.filter(mission => mission.dayOfWeek === key)
  }, [missions, today])

  const readingStats = useMemo(() => {
    const total = readings.length
    const naoLidos = readings.filter(r => r.status === 'nao_lido').length
    const lendo = readings.filter(r => r.status === 'lendo').length
    const concluidos = readings.filter(r => r.status === 'concluido').length
    const percentage = total > 0 ? Math.round((concluidos / total) * 100) : 0

    return { total, naoLidos, lendo, concluidos, percentage }
  }, [readings])

  const latestEntry = entries[0]
  const latestRedacao = redacoes[0]
  const todayLabel = format(today, "d 'de' MMMM (EEEE)", { locale: ptBR })

  // Atividades recentes (combinar tudo e ordenar por data)
  const atividadesRecentes = useMemo(() => {
    const atividades: Array<{
      tipo: 'questao' | 'redacao' | 'simulado'
      titulo: string
      descricao: string
      data: Date
    }> = []

    // Adicionar questões
    questoes.slice(0, 5).forEach(q => {
      atividades.push({
        tipo: 'questao',
        titulo: `Questão de ${q.materia}`,
        descricao: q.assunto,
        data: q.data
      })
    })

    // Adicionar redações
    redacoes.slice(0, 5).forEach(r => {
      atividades.push({
        tipo: 'redacao',
        titulo: r.titulo,
        descricao: `${r.banca} - Nota: ${r.nota}`,
        data: r.data
      })
    })

    // Adicionar simulados
    simulados.slice(0, 5).forEach(s => {
      atividades.push({
        tipo: 'simulado',
        titulo: s.nome,
        descricao: s.tipo,
        data: s.data
      })
    })

    // Ordenar por data (mais recente primeiro)
    return atividades.sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 4)
  }, [questoes, redacoes, simulados])

  // Função para formatar tempo relativo
  const formatarTempoRelativo = (data: Date) => {
    const agora = new Date()
    const diff = agora.getTime() - data.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)

    if (minutos < 60) return `${minutos}min atrás`
    if (horas < 24) return `${horas}h atrás`
    if (dias === 1) return '1 dia atrás'
    return `${dias} dias atrás`
  }

  const loading =
    loadingQuestoes ||
    loadingRedacoes ||
    loadingSimulados ||
    loadingMaterias ||
    loadingCategorias ||
    loadingReadings ||
    loadingJournal ||
    loadingMissions ||
    loadingExams

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo do seu progresso nos estudos.
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Credits Card */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Créditos de Correção
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Disponíveis para correção de redações
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-primary/30 rounded-lg px-6 py-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{userData?.credits ?? 0}</p>
                  <p className="text-xs text-muted-foreground">créditos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exams Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Vestibulares</h2>
              </div>
              <button
                onClick={() => setIsAddExamModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Adicionar
              </button>
            </div>

            {exams.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {exams.map((exam) => (
                  <ExamCountdown
                    key={exam.id}
                    exam={exam}
                    onDelete={deleteExam}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum vestibular cadastrado</h3>
                <p className="text-muted-foreground mb-6">
                  Adicione seus vestibulares para acompanhar o tempo restante e seu progresso.
                </p>
                <button
                  onClick={() => setIsAddExamModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  + Adicionar Vestibular
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/missoes"
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Planejar semana</p>
                <p className="text-xs text-muted-foreground">Abrir quadro de missões</p>
              </div>
            </Link>
            <Link
              href="/correcao-redacao"
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Nova redação</p>
                <p className="text-xs text-muted-foreground">Enviar para correção</p>
              </div>
            </Link>
            <Link
              href="/leituras"
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Leituras obrigatórias</p>
                <p className="text-xs text-muted-foreground">Gerenciar livros e dossiês</p>
              </div>
            </Link>
            <Link
              href="/diario"
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookMarked className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Diário de bordo</p>
                <p className="text-xs text-muted-foreground">Registrar reflexões do dia</p>
              </div>
            </Link>
          </div>

          {/* Stats Grid */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Estatísticas Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Questões Respondidas"
                value={stats.questoesDoMes}
                subtitle="Este mês"
                icon={<FileQuestion className="w-6 h-6" />}
              />
              <StatCard
                title="Redações Escritas"
                value={stats.redacoesDoMes}
                subtitle="Este mês"
                icon={<FileText className="w-6 h-6" />}
              />
              <StatCard
                title="Simulados Realizados"
                value={stats.simuladosDoMes}
                subtitle="Este mês"
                icon={<GraduationCap className="w-6 h-6" />}
              />
              <StatCard
                title="Taxa de Acerto"
                value={`${stats.taxaAcerto}%`}
                subtitle="Média geral"
                icon={<Target className="w-6 h-6" />}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hoje</p>
                  <h2 className="text-lg font-semibold text-foreground mt-1">{todayLabel}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {missionStats.total > 0
                      ? `${todayMissions.length} missão${todayMissions.length === 1 ? '' : 's'} para hoje`
                      : 'Comece planejando suas missões da semana.'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                {todayMissions.slice(0, 3).map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-2">{mission.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {mission.status === 'concluido' ? 'Concluída' : 'Pendente'}
                    </span>
                  </div>
                ))}
                {todayMissions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma missão cadastrada para hoje.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/missoes"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver quadro de missões
                </Link>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Leituras obrigatórias</p>
                  <h2 className="text-lg font-semibold text-foreground mt-1">
                    {readingStats.total} livro{readingStats.total === 1 ? '' : 's'}
                  </h2>
                  {readingStats.total > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {readingStats.concluidos} concluído{readingStats.concluidos === 1 ? '' : 's'} ·{' '}
                      {readingStats.lendo} em andamento
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Library className="w-5 h-5 text-primary" />
                </div>
              </div>
              {readingStats.total === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma leitura cadastrada ainda. Cadastre seus livros obrigatórios.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso geral</span>
                    <span className="font-medium">{readingStats.percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readingStats.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4">
                <Link
                  href="/leituras"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ir para leituras
                </Link>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reflexões & redações</p>
                  <h2 className="text-lg font-semibold text-foreground mt-1">
                    {entries.length} entrada{entries.length === 1 ? '' : 's'} no diário
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {redacoes.length} redação{redacoes.length === 1 ? '' : 's'} cadastrada{redacoes.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {latestEntry && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Última entrada do diário
                    </p>
                    <p className="font-medium truncate">{latestEntry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(latestEntry.updatedAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {latestRedacao && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Última redação
                    </p>
                    <p className="font-medium truncate">{latestRedacao.titulo}</p>
                    <p className="text-xs text-muted-foreground">Nota {latestRedacao.nota}</p>
                  </div>
                )}
                {!latestEntry && !latestRedacao && (
                  <p className="text-sm text-muted-foreground">
                    Comece registrando suas reflexões e escrevendo redações.
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Link
                  href="/diario"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Abrir diário
                </Link>
                <Link
                  href="/redacoes"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver redações
                </Link>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div>
            <PerformanceChart
              questoes={questoes}
              materias={materias}
              categorias={categorias}
            />
          </div>

          {/* Analytics Dashboard */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Análise Detalhada de Desempenho
            </h2>
            <AnalyticsDashboard
              questoes={questoes}
              materias={materias}
              simulados={simulados}
            />
          </div>

          {/* Additional Metrics */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Totais</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total de Questões"
                value={stats.totalQuestoes}
                subtitle="Todas as questões cadastradas"
                icon={<FileQuestion className="w-6 h-6" />}
              />
              <StatCard
                title="Total de Redações"
                value={stats.totalRedacoes}
                subtitle="Todas as redações escritas"
                icon={<FileText className="w-6 h-6" />}
              />
              <StatCard
                title="Total de Simulados"
                value={stats.totalSimulados}
                subtitle="Todos os simulados realizados"
                icon={<GraduationCap className="w-6 h-6" />}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h2>
            {atividadesRecentes.length > 0 ? (
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {atividadesRecentes.map((atividade, index) => (
                  <ActivityItem
                    key={index}
                    title={atividade.titulo}
                    description={atividade.descricao}
                    time={formatarTempoRelativo(atividade.data)}
                    icon={
                      atividade.tipo === 'questao' ? <FileQuestion className="w-5 h-5" /> :
                        atividade.tipo === 'redacao' ? <FileText className="w-5 h-5" /> :
                          <GraduationCap className="w-5 h-5" />
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma atividade ainda</h3>
                <p className="text-muted-foreground">
                  Comece adicionando questões, redações ou simulados para ver suas atividades aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onAdd={addExam}
      />
    </div>
  )
}
