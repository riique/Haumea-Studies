'use client'

import { useState, useEffect, useCallback } from 'react'
import { Exam } from '@/types/exam'
import { Trash2, CheckCircle2, Circle } from 'lucide-react'

interface ExamCountdownProps {
  exam: Exam
  onDelete: (examId: string) => Promise<void>
}

interface DayCountdown {
  label: string
  daysLeft: number
  percentage: number
  completed: boolean
}

export default function ExamCountdown({ exam, onDelete }: ExamCountdownProps) {
  const [mounted, setMounted] = useState(false)
  const [day1Countdown, setDay1Countdown] = useState<DayCountdown | null>(null)
  const [day2Countdown, setDay2Countdown] = useState<DayCountdown | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const calculateCountdown = () => {
      const now = new Date()
      // Definir data alvo para o progresso (data mais distante entre Dia 1 e Dia 2)
      let targetExamDate: Date | null = null

      if (exam.day1) {
        targetExamDate = new Date(exam.day1.date)
      }

      if (exam.day2) {
        const day2Date = new Date(exam.day2.date)
        if (!targetExamDate || day2Date > targetExamDate) {
          targetExamDate = day2Date
        }
      }

      let sharedPercent = 0

      if (targetExamDate) {
        // Janela de 1 ano antes da prova até a data da prova
        const startDate = new Date(targetExamDate)
        startDate.setFullYear(startDate.getFullYear() - 1)

        const totalMs = targetExamDate.getTime() - startDate.getTime()
        const elapsedMs = now.getTime() - startDate.getTime()

        sharedPercent = totalMs > 0
          ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
          : 0
      }

      // Calcular Dia 1 (dias restantes + aplicar progresso compartilhado)
      if (exam.day1) {
        const examDate = new Date(exam.day1.date)
        const timeDiff = examDate.getTime() - now.getTime()
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

        setDay1Countdown({
          label: 'Dia 1',
          daysLeft: Math.max(0, days),
          percentage: sharedPercent,
          completed: exam.day1.completed || false
        })
      }

      // Calcular Dia 2 (dias restantes + aplicar progresso compartilhado)
      if (exam.day2) {
        const examDate = new Date(exam.day2.date)
        const timeDiff = examDate.getTime() - now.getTime()
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

        setDay2Countdown({
          label: 'Dia 2',
          daysLeft: Math.max(0, days),
          percentage: sharedPercent,
          completed: exam.day2.completed || false
        })
      }
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)
    return () => clearInterval(interval)
  }, [exam, mounted])

  const handleDelete = useCallback(async () => {
    if (confirm(`Tem certeza que deseja remover "${exam.name}"?`)) {
      setDeleting(true)
      try {
        await onDelete(exam.id)
      } catch (error) {
        console.error('Erro ao deletar:', error)
        setDeleting(false)
      }
    }
  }, [exam.id, exam.name, onDelete])

  const renderDaySection = (countdown: DayCountdown | null, label: string) => {
    if (!countdown) return null

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-semibold text-foreground mb-4">{label}</h4>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          {label === 'Dia 1' && exam.day1
            ? new Date(exam.day1.date).toLocaleDateString('pt-BR', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })
            : label === 'Dia 2' && exam.day2
            ? new Date(exam.day2.date).toLocaleDateString('pt-BR', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })
            : ''}
        </p>
        
        {/* Circular Progress */}
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-secondary"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={`url(#gradient-${label})`}
              strokeWidth="8"
              strokeDasharray={`${(countdown.percentage / 100) * 339.29} 339.29`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                <stop offset="100%" stopColor="rgb(139, 92, 246)" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{countdown.daysLeft}</div>
              <div className="text-xs text-muted-foreground">dias</div>
            </div>
          </div>
        </div>

      </div>
    )
  }

  if (!mounted) return null

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{exam.name}</h3>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
          title="Remover vestibular"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {day1Countdown || day2Countdown ? (
        <>
          <div className="grid grid-cols-2 gap-6">
            {renderDaySection(day1Countdown, 'Dia 1')}
            {renderDaySection(day2Countdown, 'Dia 2')}
          </div>
          <div className="mt-6 bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Progresso até o vestibular</p>
            <p className="text-2xl font-bold text-foreground">
              {Math.round((day1Countdown?.percentage ?? day2Countdown?.percentage ?? 0))}%
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
