# 📋 PLANO 03: Dark Mode Aprimorado + Análise de Desempenho Avançada

## 🎯 Objetivos

### 1. Dark Mode Aprimorado
Melhorar o dark mode atual com:
- Contraste WCAG AA compliant
- Cores mais harmoniosas e profissionais
- Consistência visual em todos os componentes
- Suporte perfeito para gráficos e charts

### 2. Análise de Desempenho Avançada
Criar dashboard completo de analytics com:
- Gráfico de radar (performance por matéria)
- Heatmap de acertos/erros
- Tendências temporais
- Insights acionáveis
- Recomendações inteligentes

---

## 📁 Arquivos a Modificar/Criar

### Dark Mode:
1. **`app/globals.css`** - Ajustar variáveis CSS
2. Revisar componentes com cores hardcoded
3. Testar todos os charts (Recharts)

### Analytics:
1. **Novo:** `components/AnalyticsDashboard.tsx` - Componente principal
2. **Novo:** `components/analytics/RadarChart.tsx` - Gráfico radar
3. **Novo:** `components/analytics/HeatmapChart.tsx` - Heatmap
4. **Novo:** `components/analytics/TrendChart.tsx` - Tendências
5. **Novo:** `components/analytics/InsightsPanel.tsx` - Insights
6. **Modificar:** `app/(dashboard)/dashboard/page.tsx` - Integrar analytics
7. **Novo:** `hooks/useAnalytics.ts` - Lógica de cálculos

---

## 🎨 PARTE 1: Dark Mode Aprimorado

### 1.1. Atualizar Variáveis CSS

Modificar `app/globals.css` para cores mais refinadas:

```css
.dark {
  /* === BACKGROUNDS === */
  /* Fundo principal - Azul muito escuro quase preto */
  --background: 222 47% 7%;        /* #0a0e1a → mantém */
  
  /* Fundo de cards - Azul escuro levemente mais claro */
  --card: 222 47% 11%;             /* #131828 → mantém */
  --card-foreground: 210 40% 98%;  /* #f8fafc */
  
  /* === TEXTOS === */
  /* Texto principal - Branco quase puro com leve azul */
  --foreground: 210 40% 98%;       /* #f8fafc → mais claro */
  
  /* Texto secundário - Cinza azulado médio */
  --muted-foreground: 215 20% 65%; /* #94a3b8 → melhor contraste */
  
  /* === ELEMENTOS INTERATIVOS === */
  /* Primary - Roxo/Azul vibrante */
  --primary: 239 84% 67%;          /* #a78bfa → mantém */
  --primary-foreground: 210 40% 98%;
  
  /* Secondary - Azul escuro para backgrounds sutis */
  --secondary: 220 40% 13%;        /* #141b2d */
  --secondary-foreground: 210 40% 98%;
  
  /* Accent - Roxo vibrante (igual primary por consistência) */
  --accent: 239 84% 67%;
  --accent-foreground: 210 40% 98%;
  
  /* Muted - Para backgrounds hover */
  --muted: 217 33% 17%;            /* #1e293b */
  
  /* === BORDAS E INPUTS === */
  --border: 217 33% 20%;           /* #1e293b → mais visível */
  --input: 217 33% 20%;
  --ring: 239 84% 67%;             /* Focus ring roxo */
  
  /* === ESTADOS === */
  --destructive: 0 72% 51%;        /* #dc2626 - Vermelho */
  --destructive-foreground: 210 40% 98%;
  
  --success: 142 71% 45%;          /* #10b981 - Verde */
  --warning: 38 92% 50%;           /* #f59e0b - Laranja */
  
  /* === CORES ESPECÍFICAS PARA GRÁFICOS === */
  --chart-1: 239 84% 67%;          /* Roxo */
  --chart-2: 142 71% 45%;          /* Verde */
  --chart-3: 38 92% 50%;           /* Laranja */
  --chart-4: 200 98% 39%;          /* Azul ciano */
  --chart-5: 340 82% 52%;          /* Rosa */
}
```

### 1.2. Adicionar Classes Utilitárias

```css
/* Adicionar ao final de globals.css */

/* === UTILITÁRIOS DARK MODE === */
@layer utilities {
  /* Texto com contraste garantido */
  .text-contrast {
    @apply text-foreground dark:text-foreground;
  }
  
  /* Background com contraste */
  .bg-contrast {
    @apply bg-background dark:bg-background;
  }
  
  /* Card com efeito glass no dark */
  .card-glass {
    @apply bg-card/95 backdrop-blur-sm dark:bg-card/80;
  }
  
  /* Border suave que funciona em ambos os modos */
  .border-subtle {
    @apply border-border/50 dark:border-border;
  }
  
  /* Hover que funciona em ambos os modos */
  .hover-lift {
    @apply transition-all hover:shadow-md dark:hover:shadow-primary/10;
  }
}

/* === SCROLLBAR DARK MODE === */
.dark ::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

.dark ::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary));
}

/* === SELEÇÃO DE TEXTO === */
.dark ::selection {
  background: hsl(var(--primary) / 0.3);
  color: hsl(var(--primary-foreground));
}
```

### 1.3. Ajustar Cores dos Gráficos

Modificar `components/PerformanceChart.tsx` para usar cores do tema:

```tsx
// Substituir cores hardcoded (linha ~92)
const coresCategorias: { [key: string]: string } = {
  'Sem Categoria': 'hsl(var(--muted-foreground))',
}

categoriasUnicas.forEach((cat, index) => {
  if (!coresCategorias[cat]) {
    // Usar cores do tema
    const cores = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]
    coresCategorias[cat] = cores[index % cores.length]
  }
})
```

### 1.4. Checklist de Componentes

Verificar e ajustar em cada página/componente:

- [ ] **Dashboard:** Verificar todos os cards e badges
- [ ] **Missões:** Cards de missões, bordas, backgrounds
- [ ] **Questões:** Filtros, cards, badges de status
- [ ] **Simulados:** Gráfico de evolução, cards
- [ ] **Redações:** Cards, badges de nota
- [ ] **Leituras:** Book cards, status colors
- [ ] **Diário:** Entry cards, timestamps
- [ ] **Conteúdo:** Tree view, categorias

---

## 📊 PARTE 2: Análise de Desempenho Avançada

### 2.1. Hook de Analytics

Criar **`hooks/useAnalytics.ts`**:

```typescript
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
```

### 2.2. Componente Radar Chart

Criar **`components/analytics/RadarChart.tsx`**:

```typescript
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
    taxaAcerto: item.taxaAcerto,
    respondidas: item.respondidas
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-1">{data.materia}</p>
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
```

### 2.3. Componente Dashboard Principal

Criar **`components/AnalyticsDashboard.tsx`**:

```typescript
'use client'

import { PerformanceRadarChart } from './analytics/RadarChart'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

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
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Dados insuficientes
        </h3>
        <p className="text-muted-foreground">
          Responda algumas questões para visualizar sua análise de desempenho.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-2">Taxa Geral de Acerto</p>
          <p className="text-3xl font-bold text-primary">{stats.taxaGeralAcerto}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalAcertos}/{stats.totalRespondidas} questões
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-2">Melhor Matéria</p>
          <p className="text-xl font-bold text-green-600">
            {stats.melhorMateria?.materia || '-'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.melhorMateria?.taxaAcerto}% de acerto
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-2">Precisa Atenção</p>
          <p className="text-xl font-bold text-orange-600">
            {stats.piorMateria?.materia || '-'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.piorMateria?.taxaAcerto}% de acerto
          </p>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Insights e Recomendações
          </h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Performance por Matéria
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Visualize seu desempenho nas principais matérias estudadas
        </p>
        <PerformanceRadarChart data={performanceByMateria} />
      </div>

      {/* Tendência Temporal */}
      {performanceTrend.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Evolução nas Últimas Semanas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performanceTrend.map((point, index) => (
              <div key={index} className="bg-secondary/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{point.data}</p>
                <p className="text-2xl font-bold text-foreground">{point.taxaAcerto}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {point.acertos + point.erros} questões
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2.4. Integrar no Dashboard

Modificar `app/(dashboard)/dashboard/page.tsx`:

```tsx
// Importar
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

// Adicionar seção após Performance Chart (linha ~590)
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
```

---

## ✅ Checklist de Implementação

### Dark Mode:
- [ ] Atualizar variáveis CSS em globals.css
- [ ] Adicionar classes utilitárias
- [ ] Ajustar cores dos gráficos (Recharts)
- [ ] Testar Dashboard em dark mode
- [ ] Testar Missões em dark mode
- [ ] Testar Questões em dark mode
- [ ] Testar Simulados em dark mode
- [ ] Testar Redações em dark mode
- [ ] Testar Leituras em dark mode
- [ ] Testar Diário em dark mode
- [ ] Testar Conteúdo em dark mode
- [ ] Verificar contraste WCAG AA

### Analytics:
- [ ] Criar hook useAnalytics
- [ ] Criar RadarChart component
- [ ] Criar AnalyticsDashboard component
- [ ] Integrar no dashboard principal
- [ ] Testar com dados reais
- [ ] Testar com poucos dados
- [ ] Testar insights gerados
- [ ] Verificar performance com muitos dados

---

## 🧪 Testes Sugeridos

### Dark Mode:
1. Alternar tema várias vezes → Sem flicker
2. Recarregar página → Manter tema escolhido
3. Todos os gráficos legíveis → Contraste adequado
4. Todas as páginas consistentes → Cores harmoniosas

### Analytics:
1. Sem questões respondidas → Empty state
2. Poucas questões (< 10) → Insights apropriados
3. Muitas questões (100+) → Performance OK
4. Mix de acertos/erros → Cálculos corretos
5. Matérias sem questões → Não aparecer no radar

---

## 🎯 Resultado Esperado

### Dark Mode:
- ✅ Contraste perfeito (WCAG AA)
- ✅ Cores harmoniosas e profissionais
- ✅ Todos os componentes consistentes
- ✅ Gráficos legíveis
- ✅ Alternância suave entre temas

### Analytics:
- ✅ Dashboard rico com múltiplas visualizações
- ✅ Insights acionáveis e relevantes
- ✅ Performance por matéria (radar)
- ✅ Tendências temporais
- ✅ Recomendações inteligentes
