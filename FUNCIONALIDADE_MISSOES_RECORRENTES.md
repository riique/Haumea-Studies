# Funcionalidade: Missões Recorrentes

## Descrição Geral

A funcionalidade de **Missões Recorrentes** permite que os usuários criem missões que aparecem automaticamente em todas as semanas. O tempo dedicado a essas missões é acumulado ao longo do tempo, permitindo acompanhar o progresso total em uma atividade específica.

## Exemplo de Uso

Por exemplo, se um usuário cria uma missão recorrente "Responder Flash Cards":
- Na Semana 1: dedica 1h à missão
- Na Semana 2: a missão aparece automaticamente, começando do tempo acumulado (1h)
- Quando o usuário trabalha mais 30min na Semana 2, o tempo total acumulado passa a ser 1h30min
- Na Semana 3: a missão novamente aparece automaticamente com o tempo acumulado de 1h30min

## Componentes Modificados/Criados

### 1. Tipos (`types/mission.ts`)
- **Adicionados campos em `Mission`:**
  - `isRecurring?: boolean` - indica se a missão é recorrente
  - `recurringMissionId?: string` - ID do template recorrente
  - `accumulatedTime?: number` - tempo acumulado de todas as semanas anteriores

- **Interface `RecurringMission` (nova):**
  - `id: string`
  - `userId: string`
  - `title: string`
  - `description?: string`
  - `subject: string`
  - `dayOfWeek: DayOfWeek`
  - `createdAt: Date`
  - `isActive: boolean` - se a missão recorrente está ativa
  - `totalAccumulatedTime: number` - tempo total acumulado em segundos

### 2. Hook `useRecurringMissions.ts` (novo)
Hook para gerenciar missões recorrentes com as seguintes funções:
- `addRecurringMission()` - criar nova missão recorrente
- `updateRecurringMission()` - atualizar missão recorrente
- `deleteRecurringMission()` - deletar missão recorrente
- `toggleRecurringMissionStatus()` - ativar/desativar missão recorrente
- `updateAccumulatedTime()` - atualizar tempo acumulado
- `createRecurringMissionInstances()` - criar instâncias para uma semana específica

### 3. Modal de Adicionar Missão (`AddMissionModal.tsx`)
- Adicionado checkbox "Missão Recorrente"
- Quando marcado, a missão é criada como recorrente e aparece em todas as semanas
- Explicação visual sobre o que são missões recorrentes

### 4. Card de Missão (`MissionCard.tsx`)
- Badge visual indicando que a missão é recorrente
- Exibição do tempo total acumulado nas missões recorrentes
- Ícone de "Repeat" para identificação visual

### 5. Hook de Estatísticas (`useAllMissionsStats.ts`)
- Adicionado listener para missões recorrentes
- Novas interfaces:
  - `RecurringMissionStat` - estatística individual de missão recorrente
- Campos adicionados em `MissionsStats`:
  - `recurringMissions: RecurringMissionStat[]`
  - `totalRecurringMissions: number`

### 6. Modal de Informações Gerais (`MissionsInfoModal.tsx`)
- **Nova aba "Missões Recorrentes":**
  - Listagem de todas as missões recorrentes
  - Exibição do tempo total acumulado para cada uma
  - Indicador visual (barra de progresso) para cada missão
  - Explicação sobre o que são missões recorrentes

### 7. Hook de Missões (`useMissions.ts`)
- Modificado `stopTimer()` para sincronizar tempo acumulado:
  - Quando uma missão recorrente ganha tempo, atualiza o template recorrente
  - Atualiza o `accumulatedTime` em todas as instâncias da mesma missão recorrente

### 8. Página de Missões (`app/(dashboard)/missoes/page.tsx`)
- Integração com `useRecurringMissions`
- `handleAddRecurringMission()` - handler para adicionar missões recorrentes
- Efeito para criar instâncias automaticamente ao trocar de semana
- Prop `onAddRecurring` passada para `AddMissionModal`

### 9. Regras de Segurança Firestore (`firestore.rules`)
- Adicionadas regras para coleção `recurringMissions`
- Permissões de CRUD para usuários autenticados em suas próprias missões recorrentes

## Estrutura do Firestore

### Coleção: `users/{userId}/recurringMissions/{recurringMissionId}`
```
{
  userId: string
  title: string
  description?: string
  subject: string
  dayOfWeek: DayOfWeek
  createdAt: Timestamp
  isActive: boolean
  totalAccumulatedTime: number (em segundos)
}
```

### Coleção: `users/{userId}/missions/{missionId}`
Campos adicionados:
```
{
  ...
  isRecurring?: boolean
  recurringMissionId?: string
  accumulatedTime?: number
}
```

## Fluxo de Funcionamento

1. **Criação de Missão Recorrente:**
   - Usuário marca checkbox "Missão Recorrente" ao criar missão
   - Template é salvo em `recurringMissions`
   - Instância é criada automaticamente para a semana atual

2. **Troca de Semana:**
   - Hook detecta mudança de `weekStartDate`
   - Cria automaticamente instâncias de todas as missões recorrentes ativas
   - Cada instância começa com o `accumulatedTime` do template

3. **Registro de Tempo:**
   - Usuário trabalha em uma missão recorrente
   - Ao parar o timer:
     - Tempo é adicionado à missão da semana
     - Tempo é sincronizado com o template recorrente
     - `accumulatedTime` é atualizado em todas as instâncias

4. **Visualização de Estatísticas:**
   - Aba "Missões Recorrentes" mostra todas as missões recorrentes
   - Exibe o tempo total acumulado de cada uma
   - Permite acompanhar progresso ao longo do tempo

## Benefícios

1. **Automação:** Missões aparecem automaticamente todas as semanas
2. **Acompanhamento de Progresso:** Tempo acumulado permite ver progresso total
3. **Organização:** Ideal para atividades contínuas (ex: flash cards, leitura, etc.)
4. **Visibilidade:** Aba dedicada no modal de informações gerais
5. **Flexibilidade:** Pode ser ativada/desativada conforme necessário

## Próximas Melhorias Potenciais

1. Permitir editar missões recorrentes (atualizar todas as instâncias futuras)
2. Opção de pausar temporariamente missões recorrentes
3. Configurar frequência (ex: a cada 2 semanas, uma vez por mês)
4. Gráfico de progresso do tempo acumulado ao longo do tempo
5. Notificações quando missões recorrentes não são completadas
