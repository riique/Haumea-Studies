'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, FolderPlus } from 'lucide-react'
import { Mission, RecurringMissionCategory } from '@/types/mission'
import { useMaterias, useCategorias } from '@/hooks/useFirestoreData'

interface EditMissionModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (missionId: string, title: string, subject: string, description?: string) => Promise<void>
  onUpdateRecurringCategory?: (recurringMissionId: string, categoryId: string | null) => Promise<void>
  onAddCategory?: (name: string, color?: string) => Promise<string | undefined>
  recurringCategories?: RecurringMissionCategory[]
  mission: Mission
}

const CAT_COLORS = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
]

export function EditMissionModal({
  isOpen, onClose, onUpdate, onUpdateRecurringCategory,
  onAddCategory, recurringCategories = [], mission,
}: EditMissionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [busy, setBusy] = useState(false)
  const [catId, setCatId] = useState('')
  const [newCat, setNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0])

  const { materias, loading: loadingMaterias } = useMaterias()
  const { categorias, loading: loadingCategorias } = useCategorias()

  useEffect(() => {
    if (isOpen && mission) {
      setTitle(mission.title)
      setDescription(mission.description || '')
      setSubject(mission.subject)
      setCatId('')
      setNewCat(false); setNewCatName(''); setNewCatColor(CAT_COLORS[0])
    }
  }, [isOpen, mission])

  const org = useMemo(() => {
    const sem = materias.filter(m => !m.categoriaId).sort((a, b) => a.ordem - b.ordem)
    const byId = new Map(categorias.map(c => [c.id, c]))
    const path = (id: string): string => {
      const names: string[] = []
      let cur = byId.get(id)
      const visited = new Set<string>()
      while (cur && !visited.has(cur.id)) {
        names.unshift(cur.nome); visited.add(cur.id)
        cur = cur.parentId ? byId.get(cur.parentId) : undefined
      }
      return names.join(' > ')
    }
    const groups = categorias
      .map(cat => ({ cat, label: path(cat.id), materias: materias.filter(m => m.categoriaId === cat.id).sort((a, b) => a.ordem - b.ordem) }))
      .filter(g => g.materias.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label))
    return { sem, groups }
  }, [materias, categorias])

  if (!isOpen) return null

  const isRec = mission.isRecurring === true
  const close = () => { if (!busy) onClose() }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!isRec && !subject.trim()) return

    setBusy(true)
    try {
      await onUpdate(mission.id, title.trim(), subject.trim() || 'Geral', description.trim() || undefined)
      if (isRec && mission.recurringMissionId && onUpdateRecurringCategory) {
        await onUpdateRecurringCategory(mission.recurringMissionId, catId || null)
      }
      onClose()
    } catch { /* silently fail */ } finally { setBusy(false) }
  }

  const createCat = async () => {
    if (!newCatName.trim() || !onAddCategory) return
    setBusy(true)
    try {
      const id = await onAddCategory(newCatName.trim(), newCatColor)
      if (id) setCatId(id)
      setNewCat(false); setNewCatName(''); setNewCatColor(CAT_COLORS[0])
    } catch { /* silently fail */ } finally { setBusy(false) }
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Editar Missão</h2>
            {isRec && <span className="modal-badge">Recorrente</span>}
          </div>
          <button onClick={close} disabled={busy} className="modal-close"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="modal-body">
          {/* Title */}
          <div className="modal-field">
            <label className="modal-field-label">Título</label>
            <input
              type="text" value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={busy} className="modal-input" required autoFocus
            />
          </div>

          {/* Description */}
          <div className="modal-field">
            <label className="modal-field-label">
              Descrição <span className="modal-optional">opcional</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={busy} rows={2}
              className="modal-input modal-textarea"
            />
          </div>

          {/* Category (recurring) */}
          {isRec && onUpdateRecurringCategory && (
            <div className="modal-field">
              <label className="modal-field-label">Categoria</label>
              {!newCat ? (
                <div className="modal-field-row">
                  <select value={catId} onChange={e => setCatId(e.target.value)} disabled={busy} className="modal-select">
                    <option value="">Sem categoria</option>
                    {recurringCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {onAddCategory && (
                    <button type="button" onClick={() => setNewCat(true)} disabled={busy} className="modal-btn-ghost">
                      <FolderPlus className="w-3.5 h-3.5" /> Nova
                    </button>
                  )}
                </div>
              ) : (
                <div className="modal-new-cat">
                  <input
                    type="text" value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nome da categoria" disabled={busy}
                    className="modal-input modal-input--sm"
                  />
                  <div className="modal-colors">
                    {CAT_COLORS.map(c => (
                      <button
                        key={c} type="button" onClick={() => setNewCatColor(c)} disabled={busy}
                        className={`modal-color-dot ${newCatColor === c ? 'modal-color-dot--selected' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="modal-field-row">
                    <button type="button" onClick={() => { setNewCat(false); setNewCatName('') }} disabled={busy} className="modal-btn-outline modal-btn--sm">Cancelar</button>
                    <button type="button" onClick={createCat} disabled={busy || !newCatName.trim()} className="modal-btn-primary modal-btn--sm">Criar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subject (non-recurring) */}
          {!isRec && (
            <div className="modal-field">
              <label className="modal-field-label">Matéria</label>
              {loadingMaterias || loadingCategorias ? (
                <div className="modal-loading-field">Carregando…</div>
              ) : materias.length === 0 ? (
                <div className="modal-empty-field">
                  Nenhuma matéria. <a href="/personalizacao" className="modal-link">Cadastrar</a>
                </div>
              ) : (
                <select value={subject} onChange={e => setSubject(e.target.value)} disabled={busy} className="modal-select" required>
                  <option value="">Selecione…</option>
                  {org.sem.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                  {org.sem.length > 0 && org.groups.length > 0 && <option disabled>──────</option>}
                  {org.groups.map(g => (
                    <optgroup key={g.cat.id} label={g.label}>
                      {g.materias.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={close} disabled={busy} className="modal-btn-outline">Cancelar</button>
            <button type="submit" disabled={busy} className="modal-btn-primary">
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
