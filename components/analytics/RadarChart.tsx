'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { PerformanceByMateria } from '@/hooks/useAnalytics'

interface RadarChartProps {
  data: PerformanceByMateria[]
}

export function PerformanceRadarChart({ data }: RadarChartProps) {
  // Limitar a top 6 matérias para não poluir o gráfico
  const chartData = data.slice(0, 6).map(item => ({
    materia: item.materia.length > 15 
      ? item.materia.substring(0, 15) + '...' 
      : item.materia,
    nomeCompleto: item.materia,
    taxaAcerto: item.taxaAcerto,
    respondidas: item.respondidas
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-1">{data.nomeCompleto}</p>
          <p className="text-sm text-muted-foreground">
            Taxa de acerto: <span className="font-medium text-primary">{data.taxaAcerto}%</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {data.respondidas} questões respondidas
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">
          Nenhum dado disponível para análise
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <RadarChart data={chartData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="materia" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Radar
            name="Taxa de Acerto"
            dataKey="taxaAcerto"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
