'use client'

import { X, Clock, Target, RotateCcw } from 'lucide-react'
import { createPortal } from 'react-dom'
import { MissionsStats } from '@/hooks/useAllMissionsStats'
import { useState } from 'react'

interface MissionsInfoModalProps {
  isOpen: boolean
  onClose: () => void
  stats: MissionsStats
  loading: boolean
}

type Tab = 'geral' | 'matérias' | 'dias' | 'semanas' | 'recorrentes'

const TABS: { key: Tab; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'matérias', label: 'Matérias' },
  { key: 'dias', label: 'Dias' },
  { key: 'semanas', label: 'Semanas' },
  { key: 'recorrentes', label: 'Recorrentes' },
]

function fmt(h: number, m: number): string {
  if (h === 0 && m === 0) return '0m'
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function MissionsInfoModal({ isOpen, onClose, stats, loading }: MissionsInfoModalProps) {
  const [tab, setTab] = useState<Tab>('geral')

  if (!isOpen) return null

  const pct = stats.totalMissions > 0
    ? Math.round((stats.completedMissions / stats.totalMissions) * 100) : 0

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet modal-sheet--wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Estatísticas</h2>
            <p className="modal-subtitle">Visão geral de todas as missões</p>
          </div>
          <button onClick={onClose} className="modal-close"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`modal-tab ${tab === t.key ? 'modal-tab--active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body modal-body--scroll">
          {loading ? (
            <div className="modal-loading">
              <div className="modal-spinner" />
            </div>
          ) : (
            <>
              {/* ── Geral ── */}
              {tab === 'geral' && (
                <div className="stats-grid">
                  <div className="stats-card">
                    <Clock className="stats-card-icon" />
                    <div className="stats-card-value">{fmt(stats.totalHours, stats.totalMinutes)}</div>
                    <div className="stats-card-label">Tempo total</div>
                  </div>
                  <div className="stats-card">
                    <Target className="stats-card-icon" />
                    <div className="stats-card-value">{stats.totalMissions}</div>
                    <div className="stats-card-label">Missões totais</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-card-icon stats-card-icon--done">✓</div>
                    <div className="stats-card-value">{stats.completedMissions}</div>
                    <div className="stats-card-label">{pct}% concluídas</div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-card-icon stats-card-icon--pending">○</div>
                    <div className="stats-card-value">{stats.pendingMissions}</div>
                    <div className="stats-card-label">Pendentes</div>
                  </div>
                  <div className="stats-card">
                    <Clock className="stats-card-icon" />
                    <div className="stats-card-value">{fmt(stats.averageTimePerMission.hours, stats.averageTimePerMission.minutes)}</div>
                    <div className="stats-card-label">Média por missão</div>
                  </div>
                </div>
              )}

              {/* ── Matérias ── */}
              {tab === 'matérias' && (
                <div className="stats-list">
                  {stats.subjectStats.length === 0 ? (
                    <p className="stats-empty">Nenhuma matéria registrada</p>
                  ) : stats.subjectStats.map(s => (
                    <div key={s.subject} className="stats-row">
                      <div className="stats-row-main">
                        <span className="stats-row-name">{s.subject}</span>
                        <span className="stats-row-meta">{s.missionCount} missões</span>
                      </div>
                      <div className="stats-bar-wrap">
                        <div className="stats-bar">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${Math.min(100, (s.totalHours * 60 + s.totalMinutes) / Math.max(1, stats.subjectStats[0].totalHours * 60 + stats.subjectStats[0].totalMinutes) * 100)}%` }}
                          />
                        </div>
                        <span className="stats-row-value">{fmt(s.totalHours, s.totalMinutes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Dias ── */}
              {tab === 'dias' && (
                <div className="stats-list">
                  {stats.dayStats.map(d => {
                    const maxMinutes = Math.max(...stats.dayStats.map(x => x.totalHours * 60 + x.totalMinutes), 1)
                    const thisMinutes = d.totalHours * 60 + d.totalMinutes
                    return (
                      <div key={d.day} className="stats-row">
                        <div className="stats-row-main">
                          <span className="stats-row-name">{d.label}</span>
                          <span className="stats-row-meta">{d.missionCount} missões</span>
                        </div>
                        <div className="stats-bar-wrap">
                          <div className="stats-bar">
                            <div className="stats-bar-fill" style={{ width: `${(thisMinutes / maxMinutes) * 100}%` }} />
                          </div>
                          <span className="stats-row-value">{fmt(d.totalHours, d.totalMinutes)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Semanas ── */}
              {tab === 'semanas' && (
                <div className="stats-comparison">
                  <div className="stats-comp-row">
                    <div className="stats-comp-card">
                      <span className="stats-comp-label">Esta semana</span>
                      <span className="stats-comp-value">{fmt(stats.weeklyComparison.currentWeekHours, stats.weeklyComparison.currentWeekMinutes)}</span>
                    </div>
                    <div className="stats-comp-card">
                      <span className="stats-comp-label">Semana anterior</span>
                      <span className="stats-comp-value">{fmt(stats.weeklyComparison.previousWeekHours, stats.weeklyComparison.previousWeekMinutes)}</span>
                    </div>
                  </div>
                  <div className="stats-comp-delta">
                    <span className={`stats-comp-delta-value ${stats.weeklyComparison.percentageChange > 0 ? 'stats-comp-delta--up' :
                      stats.weeklyComparison.percentageChange < 0 ? 'stats-comp-delta--down' : ''
                      }`}>
                      {stats.weeklyComparison.percentageChange > 0 ? '+' : ''}{stats.weeklyComparison.percentageChange}%
                    </span>
                    <span className="stats-comp-delta-label">
                      {stats.weeklyComparison.percentageChange > 0
                        ? 'a mais que a semana anterior'
                        : stats.weeklyComparison.percentageChange < 0
                          ? 'a menos que a semana anterior'
                          : 'mesmo ritmo'}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Recorrentes ── */}
              {tab === 'recorrentes' && (
                <div className="stats-list">
                  {stats.recurringMissions.length === 0 ? (
                    <div className="stats-empty-block">
                      <RotateCcw className="w-8 h-8 text-muted-foreground" />
                      <p className="stats-empty">Nenhuma missão recorrente</p>
                      <p className="stats-empty-hint">Crie missões recorrentes para acompanhar o progresso ao longo do tempo</p>
                    </div>
                  ) : stats.recurringMissions.map(m => (
                    <div key={m.id} className="stats-row">
                      <div className="stats-row-main">
                        <span className="stats-row-name">{m.title}</span>
                        <span className="stats-row-meta">acumulado total</span>
                      </div>
                      <div className="stats-bar-wrap">
                        <div className="stats-bar">
                          <div
                            className="stats-bar-fill"
                            style={{ width: m.totalAccumulatedTime > 0 ? '100%' : '0%' }}
                          />
                        </div>
                        <span className="stats-row-value">
                          {m.totalAccumulatedTime > 0 ? `${m.totalAccumulatedHours}h ${m.totalAccumulatedMinutes}m` : '0m'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn-outline">Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
