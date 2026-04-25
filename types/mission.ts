export type DayOfWeek = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'

export type MissionStatus = 'pendente' | 'concluido'

export interface Mission {
  id: string
  userId: string
  title: string
  description?: string // Descrição opcional da missão
  subject: string
  weekStartDate: string // Formato: YYYY-MM-DD (segunda-feira da semana)
  dayOfWeek?: DayOfWeek // Opcional para missões recorrentes
  status: MissionStatus
  createdAt: Date
  timeSpent?: number // Tempo total gasto em segundos
  isTimerRunning?: boolean // Se o timer está ativo
  timerStartedAt?: Date // Quando o timer foi iniciado pela última vez
  isRecurring?: boolean // Se a missão é recorrente (aparece todas as semanas)
  recurringMissionId?: string // ID da missão recorrente original (template)
  accumulatedTime?: number // Tempo acumulado de todas as semanas anteriores (apenas para missões recorrentes)
}

// Categoria de missões recorrentes - para organizar missões em grupos
export interface RecurringMissionCategory {
  id: string
  userId: string
  name: string // Ex: "Livros", "Flash Cards", "Exercícios"
  color?: string // Cor opcional para a categoria (hex)
  createdAt: Date
  order: number // Ordem de exibição
}

// Missão recorrente - template que será copiado para todas as semanas
// Missões recorrentes não têm dia da semana nem matéria específicos - são tarefas genéricas
export interface RecurringMission {
  id: string
  userId: string
  title: string
  description?: string
  categoryId?: string // ID da categoria (opcional)
  createdAt: Date
  isActive: boolean // Se a missão recorrente está ativa
  totalAccumulatedTime: number // Tempo total acumulado em todas as semanas (em segundos)
}

export interface WeeklySchedule {
  id: string
  userId: string
  weekStartDate: string // Formato: YYYY-MM-DD (segunda-feira da semana)
  content: string // Conteúdo da programação
  createdAt: Date
  updatedAt: Date
}
