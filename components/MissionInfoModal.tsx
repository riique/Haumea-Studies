'use client'

import { X, Tag, Calendar, FileText, Clock, RotateCcw } from 'lucide-react'
import { Mission, DayOfWeek } from '@/types/mission'
import { createPortal } from 'react-dom'

interface MissionInfoModalProps {
  isOpen: boolean
  onClose: () => void
  mission: Mission
  dayLabel?: string
}

const DAY_NAMES: Record<DayOfWeek, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '0m'
}

export function MissionInfoModal({ isOpen, onClose, mission, dayLabel }: MissionInfoModalProps) {
  if (!isOpen) return null

  const day = dayLabel || (mission.dayOfWeek ? DAY_NAMES[mission.dayOfWeek] : null)
  const time = mission.timeSpent || 0
  const accumulated = mission.accumulatedTime || 0

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet modal-sheet--narrow" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{mission.title}</h2>
          <button onClick={onClose} className="modal-close"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Meta chips */}
          <div className="modal-info-chips">
            <div className="modal-info-chip">
              <Tag className="w-3 h-3" />
              <span>{mission.subject}</span>
            </div>
            {day && (
              <div className="modal-info-chip">
                <Calendar className="w-3 h-3" />
                <span>{day}</span>
              </div>
            )}
            {mission.isRecurring && (
              <div className="modal-info-chip modal-info-chip--accent">
                <RotateCcw className="w-3 h-3" />
                <span>Recorrente</span>
              </div>
            )}
            <div className={`modal-info-chip ${mission.status === 'concluido' ? 'modal-info-chip--done' : ''}`}>
              <span>{mission.status === 'concluido' ? 'Concluído' : 'Pendente'}</span>
            </div>
          </div>

          {/* Time */}
          {(time > 0 || accumulated > 0) && (
            <div className="modal-info-time">
              {time > 0 && (
                <div className="modal-info-time-item">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="modal-info-time-value">{fmtTime(time)}</span>
                    <span className="modal-info-time-label">esta semana</span>
                  </div>
                </div>
              )}
              {accumulated > 0 && (
                <div className="modal-info-time-item">
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <span className="modal-info-time-value">{fmtTime(accumulated)}</span>
                    <span className="modal-info-time-label">acumulado</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {mission.description && (
            <div className="modal-info-desc">
              <div className="modal-info-desc-label">
                <FileText className="w-3 h-3" />
                <span>Descrição</span>
              </div>
              <p className="modal-info-desc-text">{mission.description}</p>
            </div>
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
