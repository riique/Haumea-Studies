'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Dossier, ChapterNote } from '@/types/reading'

interface DossierModalProps {
  isOpen: boolean
  onClose: () => void
  bookTitle: string
  initialDossier: Dossier
  onSave: (dossier: Dossier) => Promise<void>
}

export function DossierModal({ isOpen, onClose, bookTitle, initialDossier, onSave }: DossierModalProps) {
  const [summary, setSummary] = useState('')
  const [chapters, setChapters] = useState<ChapterNote[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSummary(initialDossier.finalSummary || '')
      setChapters(initialDossier.chapterNotes?.length > 0 ? [...initialDossier.chapterNotes] : [])
    }
  }, [isOpen, initialDossier])

  if (!isOpen) return null

  const addChapter = () => setChapters([...chapters, { chapterName: '', notes: '' }])
  const rmChapter = (i: number) => setChapters(chapters.filter((_, idx) => idx !== i))

  const editChapter = (i: number, field: 'chapterName' | 'notes', val: string) => {
    const next = [...chapters]
    next[i][field] = val
    setChapters(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const valid = chapters.filter(c => c.chapterName.trim() || c.notes.trim())
      await onSave({ finalSummary: summary.trim(), chapterNotes: valid })
      onClose()
    } catch {
      alert('Erro ao salvar dossiê.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => { if (!submitting) onClose() }

  return (
    <div className="lt-modal-backdrop" onClick={handleClose}>
      <div className="lt-modal-sheet lt-modal-sheet--wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lt-modal-head" style={{ position: 'sticky', top: 0, background: 'hsl(var(--card))', zIndex: 10, paddingBottom: '0.75rem', borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="lt-modal-title">Dossiê Estratégico</h2>
            <p className="lt-modal-sub">{bookTitle}</p>
          </div>
          <button onClick={handleClose} disabled={submitting} className="lt-modal-x">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lt-modal-body">
          {/* Summary */}
          <div className="lt-modal-field">
            <label className="lt-modal-label">Resumo estratégico</label>
            <p className="lt-modal-hint">Resumo consolidado para revisão rápida antes das provas</p>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Personagens, temas, simbolismos, contexto histórico, pontos de prova…"
              disabled={submitting}
              rows={6}
              className="lt-modal-textarea"
            />
          </div>

          {/* Chapters */}
          <div className="lt-modal-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <span className="lt-modal-label">Análise por capítulo</span>
                <p className="lt-modal-hint" style={{ marginTop: '0.125rem' }}>Notas e análises de cada capítulo</p>
              </div>
              <button
                type="button"
                onClick={addChapter}
                disabled={submitting}
                className="lt-chapter-add"
              >
                <Plus className="w-3.5 h-3.5" />
                Capítulo
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="lt-chapter-empty">
                Nenhum capítulo adicionado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {chapters.map((ch, i) => (
                  <div key={i} className="lt-chapter-card">
                    <div className="lt-chapter-head">
                      <input
                        type="text"
                        value={ch.chapterName}
                        onChange={e => editChapter(i, 'chapterName', e.target.value)}
                        placeholder={`Capítulo ${i + 1}`}
                        disabled={submitting}
                        className="lt-chapter-input"
                      />
                      <button
                        type="button"
                        onClick={() => rmChapter(i)}
                        disabled={submitting}
                        className="lt-chapter-rm"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={ch.notes}
                      onChange={e => editChapter(i, 'notes', e.target.value)}
                      placeholder="Eventos, personagens, temas explorados…"
                      disabled={submitting}
                      rows={3}
                      className="lt-chapter-notes"
                    />
                  </div>
                ))}
              </div>
            )}
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
            disabled={submitting}
            className="lt-modal-btn lt-modal-btn--primary"
          >
            {submitting ? 'Salvando…' : 'Salvar Dossiê'}
          </button>
        </div>
      </div>
    </div>
  )
}
