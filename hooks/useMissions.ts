'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Mission, DayOfWeek, MissionStatus, WeeklySchedule } from '@/types/mission'

export function useMissions(weekStartDate: string) {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setMissions([])
      setLoading(false)
      return
    }

    const missionsRef = collection(db, 'users', user.uid, 'missions')
    const q = query(
      missionsRef,
      where('weekStartDate', '==', weekStartDate),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missionsData = snapshot.docs.map((doc) => {
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
          recurringMissionId: data.recurringMissionId || undefined,
          accumulatedTime: data.accumulatedTime || undefined,
        } as Mission
      })
      setMissions(missionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, weekStartDate])

  const addMission = async (
    title: string,
    subject: string,
    dayOfWeek: DayOfWeek,
    weekStartDate: string,
    description?: string
  ) => {
    if (!user) return

    const missionsRef = collection(db, 'users', user.uid, 'missions')
    const missionData: any = {
      userId: user.uid,
      title,
      subject,
      weekStartDate,
      dayOfWeek,
      status: 'pendente' as MissionStatus,
      createdAt: Timestamp.now(),
      timeSpent: 0,
      isTimerRunning: false,
    }

    // Adicionar descrição apenas se fornecida
    if (description && description.trim()) {
      missionData.description = description.trim()
    }

    await addDoc(missionsRef, missionData)
  }

  const updateMissionStatus = async (missionId: string, status: MissionStatus) => {
    if (!user) return
    const missionRef = doc(db, 'users', user.uid, 'missions', missionId)
    await updateDoc(missionRef, { status })
  }

  const updateMission = async (
    missionId: string,
    title: string,
    subject: string,
    description?: string
  ) => {
    if (!user) return
    const missionRef = doc(db, 'users', user.uid, 'missions', missionId)

    const updateData: any = {
      title: title.trim(),
      subject: subject.trim(),
    }

    // Only update description if provided, otherwise remove it
    if (description && description.trim()) {
      updateData.description = description.trim()
    } else {
      updateData.description = null
    }

    await updateDoc(missionRef, updateData)
  }

  const deleteMission = async (missionId: string) => {
    if (!user) return

    // Buscar a missão para verificar se é recorrente
    const mission = missions.find(m => m.id === missionId)

    if (mission?.isRecurring && mission.recurringMissionId) {
      // Se é uma missão recorrente, deletar o template e todas as instâncias
      const recurringMissionId = mission.recurringMissionId

      // Deletar o template
      const recurringMissionRef = doc(db, 'users', user.uid, 'recurringMissions', recurringMissionId)
      await deleteDoc(recurringMissionRef)

      // Deletar todas as instâncias desta missão recorrente
      const missionsRef = collection(db, 'users', user.uid, 'missions')
      const q = query(
        missionsRef,
        where('recurringMissionId', '==', recurringMissionId)
      )
      const snapshot = await getDocs(q)
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
    } else {
      // Missão normal, deletar apenas esta instância
      const missionRef = doc(db, 'users', user.uid, 'missions', missionId)
      await deleteDoc(missionRef)
    }
  }

  const startTimer = async (missionId: string) => {
    if (!user) return
    const missionRef = doc(db, 'users', user.uid, 'missions', missionId)
    await updateDoc(missionRef, {
      isTimerRunning: true,
      timerStartedAt: Timestamp.now(),
    })
  }

  const stopTimer = async (missionId: string, currentTimeSpent: number) => {
    if (!user) return

    // Buscar a missão para verificar se é recorrente
    const mission = missions.find(m => m.id === missionId)
    const previousTimeSpent = mission?.timeSpent || 0
    const timeAdded = currentTimeSpent - previousTimeSpent

    const missionRef = doc(db, 'users', user.uid, 'missions', missionId)
    await updateDoc(missionRef, {
      isTimerRunning: false,
      timeSpent: currentTimeSpent,
      timerStartedAt: null,
    })

    // Se for missão recorrente, atualizar o tempo acumulado no template
    if (mission?.isRecurring && mission.recurringMissionId && timeAdded > 0) {
      const recurringMissionRef = doc(db, 'users', user.uid, 'recurringMissions', mission.recurringMissionId)
      const recurringMissionSnap = await getDocs(query(
        collection(db, 'users', user.uid, 'recurringMissions'),
        where('__name__', '==', mission.recurringMissionId)
      ))

      if (!recurringMissionSnap.empty) {
        const recurringMissionData = recurringMissionSnap.docs[0].data()
        const newTotalTime = (recurringMissionData.totalAccumulatedTime || 0) + timeAdded
        await updateDoc(recurringMissionRef, {
          totalAccumulatedTime: newTotalTime
        })

        // Atualizar accumulatedTime em todas as instâncias desta missão recorrente
        const allInstancesQuery = query(
          collection(db, 'users', user.uid, 'missions'),
          where('recurringMissionId', '==', mission.recurringMissionId)
        )
        const instancesSnap = await getDocs(allInstancesQuery)
        instancesSnap.docs.forEach(async (docSnap) => {
          await updateDoc(doc(db, 'users', user.uid, 'missions', docSnap.id), {
            accumulatedTime: newTotalTime
          })
        })
      }
    }
  }

  const getWeeklySchedule = async (weekStartDate: string): Promise<WeeklySchedule | null> => {
    if (!user) return null

    const schedulesRef = collection(db, 'users', user.uid, 'weeklySchedules')
    const q = query(
      schedulesRef,
      where('weekStartDate', '==', weekStartDate)
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      userId: data.userId,
      weekStartDate: data.weekStartDate,
      content: data.content,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as WeeklySchedule
  }

  const saveWeeklySchedule = async (weekStartDate: string, content: string): Promise<void> => {
    if (!user) return

    const schedulesRef = collection(db, 'users', user.uid, 'weeklySchedules')
    const q = query(
      schedulesRef,
      where('weekStartDate', '==', weekStartDate)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Criar novo documento
      await addDoc(schedulesRef, {
        userId: user.uid,
        weekStartDate,
        content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Atualizar documento existente
      const scheduleRef = doc(db, 'users', user.uid, 'weeklySchedules', snapshot.docs[0].id)
      await updateDoc(scheduleRef, {
        content,
        updatedAt: Timestamp.now(),
      })
    }
  }

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
    moveMissionToDay,
  }
}
