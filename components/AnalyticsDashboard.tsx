'use client'

import { PerformanceRadarChart } from './analytics/RadarChart'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { motion } from 'framer-motion'

interface AnalyticsDashboardProps {
  questoes: any[]
  materias: any[]
  simulados: any[]
}

export function AnalyticsDashboard({ 
  questoes, 
  materias, 
  simulados 
}: AnalyticsDashboardProps) {
  const {
    performanceByMateria,
    performanceTrend,
    insights,
    stats
  } = useAnalytics(questoes, materias, simulados)

  if (stats.totalRespondidas === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-12 text-center"
      >
        <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Dados insuficientes
        </h3>
        <p className="text-muted-foreground">
          Responda algumas questões para visualizar sua análise de desempenho.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <p className="text-sm text-muted-foreground mb-2">Taxa Geral de Acerto</p>
          <p className="text-3xl font-bold text-primary">{stats.taxaGeralAcerto}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalAcertos}/{stats.totalRespondidas} questões
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <p className="text-sm text-muted-foreground mb-2">Melhor Matéria</p>
          <p className="text-xl font-bold text-green-600">
            {stats.melhorMateria?.materia || '-'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.melhorMateria?.taxaAcerto}% de acerto
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <p className="text-sm text-muted-foreground mb-2">Precisa Atenção</p>
          <p className="text-xl font-bold text-orange-600">
            {stats.piorMateria?.materia || '-'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.piorMateria?.taxaAcerto}% de acerto
          </p>
        </motion.div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Insights e Recomendações
          </h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  insight.type === 'warning' ? 'bg-orange-50 dark:bg-orange-950/30' :
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-950/30' :
                  'bg-blue-50 dark:bg-blue-950/30'
                }`}
              >
                {insight.type === 'warning' && (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {insight.type === 'info' && (
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
                {insight.action && (
                  <button className="text-sm font-medium text-primary hover:underline flex-shrink-0">
                    {insight.action}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Radar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Performance por Matéria
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Visualize seu desempenho nas principais matérias estudadas
        </p>
        <PerformanceRadarChart data={performanceByMateria} />
      </motion.div>

      {/* Tendência Temporal */}
      {performanceTrend.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Evolução nas Últimas Semanas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceTrend.map((point, index) => {
              const isGrowing = index > 0 && point.taxaAcerto > performanceTrend[index - 1].taxaAcerto
              const isDecreasing = index > 0 && point.taxaAcerto < performanceTrend[index - 1].taxaAcerto
              
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-secondary/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{point.data}</p>
                    {isGrowing && <TrendingUp className="w-3 h-3 text-green-600" />}
                    {isDecreasing && <TrendingDown className="w-3 h-3 text-red-600" />}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{point.taxaAcerto}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {point.acertos + point.erros} questões
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
