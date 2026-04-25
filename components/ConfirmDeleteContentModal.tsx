'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDeleteContentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  contentName: string
  isDeleting?: boolean
}

export function ConfirmDeleteContentModal({
  isOpen,
  onClose,
  onConfirm,
  contentName,
  isDeleting = false
}: ConfirmDeleteContentModalProps) {
  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Confirmar Exclusão</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Tem certeza que deseja deletar o conteúdo programático?
            </p>
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground break-words">
                {contentName}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta ação não pode ser desfeita. Todos os dados associados a este conteúdo serão permanentemente removidos.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deletando...' : 'Deletar'}
          </button>
        </div>
      </div>
    </div>
  )
}
