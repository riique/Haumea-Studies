'use client'

import { useState } from 'react'
import { BookOpen, FileText, Trash2, GraduationCap } from 'lucide-react'
import { Reading, ReadingStatus } from '@/types/reading'
import { ConfirmDialog } from './ConfirmDialog'

interface BookCardProps {
  reading: Reading
  onStatusChange: (status: ReadingStatus) => void
  onOpenDossier: () => void
  onDelete: () => void
}

const STATUS_CONFIG = {
  nao_lido: {
    label: 'Não Lido',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
  lendo: {
    label: 'Lendo',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  concluido: {
    label: 'Concluído',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
}

export function BookCard({ reading, onStatusChange, onOpenDossier, onDelete }: BookCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const statusConfig = STATUS_CONFIG[reading.status]

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    onDelete()
  }

  return (
    <div 
      className={`
        border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg
        ${statusConfig.bgColor} ${statusConfig.borderColor}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
            <BookOpen className={`w-5 h-5 ${statusConfig.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">
              {reading.bookTitle}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              <span>{reading.institution}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{reading.pageCount} páginas</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDeleteClick}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Excluir livro"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pre-summary (if exists) */}
      {reading.preSummary && (
        <div className="mb-4 p-3 bg-background/50 border border-border rounded-lg">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {reading.preSummary}
          </p>
        </div>
      )}

      {/* Status Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-foreground mb-2">
          Status de Leitura
        </label>
        <select
          value={reading.status}
          onChange={(e) => onStatusChange(e.target.value as ReadingStatus)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
        >
          <option value="nao_lido">Não Lido</option>
          <option value="lendo">Lendo</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      {/* Dossier Button */}
      <button
        onClick={onOpenDossier}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        <FileText className="w-4 h-4" />
        Ver/Editar Dossiê
      </button>

      {/* Dossier Progress Indicator */}
      {(reading.dossier.finalSummary || reading.dossier.chapterNotes.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>
              Dossiê: {reading.dossier.finalSummary ? '✓ Resumo' : ''}
              {reading.dossier.finalSummary && reading.dossier.chapterNotes.length > 0 ? ' | ' : ''}
              {reading.dossier.chapterNotes.length > 0 
                ? `${reading.dossier.chapterNotes.length} capítulo${reading.dossier.chapterNotes.length > 1 ? 's' : ''}`
                : ''
              }
            </span>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Leitura"
        description={`Tem certeza que deseja excluir "${reading.bookTitle}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
