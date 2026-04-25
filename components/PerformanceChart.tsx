'use client'

import { useMemo } from 'react'
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
import { Questao, Materia, Categoria } from '@/hooks/useFirestoreData'

interface PerformanceChartProps {
  questoes: Questao[]
  materias: Materia[]
  categorias: Categoria[]
}

interface MateriaStats {
  nome: string
  categoria: string
  total: number
  respondidas: number
  acertos: number
}

export default function PerformanceChart({ 
  questoes, 
  materias, 
  categorias 
}: PerformanceChartProps) {
  
  // Calcular estatísticas por matéria
  const materiaStats = useMemo(() => {
    const stats: MateriaStats[] = []
    
    // Para cada matéria cadastrada
    materias.forEach(materia => {
      // Filtrar TODAS as questões desta matéria (respondidas ou não)
      const questoesDaMateria = questoes.filter(
        q => q.materia === materia.nome
      )
      
      if (questoesDaMateria.length > 0) {
        const questoesRespondidas = questoesDaMateria.filter(q => q.respondida)
        const acertos = questoesRespondidas.filter(q => q.acertou).length
        
        // Buscar nome da categoria
        const categoria = categorias.find(c => c.id === materia.categoriaId)
        const nomeCategoria = categoria?.nome || 'Sem Categoria'
        
        stats.push({
          nome: materia.nome,
          categoria: nomeCategoria,
          total: questoesDaMateria.length,
          respondidas: questoesRespondidas.length,
          acertos
        })
      }
    })
    
    // Ordenar por categoria e depois por nome
    return stats.sort((a, b) => {
      if (a.categoria !== b.categoria) {
        return a.categoria.localeCompare(b.categoria)
      }
      return a.nome.localeCompare(b.nome)
    })
  }, [questoes, materias, categorias])

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    return materiaStats.map(stat => ({
      materia: stat.nome,
      total: stat.total,
      categoria: stat.categoria,
      // Para tooltip
      respondidas: stat.respondidas,
      acertos: stat.acertos
    }))
  }, [materiaStats])

  // Agrupar por categoria para gerar cores diferentes
  const categoriasUnicas = useMemo(() => {
    return Array.from(new Set(materiaStats.map(s => s.categoria)))
  }, [materiaStats])

  // Cores para categorias
  const coresCategorias: { [key: string]: string } = {
    'Sem Categoria': '#94a3b8',
  }
  
  categoriasUnicas.forEach((cat, index) => {
    if (!coresCategorias[cat]) {
      const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
      coresCategorias[cat] = cores[index % cores.length]
    }
  })

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const porcentagemAcerto = data.respondidas > 0 
        ? Math.round((data.acertos / data.respondidas) * 100)
        : 0
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-1">{data.materia}</p>
          <p className="text-sm text-muted-foreground mb-1">
            Categoria: {data.categoria}
          </p>
          <p className="text-sm font-medium text-primary">
            {data.total} questões cadastradas
          </p>
          {data.respondidas > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.respondidas} respondidas • {data.acertos} acertos ({porcentagemAcerto}%)
            </p>
          )}
          {data.respondidas === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma questão respondida ainda
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum dado disponível. Cadastre questões e associe-as a matérias para visualizar o gráfico.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Total de Questões por Matéria
        </h3>
        <p className="text-sm text-muted-foreground">
          Quantidade de questões cadastradas em cada matéria, organizadas por categoria
        </p>
      </div>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="materia" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ 
                value: 'Número de Questões', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12 }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              content={() => (
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {categoriasUnicas.map(categoria => (
                    <div key={categoria} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: coresCategorias[categoria] }}
                      />
                      <span className="text-sm text-muted-foreground">{categoria}</span>
                    </div>
                  ))}
                </div>
              )}
            />
            
            {/* Linha principal - total de questões */}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={6} 
                    fill={coresCategorias[payload.categoria]}
                    stroke="white"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas por categoria */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Resumo por Categoria
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasUnicas.map(categoria => {
            const materiasCategoria = materiaStats.filter(s => s.categoria === categoria)
            const totalQuestoes = materiasCategoria.reduce((acc, m) => acc + m.total, 0)
            const totalRespondidas = materiasCategoria.reduce((acc, m) => acc + m.respondidas, 0)
            const totalAcertos = materiasCategoria.reduce((acc, m) => acc + m.acertos, 0)
            const porcentagemAcerto = totalRespondidas > 0 
              ? Math.round((totalAcertos / totalRespondidas) * 100)
              : 0
            
            return (
              <div 
                key={categoria} 
                className="bg-secondary/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: coresCategorias[categoria] }}
                  />
                  <h5 className="font-semibold text-foreground text-sm">{categoria}</h5>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalQuestoes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {materiasCategoria.length} matéria(s)
                  {totalRespondidas > 0 && (
                    <> • {totalRespondidas} respondidas ({porcentagemAcerto}% acerto)</>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
