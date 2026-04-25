'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AddBookModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (bookTitle: string, institution: string, pageCount: number, preSummary?: string) => Promise<void>
}

export function AddBookModal({ isOpen, onClose, onAdd }: AddBookModalProps) {
  const [bookTitle, setBookTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [preSummary, setPreSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const reset = () => {
    setBookTitle('')
    setInstitution('')
    setPageCount('')
    setPreSummary('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookTitle.trim() || !institution.trim() || !pageCount) return

    const pages = parseInt(pageCount)
    if (isNaN(pages) || pages <= 0) return

    setSubmitting(true)
    try {
      await onAdd(bookTitle.trim(), institution.trim(), pages, preSummary.trim() || undefined)
      reset()
      onClose()
    } catch {
      alert('Erro ao adicionar livro.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) { reset(); onClose() }
  }

  return (
    <div className="lt-modal-backdrop" onClick={handleClose}>
      <div className="lt-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="lt-modal-head">
          <div>
            <h2 className="lt-modal-title">Novo Livro</h2>
            <p className="lt-modal-sub">Adicione uma leitura obrigatória</p>
          </div>
          <button onClick={handleClose} disabled={submitting} className="lt-modal-x">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lt-modal-body">
          <div className="lt-modal-field">
            <label className="lt-modal-label">Título *</label>
            <input
              type="text"
              value={bookTitle}
              onChange={e => setBookTitle(e.target.value)}
              placeholder="Ex: Dom Casmurro"
              disabled={submitting}
              className="lt-modal-input"
              required
              autoFocus
            />
          </div>

          <div className="lt-modal-field">
            <label className="lt-modal-label">Instituição *</label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="Ex: UNICAMP, FUVEST, ENEM"
              disabled={submitting}
              className="lt-modal-input"
              required
            />
          </div>

          <div className="lt-modal-field">
            <label className="lt-modal-label">Páginas *</label>
            <input
              type="number"
              min="1"
              value={pageCount}
              onChange={e => setPageCount(e.target.value)}
              placeholder="Ex: 256"
              disabled={submitting}
              className="lt-modal-input"
              required
            />
          </div>

          <div className="lt-modal-field">
            <label className="lt-modal-label">Resumo inicial</label>
            <p className="lt-modal-hint">Contexto sobre a obra — opcional</p>
            <textarea
              value={preSummary}
              onChange={e => setPreSummary(e.target.value)}
              placeholder="Trama, narrador, temas centrais…"
              disabled={submitting}
              rows={3}
              className="lt-modal-textarea"
            />
          </div>
        </form>

        <div className="lt-modal-actions">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="lt-modal-btn lt-modal-btn--secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={submitting || !bookTitle.trim() || !institution.trim() || !pageCount}
            className="lt-modal-btn lt-modal-btn--primary"
          >
            {submitting ? 'Adicionando…' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
