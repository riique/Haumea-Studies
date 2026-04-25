'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Mission, DayOfWeek } from '@/types/mission'

export interface SubjectStats {
  subject: string
  totalHours: number
  totalMinutes: number
  missionCount: number
}

export interface DayStats {
  day: DayOfWeek
  label: string
  totalHours: number
  totalMinutes: number
  missionCount: number
}

export interface WeeklyComparison {
  currentWeekHours: number
  currentWeekMinutes: number
  previousWeekHours: number
  previousWeekMinutes: number
  percentageChange: number
}

export interface RecurringMissionStat {
  id: string
  title: string
  categoryId?: string
  totalAccumulatedTime: number
  totalAccumulatedHours: number
  totalAccumulatedMinutes: number
}

export interface MissionsStats {
  totalMissions: number
  totalHours: number
  totalMinutes: number
  completedMissions: number
  pendingMissions: number
  averageTimePerMission: { hours: number; minutes: number }
  subjectStats: SubjectStats[]
  dayStats: DayStats[]
  weeklyComparison: WeeklyComparison
  recurringMissions: RecurringMissionStat[]
  totalRecurringMissions: number
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

function getWeekStartDate(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))

  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const dayStr = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${dayStr}`
}

export function useAllMissionsStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<MissionsStats>({
    totalMissions: 0,
    totalHours: 0,
    totalMinutes: 0,
    completedMissions: 0,
    pendingMissions: 0,
    averageTimePerMission: { hours: 0, minutes: 0 },
    subjectStats: [],
    dayStats: [],
    weeklyComparison: {
      currentWeekHours: 0,
      currentWeekMinutes: 0,
      previousWeekHours: 0,
      previousWeekMinutes: 0,
      percentageChange: 0,
    },
    recurringMissions: [],
    totalRecurringMissions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setStats({
        totalMissions: 0,
        totalHours: 0,
        totalMinutes: 0,
        completedMissions: 0,
        pendingMissions: 0,
        averageTimePerMission: { hours: 0, minutes: 0 },
        subjectStats: [],
        dayStats: [],
        weeklyComparison: {
          currentWeekHours: 0,
          currentWeekMinutes: 0,
          previousWeekHours: 0,
          previousWeekMinutes: 0,
          percentageChange: 0,
        },
        recurringMissions: [],
        totalRecurringMissions: 0,
      })
      setLoading(false)
      return
    }

    const missionsRef = collection(db, 'users', user.uid, 'missions')
    const q = query(missionsRef)

    // Também observar missões recorrentes
    const recurringMissionsRef = collection(db, 'users', user.uid, 'recurringMissions')
    const recurringQuery = query(recurringMissionsRef)

    let latestMissionsData: Mission[] = []
    let latestRecurringData: RecurringMissionStat[] = []

    const calculateStats = () => {
      const missionsData = latestMissionsData
      const recurringMissionsData = latestRecurringData

      // Filtrar missões não recorrentes para o cálculo de progresso
      const nonRecurringMissions = missionsData.filter(m => !m.isRecurring)

      // Calcular estatísticas gerais (excluindo missões recorrentes do progresso)
      const totalMissions = nonRecurringMissions.length
      const completedMissions = nonRecurringMissions.filter(m => m.status === 'concluido').length
      const pendingMissions = nonRecurringMissions.filter(m => m.status === 'pendente').length

      const totalTimeSpent = missionsData.reduce((sum, m) => sum + (m.timeSpent || 0), 0)
      const totalHours = Math.floor(totalTimeSpent / 3600)
      const totalMinutes = Math.floor((totalTimeSpent % 3600) / 60)

      // Calcular tempo médio por missão
      const averageTotalSeconds = totalMissions > 0 ? totalTimeSpent / totalMissions : 0
      const averageTimePerMission = {
        hours: Math.floor(averageTotalSeconds / 3600),
        minutes: Math.floor((averageTotalSeconds % 3600) / 60),
      }

      // Calcular estatísticas por disciplina
      const subjectMap = new Map<string, { hours: number; minutes: number; count: number }>()
      missionsData.forEach((mission) => {
        const current = subjectMap.get(mission.subject) || { hours: 0, minutes: 0, count: 0 }
        const timeSpent = mission.timeSpent || 0
        const hours = Math.floor(timeSpent / 3600)
        const minutes = Math.floor((timeSpent % 3600) / 60)

        current.hours += hours
        current.minutes += minutes
        current.count += 1

        // Normalizar minutos
        if (current.minutes >= 60) {
          current.hours += Math.floor(current.minutes / 60)
          current.minutes = current.minutes % 60
        }

        subjectMap.set(mission.subject, current)
      })

      const subjectStats: SubjectStats[] = Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
          subject,
          totalHours: data.hours,
          totalMinutes: data.minutes,
          missionCount: data.count,
        }))
        .sort((a, b) => {
          const aTotal = a.totalHours * 60 + a.totalMinutes
          const bTotal = b.totalHours * 60 + b.totalMinutes
          return bTotal - aTotal
        })

      // Calcular estatísticas por dia da semana
      const dayMap = new Map<DayOfWeek, { hours: number; minutes: number; count: number }>()
      const days: DayOfWeek[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']

      days.forEach(day => {
        dayMap.set(day, { hours: 0, minutes: 0, count: 0 })
      })

      missionsData.forEach((mission) => {
        // Ignorar missões recorrentes (que não têm dayOfWeek) no cálculo por dia
        if (!mission.dayOfWeek) return

        const current = dayMap.get(mission.dayOfWeek) || { hours: 0, minutes: 0, count: 0 }
        const timeSpent = mission.timeSpent || 0
        const hours = Math.floor(timeSpent / 3600)
        const minutes = Math.floor((timeSpent % 3600) / 60)

        current.hours += hours
        current.minutes += minutes
        current.count += 1

        // Normalizar minutos
        if (current.minutes >= 60) {
          current.hours += Math.floor(current.minutes / 60)
          current.minutes = current.minutes % 60
        }

        dayMap.set(mission.dayOfWeek, current)
      })

      const dayStats: DayStats[] = days.map(day => {
        const data = dayMap.get(day) || { hours: 0, minutes: 0, count: 0 }
        return {
          day,
          label: DAY_LABELS[day],
          totalHours: data.hours,
          totalMinutes: data.minutes,
          missionCount: data.count,
        }
      })

      // Calcular comparação semanal
      const currentWeekStart = getWeekStartDate(new Date())
      const previousWeekDate = new Date()
      previousWeekDate.setDate(previousWeekDate.getDate() - 7)
      const previousWeekStart = getWeekStartDate(previousWeekDate)

      const currentWeekMissions = missionsData.filter(m => m.weekStartDate === currentWeekStart)
      const previousWeekMissions = missionsData.filter(m => m.weekStartDate === previousWeekStart)

      const currentWeekTime = currentWeekMissions.reduce((sum, m) => sum + (m.timeSpent || 0), 0)
      const previousWeekTime = previousWeekMissions.reduce((sum, m) => sum + (m.timeSpent || 0), 0)

      const currentWeekHours = Math.floor(currentWeekTime / 3600)
      const currentWeekMinutes = Math.floor((currentWeekTime % 3600) / 60)
      const previousWeekHours = Math.floor(previousWeekTime / 3600)
      const previousWeekMinutes = Math.floor((previousWeekTime % 3600) / 60)

      const currentWeekTotal = currentWeekHours * 60 + currentWeekMinutes
      const previousWeekTotal = previousWeekHours * 60 + previousWeekMinutes
      const percentageChange = previousWeekTotal > 0
        ? Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
        : 0

      setStats({
        totalMissions,
        totalHours,
        totalMinutes,
        completedMissions,
        pendingMissions,
        averageTimePerMission,
        subjectStats,
        dayStats,
        weeklyComparison: {
          currentWeekHours,
          currentWeekMinutes,
          previousWeekHours,
          previousWeekMinutes,
          percentageChange,
        },
        recurringMissions: recurringMissionsData,
        totalRecurringMissions: recurringMissionsData.length,
      })
      setLoading(false)
    }

    // Listener para missões normais
    const unsubscribeMissions = onSnapshot(q, (missionsSnapshot) => {
      latestMissionsData = missionsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description || undefined,
          subject: data.subject,
          weekStartDate: data.weekStartDate,
          dayOfWeek: data.dayOfWeek,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          timeSpent: data.timeSpent || 0,
          isTimerRunning: data.isTimerRunning || false,
          timerStartedAt: data.timerStartedAt?.toDate() || undefined,
          isRecurring: data.isRecurring || false,
        } as Mission
      })
      calculateStats()
    })

    // Listener para missões recorrentes
    const unsubscribeRecurring = onSnapshot(recurringQuery, (recurringSnapshot) => {
      latestRecurringData = recurringSnapshot.docs.map((doc) => {
        const data = doc.data()
        const totalTime = data.totalAccumulatedTime || 0
        return {
          id: doc.id,
          title: data.title,
          categoryId: data.categoryId || undefined,
          totalAccumulatedTime: totalTime,
          totalAccumulatedHours: Math.floor(totalTime / 3600),
          totalAccumulatedMinutes: Math.floor((totalTime % 3600) / 60),
        }
      }).sort((a, b) => b.totalAccumulatedTime - a.totalAccumulatedTime)
      calculateStats()
    })

    return () => {
      unsubscribeMissions()
      unsubscribeRecurring()
    }
  }, [user])

  return { stats, loading }
}
