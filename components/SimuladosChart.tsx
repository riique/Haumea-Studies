'use client'

import { useMemo, useState, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Download, TrendingUp as TrendIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'

interface Simulado {
  id: string
  nome: string
  tipo: string
  data: Date
  dia1?: { linguagens: number; humanas: number }
  dia2?: { natureza: number; matematica: number }
  redacao?: number
}

interface SimuladosChartProps {
  simulados: Simulado[]
}

export function SimuladosChart({ simulados }: SimuladosChartProps) {
  // Tipos/bancas únicos
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(simulados.map(s => s.tipo))
    return ['Todos', ...Array.from(tipos)]
  }, [simulados])

  const [tipoSelecionado, setTipoSelecionado] = useState('Todos')
  const [mostrarTendencia, setMostrarTendencia] = useState(true)
  const [exportando, setExportando] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  // Filtrar e preparar dados
  const chartData = useMemo(() => {
    const simuladosFiltrados = tipoSelecionado === 'Todos'
      ? simulados
      : simulados.filter(s => s.tipo === tipoSelecionado)

    // Ordenar por data
    const ordenados = [...simuladosFiltrados].sort(
      (a, b) => a.data.getTime() - b.data.getTime()
    )

    return ordenados.map((s) => {
      const pontosDia1 = s.dia1 ? s.dia1.linguagens + s.dia1.humanas : 0
      const pontosDia2 = s.dia2 ? s.dia2.natureza + s.dia2.matematica : 0
      const totalPontos = pontosDia1 + pontosDia2
      
      const questoesDia1 = s.dia1 ? 90 : 0
      const questoesDia2 = s.dia2 ? 90 : 0
      const totalQuestoes = questoesDia1 + questoesDia2
      
      const porcentagem = totalQuestoes > 0 
        ? Math.round((totalPontos / totalQuestoes) * 100) 
        : 0

      return {
        nome: s.nome.length > 25 ? s.nome.substring(0, 22) + '...' : s.nome,
        nomeCompleto: s.nome,
        data: s.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        pontos: totalPontos,
        total: totalQuestoes,
        porcentagem,
        tipo: s.tipo,
        // Para o tooltip
        dia1Pontos: pontosDia1,
        dia2Pontos: pontosDia2,
        redacao: s.redacao || null
      }
    })
  }, [simulados, tipoSelecionado])

  // Calcular linha de tendência (regressão linear)
  const dadosTendencia = useMemo(() => {
    if (chartData.length < 2) return []
    
    const n = chartData.length
    const sumX = chartData.reduce((acc, _, i) => acc + i, 0)
    const sumY = chartData.reduce((acc, d) => acc + d.porcentagem, 0)
    const sumXY = chartData.reduce((acc, d, i) => acc + i * d.porcentagem, 0)
    const sumX2 = chartData.reduce((acc, _, i) => acc + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return chartData.map((d, i) => ({
      ...d,
      tendencia: Math.max(0, Math.min(100, slope * i + intercept))
    }))
  }, [chartData])

  const dadosGrafico = mostrarTendencia && dadosTendencia.length > 0 ? dadosTendencia : chartData

  // Função de export
  const handleExport = async () => {
    if (!chartRef.current) return
    
    setExportando(true)
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      
      const link = document.createElement('a')
      link.download = `evolucao-simulados-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error)
      alert('Erro ao exportar gráfico. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  // Custom label para eixo X com quebra de linha
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const text = payload.value
    const maxCharsPerLine = 16
    
    // Se o texto for muito longo, quebrar em duas linhas
    if (text.length > maxCharsPerLine) {
      const words = text.split(' ')
      let line1 = ''
      let line2 = ''
      
      // Dividir palavras tentando manter o equilíbrio
      for (let i = 0; i < words.length; i++) {
        if (line1.length + words[i].length <= maxCharsPerLine) {
          line1 += (line1 ? ' ' : '') + words[i]
        } else {
          line2 += (line2 ? ' ' : '') + words[i]
        }
      }
      
      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={0}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={10}
          >
            <tspan x="0" dy="0">{line1}</tspan>
            <tspan x="0" dy="12">{line2}</tspan>
          </text>
        </g>
      )
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={11}
        >
          {text}
        </text>
      </g>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.nomeCompleto}</p>
          <p className="text-sm text-muted-foreground mb-1">{data.tipo} - {data.data}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary font-medium">
              {data.pontos}/{data.total} ({data.porcentagem}%)
            </p>
            {data.dia1Pontos > 0 && (
              <p className="text-muted-foreground">Dia 1: {data.dia1Pontos}/90</p>
            )}
            {data.dia2Pontos > 0 && (
              <p className="text-muted-foreground">Dia 2: {data.dia2Pontos}/90</p>
            )}
            {data.redacao !== null && (
              <p className="text-muted-foreground">Redação: {data.redacao}/1000</p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  if (simulados.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum simulado cadastrado. Adicione simulados para visualizar a evolução.
        </p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum simulado do tipo "{tipoSelecionado}". Selecione outro filtro.
        </p>
      </div>
    )
  }

  return (
    <motion.div 
      ref={chartRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      {/* Header com filtro */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Evolução de Desempenho
            </h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe seu progresso ao longo dos simulados
            </p>
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">Filtrar:</span>
            <select
              value={tipoSelecionado}
              onChange={(e) => setTipoSelecionado(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            >
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            
            {/* Toggle Tendência */}
            {chartData.length >= 2 && (
              <button
                onClick={() => setMostrarTendencia(!mostrarTendencia)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  mostrarTendencia
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
                title={mostrarTendencia ? 'Ocultar tendência' : 'Mostrar tendência'}
              >
                <TrendIcon className="w-4 h-4" />
                Tendência
              </button>
            )}
            
            {/* Botão Export */}
            <button
              onClick={handleExport}
              disabled={exportando}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exportar gráfico como imagem"
            >
              <Download className="w-4 h-4" />
              {exportando ? 'Exportando...' : 'Exportar'}
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <LineChart
            data={dadosGrafico}
            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="nome"
              height={50}
              interval={0}
              tick={<CustomXAxisTick />}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: 'Porcentagem de Acerto (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => 'Porcentagem de Acerto'}
            />
            <Line
              type="monotone"
              dataKey="porcentagem"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
              activeDot={{ r: 8 }}
              name="Porcentagem de Acerto"
            />
            {mostrarTendencia && dadosTendencia.length >= 2 && (
              <Line
                type="monotone"
                dataKey="tendencia"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Linha de Tendência"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas resumidas */}
      <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Média Geral</p>
          <p className="text-2xl font-bold text-foreground">
            {chartData.length > 0
              ? Math.round(
                  chartData.reduce((acc, d) => acc + d.porcentagem, 0) / chartData.length
                )
              : 0}%
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Melhor Resultado</p>
          <p className="text-2xl font-bold text-green-600">
            {Math.max(...chartData.map(d => d.porcentagem))}%
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Último Resultado</p>
          <p className="text-2xl font-bold text-primary">
            {chartData[chartData.length - 1]?.porcentagem || 0}%
          </p>
        </div>
      </div>
    </motion.div>
  )
}
