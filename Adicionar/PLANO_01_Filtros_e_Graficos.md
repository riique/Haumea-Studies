# 📋 PLANO 01: Filtros Avançados e Gráficos de Evolução

## 🎯 Objetivos

### 1. Filtros de Questões (Questões Erradas e Para Revisar)
Adicionar filtros rápidos na página de questões para facilitar o acesso a:
- **Questões Erradas**: Todas as questões marcadas como respondidas e incorretas
- **Para Revisar**: Questões que precisam de revisão (podem ser erradas ou marcadas especificamente)

### 2. Gráfico de Evolução dos Simulados
Adicionar visualização gráfica da evolução do desempenho em simulados ao longo do tempo, com filtro por instituição/banca.

---

## 📁 Arquivos a Modificar

### Funcionalidade 1: Filtros de Questões
- **`app/questoes/page.tsx`** (arquivo principal)
- Não requer novos hooks ou componentes

### Funcionalidade 2: Gráfico de Evolução
- **`app/simulados/page.tsx`** (arquivo principal)
- **Novo componente:** `components/SimuladosChart.tsx`
- Usar biblioteca **Recharts** (já instalada)

---

## 🔧 Implementação Detalhada

### PARTE 1: Filtros de Questões Erradas e Para Revisar

#### 1.1. Estado Adicional
```typescript
// Adicionar no component QuestoesPage (linha ~60)
const [filtroStatus, setFiltroStatus] = useState<'todas' | 'erradas' | 'revisar'>('todas')
```

#### 1.2. Lógica de Filtragem
```typescript
// Modificar questoesFiltradas (linha ~122) para incluir filtro de status
const questoesFiltradas = useMemo(() => {
  return questoes.filter(q => {
    // Filtros existentes (materia, categoria, busca)
    if (filtroMateria !== 'todas' && q.materia !== filtroMateria) return false
    if (filtroCategoria !== 'todas') {
      const catId = materiaCategoriaMap.get(q.materia) ?? null
      if (filtroCategoria === 'sem-categoria') {
        if (catId !== null) return false
      } else {
        if (catId !== filtroCategoria) return false
      }
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (
        !q.materia.toLowerCase().includes(term) &&
        !q.assunto.toLowerCase().includes(term) &&
        !q.enunciado.toLowerCase().includes(term)
      ) return false
    }

    // NOVO: Filtro de status
    if (filtroStatus === 'erradas') {
      // Apenas questões respondidas E que foram erradas
      if (!q.respondida || q.acertou) return false
    }
    if (filtroStatus === 'revisar') {
      // Questões marcadas para revisar OU questões erradas
      // (para implementar "revisar", precisaria adicionar campo no Firestore)
      // Por enquanto, usar apenas erradas
      if (!q.respondida || q.acertou) return false
    }

    return true
  })
}, [questoes, filtroMateria, filtroCategoria, searchTerm, materiaCategoriaMap, filtroStatus])
```

#### 1.3. UI dos Filtros
Adicionar botões de filtro rápido ANTES da barra de busca (após estatísticas):

```tsx
{/* Filtros Rápidos - Adicionar após stats, linha ~506 */}
<div className="bg-card border border-border rounded-xl p-4">
  <div className="flex items-center gap-3">
    <span className="text-sm font-medium text-foreground">Filtros rápidos:</span>
    <button
      onClick={() => setFiltroStatus('todas')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        filtroStatus === 'todas'
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-foreground hover:bg-secondary/80'
      }`}
    >
      Todas ({questoes.length})
    </button>
    <button
      onClick={() => setFiltroStatus('erradas')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        filtroStatus === 'erradas'
          ? 'bg-red-600 text-white'
          : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      Erradas ({questoes.filter(q => q.respondida && !q.acertou).length})
    </button>
    <button
      onClick={() => setFiltroStatus('revisar')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        filtroStatus === 'revisar'
          ? 'bg-orange-600 text-white'
          : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
      }`}
    >
      Para Revisar ({questoes.filter(q => q.respondida && !q.acertou).length})
    </button>
  </div>
</div>
```

#### 1.4. Badge de Filtro Ativo
Adicionar indicador visual quando filtro está ativo:

```tsx
{/* Após Action Bar, mostrar badge se filtro ativo */}
{filtroStatus !== 'todas' && (
  <div className="flex items-center gap-2 mb-4">
    <span className="text-sm text-muted-foreground">Filtro ativo:</span>
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
      <span className="font-medium">
        {filtroStatus === 'erradas' ? 'Questões Erradas' : 'Para Revisar'}
      </span>
      <button
        onClick={() => setFiltroStatus('todas')}
        className="hover:bg-primary/20 rounded p-0.5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}
```

---

### PARTE 2: Gráfico de Evolução dos Simulados

#### 2.1. Criar Componente de Gráfico
**Arquivo novo:** `components/SimuladosChart.tsx`

```typescript
'use client'

import { useMemo, useState } from 'react'
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

  // Filtrar e preparar dados
  const chartData = useMemo(() => {
    const simuladosFiltrados = tipoSelecionado === 'Todos'
      ? simulados
      : simulados.filter(s => s.tipo === tipoSelecionado)

    // Ordenar por data
    const ordenados = [...simuladosFiltrados].sort(
      (a, b) => a.data.getTime() - b.data.getTime()
    )

    return ordenados.map((s, index) => {
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
        nome: s.nome.length > 20 ? s.nome.substring(0, 20) + '...' : s.nome,
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
    <div className="bg-card border border-border rounded-xl p-6">
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
          
          {/* Filtro por tipo/banca */}
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="nome"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
            />
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
    </div>
  )
}
```

#### 2.2. Integrar no Simulados Page

Em `app/simulados/page.tsx`, adicionar:

```tsx
// Importar no topo
import { SimuladosChart } from '@/components/SimuladosChart'

// Adicionar seção de gráfico APÓS as estatísticas e ANTES da action bar
// (aproximadamente linha ~240)

{/* Gráfico de Evolução */}
<div>
  <SimuladosChart simulados={simulados} />
</div>
```

---

## 🎨 Melhorias de UX

### Questões:
1. **Feedback visual claro** do filtro ativo
2. **Contador atualizado** em cada botão de filtro
3. **Animação suave** ao trocar filtros (Framer Motion opcional)
4. **Badge removível** para limpar filtro rapidamente

### Simulados:
1. **Transição suave** ao trocar de filtro
2. **Loading state** se tiver muitos simulados
3. **Tooltip rico** com todas as informações
4. **Estatísticas resumidas** abaixo do gráfico
5. **Responsivo** - ajustar altura do gráfico em mobile

---

## ✅ Checklist de Implementação

### Filtros de Questões:
- [ ] Adicionar estado `filtroStatus`
- [ ] Modificar lógica `questoesFiltradas`
- [ ] Criar UI dos botões de filtro
- [ ] Adicionar badge de filtro ativo
- [ ] Testar com questões erradas e corretas
- [ ] Verificar contadores dinâmicos

### Gráfico de Simulados:
- [ ] Criar componente `SimuladosChart.tsx`
- [ ] Implementar lógica de filtragem por tipo
- [ ] Configurar Recharts com dados corretos
- [ ] Criar tooltip customizado
- [ ] Adicionar estatísticas resumidas
- [ ] Integrar no `simulados/page.tsx`
- [ ] Testar com múltiplos simulados
- [ ] Testar filtro por instituição
- [ ] Verificar responsividade

---

## 🧪 Testes Sugeridos

### Filtros:
1. Sem questões cadastradas → Deve mostrar 0
2. Todas corretas → Filtro "Erradas" deve mostrar vazio
3. Mix de erradas e corretas → Deve filtrar corretamente
4. Busca + filtro → Devem funcionar juntos
5. Trocar categoria + filtro status → Não conflitar

### Gráfico:
1. Sem simulados → Mensagem de empty state
2. 1 simulado → Mostrar ponto único
3. Múltiplos simulados → Linha conectando
4. Filtro "Todos" → Mostrar todos tipos
5. Filtro específico → Mostrar apenas aquele tipo
6. Simulado sem nota → Calcular 0% corretamente
7. Mobile → Gráfico responsivo e legível

---

## 📚 Referências Técnicas

- **Recharts Docs:** https://recharts.org/
- **Tailwind Dark Mode:** https://tailwindcss.com/docs/dark-mode
- **React useMemo:** Otimização de cálculos pesados
- **Firestore Queries:** Filtragem de dados

---

## 🚀 Próximos Passos Opcionais

### Futuras Melhorias - Filtros:
- Adicionar campo `paraRevisar: boolean` no schema de questões
- Permitir marcar questões para revisão manualmente
- Contador de "dias desde última revisão"

### Futuras Melhorias - Gráfico:
- Adicionar linha de tendência (regressão linear)
- Comparar múltiplas instituições lado a lado
- Exportar gráfico como imagem
- Adicionar anotações em simulados importantes
