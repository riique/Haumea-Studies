'use client'

import { useMemo } from 'react'
import { Questao, Materia, Simulado } from '@/hooks/useFirestoreData'

export interface PerformanceByMateria {
  materia: string
  total: number
  respondidas: number
  acertos: number
  erros: number
  taxaAcerto: number
}

export interface TrendPoint {
  data: string
  acertos: number
  erros: number
  taxaAcerto: number
}

export interface Insight {
  type: 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: string
}

export function useAnalytics(
  questoes: Questao[],
  materias: Materia[],
  simulados: Simulado[]
) {
  // Performance por matéria (para radar chart)
  const performanceByMateria = useMemo((): PerformanceByMateria[] => {
    return materias
      .map(materia => {
        const questoesDaMateria = questoes.filter(q => q.materia === materia.nome)
        const respondidas = questoesDaMateria.filter(q => q.respondida)
        const acertos = respondidas.filter(q => q.acertou).length
        const erros = respondidas.length - acertos
        const taxaAcerto = respondidas.length > 0 
          ? Math.round((acertos / respondidas.length) * 100)
          : 0

        return {
          materia: materia.nome,
          total: questoesDaMateria.length,
          respondidas: respondidas.length,
          acertos,
          erros,
          taxaAcerto
        }
      })
      .filter(p => p.respondidas > 0) // Apenas matérias com questões respondidas
      .sort((a, b) => b.taxaAcerto - a.taxaAcerto) // Ordenar por taxa de acerto
  }, [questoes, materias])

  // Tendência temporal (últimas 4 semanas)
  const performanceTrend = useMemo((): TrendPoint[] => {
    const hoje = new Date()
    const quatroSemanasAtras = new Date(hoje)
    quatroSemanasAtras.setDate(hoje.getDate() - 28)

    const questoesRecentes = questoes.filter(
      q => q.respondida && q.data >= quatroSemanasAtras
    )

    // Agrupar por semana
    const semanas: { [key: string]: { acertos: number; erros: number } } = {}
    
    questoesRecentes.forEach(q => {
      const semana = Math.floor(
        (hoje.getTime() - q.data.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      const chave = `Semana ${4 - semana}`
      
      if (!semanas[chave]) {
        semanas[chave] = { acertos: 0, erros: 0 }
      }
      
      if (q.acertou) {
        semanas[chave].acertos++
      } else {
        semanas[chave].erros++
      }
    })

    return Object.entries(semanas).map(([data, stats]) => ({
      data,
      acertos: stats.acertos,
      erros: stats.erros,
      taxaAcerto: Math.round(
        (stats.acertos / (stats.acertos + stats.erros)) * 100
      )
    }))
  }, [questoes])

  // Heatmap de dias da semana vs horário
  const heatmapData = useMemo(() => {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const periodos = ['Manhã', 'Tarde', 'Noite', 'Madrugada']
    
    // Matriz de performance
    const matriz = diasSemana.map(dia => ({
      dia,
      periodos: periodos.map(periodo => ({
        periodo,
        acertos: 0,
        total: 0,
        taxa: 0
      }))
    }))

    questoes.filter(q => q.respondida).forEach(q => {
      const diaSemana = q.data.getDay()
      const hora = q.data.getHours()
      
      let periodoIdx
      if (hora >= 6 && hora < 12) periodoIdx = 0 // Manhã
      else if (hora >= 12 && hora < 18) periodoIdx = 1 // Tarde
      else if (hora >= 18 && hora < 24) periodoIdx = 2 // Noite
      else periodoIdx = 3 // Madrugada
      
      matriz[diaSemana].periodos[periodoIdx].total++
      if (q.acertou) {
        matriz[diaSemana].periodos[periodoIdx].acertos++
      }
    })

    // Calcular taxas
    matriz.forEach(dia => {
      dia.periodos.forEach(periodo => {
        if (periodo.total > 0) {
          periodo.taxa = Math.round((periodo.acertos / periodo.total) * 100)
        }
      })
    })

    return matriz
  }, [questoes])

  // Gerar insights inteligentes
  const insights = useMemo((): Insight[] => {
    const insights: Insight[] = []

    // Matérias com baixa performance
    const materiasFracas = performanceByMateria
      .filter(p => p.taxaAcerto < 50 && p.respondidas >= 5)
      .slice(0, 2)

    materiasFracas.forEach(m => {
      insights.push({
        type: 'warning',
        title: `Performance baixa em ${m.materia}`,
        description: `Taxa de acerto: ${m.taxaAcerto}%. Considere revisar conceitos básicos.`,
        action: 'Estudar Matéria'
      })
    })

    // Matérias com alta performance
    const materiasFortes = performanceByMateria
      .filter(p => p.taxaAcerto >= 80 && p.respondidas >= 10)
      .slice(0, 1)

    materiasFortes.forEach(m => {
      insights.push({
        type: 'success',
        title: `Excelente em ${m.materia}!`,
        description: `Taxa de acerto: ${m.taxaAcerto}%. Continue praticando para manter o nível.`,
      })
    })

    // Tendência de melhoria/piora
    if (performanceTrend.length >= 2) {
      const penultima = performanceTrend[performanceTrend.length - 2]
      const ultima = performanceTrend[performanceTrend.length - 1]
      const diferenca = ultima.taxaAcerto - penultima.taxaAcerto

      if (diferenca >= 10) {
        insights.push({
          type: 'success',
          title: 'Evolução positiva!',
          description: `Sua taxa de acerto aumentou ${diferenca}% na última semana.`,
        })
      } else if (diferenca <= -10) {
        insights.push({
          type: 'warning',
          title: 'Atenção à queda de performance',
          description: `Sua taxa de acerto caiu ${Math.abs(diferenca)}% na última semana.`,
        })
      }
    }

    // Consistência de estudo
    const questoesUltimaSemana = questoes.filter(
      q => q.respondida && 
      q.data >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    if (questoesUltimaSemana < 10) {
      insights.push({
        type: 'info',
        title: 'Aumente o volume de estudos',
        description: `Apenas ${questoesUltimaSemana} questões na última semana. Meta sugerida: 20+`,
        action: 'Ver Questões'
      })
    }

    return insights
  }, [performanceByMateria, performanceTrend, questoes])

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalRespondidas = questoes.filter(q => q.respondida).length
    const totalAcertos = questoes.filter(q => q.respondida && q.acertou).length
    const taxaGeralAcerto = totalRespondidas > 0
      ? Math.round((totalAcertos / totalRespondidas) * 100)
      : 0

    const melhorMateria = performanceByMateria[0]
    const piorMateria = performanceByMateria[performanceByMateria.length - 1]

    return {
      totalRespondidas,
      totalAcertos,
      taxaGeralAcerto,
      melhorMateria,
      piorMateria
    }
  }, [questoes, performanceByMateria])

  return {
    performanceByMateria,
    performanceTrend,
    heatmapData,
    insights,
    stats
  }
}
