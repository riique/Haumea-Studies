'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

interface MissionTimerProps {
  missionId: string
  timeSpent: number
  isRunning: boolean
  timerStartedAt?: Date
  onStart: () => void
  onStop: (totalTime: number) => void
  isCompleted: boolean
}

export function MissionTimer({
  missionId, timeSpent, isRunning, timerStartedAt, onStart, onStop, isCompleted,
}: MissionTimerProps) {
  const [current, setCurrent] = useState(timeSpent)
  const hasSelfHealed = useRef(false)

  // Refs para usar em listeners que não podem depender do ciclo de renderização
  const isRunningRef = useRef(isRunning)
  const currentRef = useRef(current)
  const timeSpentRef = useRef(timeSpent)

  useEffect(() => {
    isRunningRef.current = isRunning
    currentRef.current = current
    timeSpentRef.current = timeSpent
  }, [isRunning, current, timeSpent])

  // Lógica principal do tick contínuo (Resiliente a throttling do navegador)
  useEffect(() => {
    let tick: NodeJS.Timeout;

    if (isRunning && timerStartedAt) {
      tick = setInterval(() => {
        // Usa timestamp absoluto, assim se o navegador throttlar a aba (ex: Chrome background mode),
        // o cálculo de tempo permanece exato ao voltar o foco.
        const elapsed = Math.floor((Date.now() - timerStartedAt.getTime()) / 1000)
        setCurrent(timeSpent + Math.max(0, elapsed))
      }, 1000)
    } else {
      setCurrent(timeSpent)
    }

    return () => {
      if (tick) clearInterval(tick)
    }
  }, [isRunning, timerStartedAt, timeSpent])

  // Lógica de commit offline-first (salva automático se aba fechada)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunningRef.current) {
        // PWA Offline-First Behavior:
        // Se a aba fechar abruptamente, tentamos chamar o stop on unload. 
        // Com initializeFirestore({ localCache }), isso entra na fila do IndexedDB sincronamente, salvando o estudo do usuário offline.
        onStop(currentRef.current)
      }
    }

    const handleVisibilityChange = () => {
      // Extra protection mobile: se minimizar app (iOS Safari), ele suspende the javascript execution
      if (document.visibilityState === 'hidden') {
        // Guardamos o estado de emergência localmente
        localStorage.setItem(`haumea_timer_backup_${missionId}`, JSON.stringify({
          timeSpent: currentRef.current,
          lastSeen: Date.now()
        }))
      } else {
        localStorage.removeItem(`haumea_timer_backup_${missionId}`)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [missionId, onStop])

  // Lógica de Self-Healing (Crash recovery)
  // Se o browser do Safari Mobile "capar" a aba sem disparar beforeUnload, 
  // o timer ficaria rodando. Quando o user reabre, paramos e recuperamos o último timestamp útil.
  useEffect(() => {
    if (isRunning && !hasSelfHealed.current) {
      hasSelfHealed.current = true;
      const emergencyBackup = localStorage.getItem(`haumea_timer_backup_${missionId}`);

      if (emergencyBackup) {
        try {
          const { timeSpent: bTime, lastSeen } = JSON.parse(emergencyBackup);
          const limit15Min = 15 * 60 * 1000;

          // Se a última vez visto for há mais de 15 minutos e o Firebase acha que tá rodando, ocorreu um crash.
          if (Date.now() - lastSeen > limit15Min) {
            onStop(bTime);
            localStorage.removeItem(`haumea_timer_backup_${missionId}`);
          }
        } catch (e) {
          console.error("Erro ao recuperar backup do timer", e);
        }
      }
    }
  }, [isRunning, missionId, onStop])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
  }

  const toggle = () => isRunning ? onStop(currentRef.current) : onStart()

  if (isCompleted && current === 0) return null

  return (
    <div className="timer-wrap">
      <button
        onClick={toggle}
        disabled={isCompleted}
        className={`timer-btn ${isCompleted ? 'timer-btn--off' : isRunning ? 'timer-btn--active' : ''}`}
        title={isRunning ? 'Parar' : 'Iniciar'}
      >
        {isRunning
          ? <Pause className="w-2.5 h-2.5" fill="currentColor" />
          : <Play className="w-2.5 h-2.5" fill="currentColor" />
        }
      </button>
      <span className={`timer-value ${isRunning ? 'timer-value--active' : ''}`}>
        {fmt(current)}
      </span>
    </div>
  )
}
