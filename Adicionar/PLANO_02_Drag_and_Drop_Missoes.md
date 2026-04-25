# 📋 PLANO 02: Drag and Drop - Missões entre Dias

## 🎯 Objetivo

Implementar funcionalidade de arrastar e soltar (drag and drop) para permitir que o usuário mova missões entre diferentes dias da semana de forma intuitiva.

**Bibliotecas:** `@hello-pangea/dnd` (já instalada no projeto!)

---

## 📁 Arquivos a Modificar

### Arquivos Principais:
1. **`app/(dashboard)/missoes/page.tsx`** - Componente principal (adicionar DnD)
2. **`hooks/useMissions.ts`** - Hook customizado (adicionar função de mover missão)
3. **`types/mission.ts`** - Tipos TypeScript (verificar se existem)

### Novos Arquivos (Opcionais):
- **`components/DraggableMissionCard.tsx`** - Wrapper da MissionCard com DnD

---

## 🔧 Implementação Detalhada

### PARTE 1: Adicionar Função ao Hook

#### 1.1. Atualizar `hooks/useMissions.ts`

Adicionar nova função `moveMissionToDay`:

```typescript
// Adicionar ao final do hook, antes do return (após saveWeeklySchedule)
const moveMissionToDay = async (
  missionId: string,
  newDayOfWeek: DayOfWeek
) => {
  if (!user) return

  const missionRef = doc(db, 'users', user.uid, 'missions', missionId)
  await updateDoc(missionRef, {
    dayOfWeek: newDayOfWeek,
  })
}

// Adicionar ao return do hook
return {
  missions,
  loading,
  addMission,
  updateMission,
  updateMissionStatus,
  deleteMission,
  startTimer,
  stopTimer,
  getWeeklySchedule,
  saveWeeklySchedule,
  moveMissionToDay, // NOVO
}
```

---

### PARTE 2: Integrar @hello-pangea/dnd na Página

#### 2.1. Imports Necessários

Em `app/(dashboard)/missoes/page.tsx`, adicionar imports:

```typescript
// Adicionar no topo do arquivo, após outros imports
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
```

#### 2.2. Atualizar Hook para Incluir moveMissionToDay

```typescript
// Modificar a linha onde useMissions é chamado (linha ~79)
const { 
  missions, 
  loading, 
  addMission, 
  updateMission, 
  updateMissionStatus, 
  deleteMission, 
  startTimer, 
  stopTimer, 
  getWeeklySchedule, 
  saveWeeklySchedule,
  moveMissionToDay // ADICIONAR
} = useMissions(weekStartDate)
```

#### 2.3. Handler do Drag and Drop

Adicionar função antes do return do componente (aproximadamente linha ~215):

```typescript
// Handler para drag and drop
const handleDragEnd = async (result: DropResult) => {
  const { source, destination, draggableId } = result

  // Se não houver destino válido (dropou fora), não fazer nada
  if (!destination) {
    return
  }

  // Se soltou no mesmo lugar, não fazer nada
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return
  }

  // Extrair o dia de origem e destino
  const sourceDayOfWeek = source.droppableId as DayOfWeek
  const destinationDayOfWeek = destination.droppableId as DayOfWeek

  // Se moveu para outro dia, atualizar no Firestore
  if (sourceDayOfWeek !== destinationDayOfWeek) {
    await moveMissionToDay(draggableId, destinationDayOfWeek)
  }

  // Nota: Não precisamos gerenciar ordem dentro do mesmo dia por enquanto
  // O Firestore já ordena por createdAt
}
```

#### 2.4. Envolver Grid de Dias com DragDropContext

Modificar a estrutura da grid de dias (linha ~356 e ~494):

**ANTES:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
  {DAYS_OF_WEEK.filter(...).map((day) => (
    // conteúdo do dia
  ))}
</div>
```

**DEPOIS:**
```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
    {DAYS_OF_WEEK.filter(d => ['segunda','terca','quarta','quinta','sexta'].includes(d.key)).map((day) => (
      // Conteúdo modificado abaixo
    ))}
  </div>
</DragDropContext>
```

#### 2.5. Transformar Área de Missões em Droppable

Dentro do map de cada dia, modificar a área de missões (linha ~456):

**ANTES:**
```tsx
{/* Missions */}
<div className="space-y-3 flex-1 overflow-y-auto">
  {dayMissions.length === 0 ? (
    // empty state
  ) : (
    dayMissions.map((mission) => (
      <MissionCard
        key={mission.id}
        mission={mission}
        // props...
      />
    ))
  )}
</div>
```

**DEPOIS:**
```tsx
{/* Missions */}
<Droppable droppableId={day.key}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={`space-y-3 flex-1 overflow-y-auto min-h-[100px] transition-colors ${
        snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg' : ''
      }`}
    >
      {dayMissions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 font-medium">
            {snapshot.isDraggingOver 
              ? 'Solte aqui para mover' 
              : 'Nenhuma missão para este dia'}
          </p>
          {!snapshot.isDraggingOver && (
            <button
              type="button"
              onClick={() => handleOpenDayModal(day.key)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="w-3 h-3" />
              Adicionar missão para {day.label}
            </button>
          )}
        </div>
      ) : (
        dayMissions.map((mission, index) => (
          <Draggable
            key={mission.id}
            draggableId={mission.id}
            index={index}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`transition-shadow ${
                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                }`}
              >
                <MissionCard
                  mission={mission}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteMission}
                  onEdit={handleEditMission}
                  onStartTimer={handleStartTimer}
                  onStopTimer={handleStopTimer}
                />
              </div>
            )}
          </Draggable>
        ))
      )}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

#### 2.6. Aplicar Mesmo Padrão para Fim de Semana

Repetir a mesma modificação para a grid de sábado e domingo (linha ~494):

```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
    {DAYS_OF_WEEK.filter(d => ['sabado','domingo'].includes(d.key)).map((day) => (
      // Usar o mesmo padrão Droppable/Draggable do código acima
    ))}
  </div>
</DragDropContext>
```

---

### PARTE 3: Melhorias de UX

#### 3.1. Indicadores Visuais Durante Drag

- **Drag iniciado:** Card arrastado ganha sombra e borda
- **Hover sobre área válida:** Área de destino muda cor de fundo
- **Drop:** Animação suave de transição

Já implementado no código acima com:
```tsx
className={`transition-shadow ${
  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
}`}
```

#### 3.2. Feedback de Drag em Área Vazia

Quando arrastar sobre dia sem missões:
```tsx
{snapshot.isDraggingOver 
  ? 'Solte aqui para mover' 
  : 'Nenhuma missão para este dia'}
```

#### 3.3. Cursor Personalizado

Adicionar ao `globals.css`:

```css
/* Adicionar ao final do arquivo */
[data-rbd-drag-handle-draggable-id] {
  cursor: grab !important;
}

[data-rbd-drag-handle-draggable-id]:active {
  cursor: grabbing !important;
}

[data-rbd-draggable-id].dragging {
  opacity: 0.8;
}
```

---

## 🎨 Melhorias Visuais Adicionais

### 1. Ícone de Arrasto no Card

Adicionar ícone visual que indica que o card pode ser arrastado:

Em `components/MissionCard.tsx`, adicionar ícone de grip no topo do card:

```tsx
import { GripVertical } from 'lucide-react'

// No início do card
<div className="flex items-center gap-2 mb-2">
  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
  {/* resto do conteúdo */}
</div>
```

### 2. Animação de Feedback

Adicionar toast de sucesso após mover missão (opcional):

```tsx
// Após moveMissionToDay bem-sucedido
const handleDragEnd = async (result: DropResult) => {
  // ... código existente ...
  
  if (sourceDayOfWeek !== destinationDayOfWeek) {
    await moveMissionToDay(draggableId, destinationDayOfWeek)
    
    // Feedback visual opcional (requer biblioteca de toast)
    // toast.success('Missão movida com sucesso!')
  }
}
```

---

## 🔄 Fluxo de Funcionamento

```
1. Usuário clica e segura em uma missão
   ↓
2. Card fica com sombra e borda destacada
   ↓
3. Arrasta para outro dia
   ↓
4. Área de destino muda de cor (indicando hover)
   ↓
5. Solta o card
   ↓
6. handleDragEnd é chamado
   ↓
7. moveMissionToDay atualiza Firestore
   ↓
8. onSnapshot detecta mudança
   ↓
9. UI re-renderiza automaticamente
   ↓
10. Missão aparece no novo dia
```

---

## ⚙️ Configurações do @hello-pangea/dnd

### Props Importantes:

#### DragDropContext
```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  {/* conteúdo */}
</DragDropContext>
```

#### Droppable
```tsx
<Droppable droppableId={uniqueId}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
    >
      {/* conteúdo */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

#### Draggable
```tsx
<Draggable draggableId={uniqueId} index={index}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      {/* conteúdo */}
    </div>
  )}
</Draggable>
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar `moveMissionToDay` ao hook useMissions
- [ ] Importar biblioteca @hello-pangea/dnd
- [ ] Criar handler `handleDragEnd`
- [ ] Envolver grid com `DragDropContext`
- [ ] Transformar área de missões em `Droppable`
- [ ] Envolver cada MissionCard com `Draggable`
- [ ] Aplicar para dias da semana (seg-sex)
- [ ] Aplicar para fim de semana (sab-dom)
- [ ] Adicionar estilos de feedback visual
- [ ] Testar drag and drop entre dias
- [ ] Testar drag dentro do mesmo dia (não deve fazer nada)
- [ ] Testar drag com timer rodando
- [ ] Testar com diferentes resoluções (mobile/desktop)

---

## 🧪 Testes Sugeridos

### Cenários de Teste:

1. **Drag básico:**
   - Arrastar missão de Segunda para Terça → Deve mover
   - Arrastar missão de Sexta para Domingo → Deve mover

2. **Edge cases:**
   - Soltar fora de área válida → Não deve fazer nada
   - Arrastar e soltar no mesmo dia → Não deve atualizar Firestore
   - Arrastar missão com timer rodando → Timer deve continuar

3. **Performance:**
   - Muitas missões (20+) → Drag deve ser suave
   - Rede lenta → Feedback visual imediato, sync depois

4. **Mobile:**
   - Touch drag deve funcionar
   - Scroll não deve interferir com drag

---

## 🚧 Limitações e Considerações

### Atuais:
- **Reordenação dentro do dia:** Não implementada (missões ordenadas por createdAt)
- **Undo/Redo:** Não implementado (pode ser adição futura)
- **Drag entre semanas:** Não implementado (drag apenas dentro da semana atual)

### Futuras Melhorias:
1. **Reordenação manual:** Permitir reordenar missões dentro do mesmo dia
   - Adicionar campo `order: number` no schema
   - Implementar lógica de reordenação no drop

2. **Copiar em vez de mover:** Segurar Ctrl/Cmd para copiar missão
   - Detectar tecla modificadora
   - Criar nova missão em vez de mover

3. **Drag múltiplo:** Selecionar várias missões e mover juntas
   - Adicionar checkbox de seleção
   - Lógica de multi-drag

4. **Histórico de mudanças:** Log de movimentações
   - Coleção `missionHistory` no Firestore
   - Botão "Desfazer" nas últimas 10 ações

---

## 📚 Referências

- **@hello-pangea/dnd Docs:** https://github.com/hello-pangea/dnd
- **React Beautiful DnD Guide:** https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd
- **Firestore Updates:** https://firebase.google.com/docs/firestore/manage-data/add-data#update-data

---

## 🐛 Troubleshooting

### Problema: Drag não funciona
- Verificar se `@hello-pangea/dnd` está instalado
- Confirmar que `draggableId` e `droppableId` são únicos
- Checar console por erros de TypeScript

### Problema: Missão não aparece no novo dia
- Verificar se `moveMissionToDay` está no hook
- Confirmar que Firestore está atualizando
- Checar regras de segurança do Firestore

### Problema: Performance ruim
- Usar `React.memo` no MissionCard
- Evitar re-renders desnecessários
- Considerar virtualização se muitas missões

---

## 🎯 Resultado Esperado

Após implementação, o usuário poderá:
1. ✅ Clicar e segurar em qualquer missão
2. ✅ Arrastar para outro dia da semana
3. ✅ Ver feedback visual durante o arrasto
4. ✅ Soltar e ver a missão movida automaticamente
5. ✅ Funcionalidade fluida e intuitiva
