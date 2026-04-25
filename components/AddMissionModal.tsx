'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, FolderPlus } from 'lucide-react'
import { DayOfWeek, RecurringMissionCategory } from '@/types/mission'
import { useMaterias, useCategorias } from '@/hooks/useFirestoreData'

interface AddMissionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (title: string, subject: string, dayOfWeek: DayOfWeek, description?: string) => Promise<void>
  onAddRecurring?: (title: string, description?: string, categoryId?: string) => Promise<void>
  onAddCategory?: (name: string, color?: string) => Promise<string | undefined>
  recurringCategories?: RecurringMissionCategory[]
  weekStartDate: string
  initialDayOfWeek?: DayOfWeek
}

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

const CAT_COLORS = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
]

export function AddMissionModal({
  isOpen, onClose, onAdd, onAddRecurring, onAddCategory,
  recurringCategories = [], weekStartDate, initialDayOfWeek,
}: AddMissionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDayOfWeek || 'segunda')
  const [isRecurring, setIsRecurring] = useState(false)
  const [busy, setBusy] = useState(false)
  const [catId, setCatId] = useState('')
  const [newCat, setNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0])

  useEffect(() => {
    if (isOpen && initialDayOfWeek) setDayOfWeek(initialDayOfWeek)
  }, [isOpen, initialDayOfWeek])

  const { materias, loading: loadingMaterias } = useMaterias()
  const { categorias, loading: loadingCategorias } = useCategorias()

  const org = useMemo(() => {
    const sem = materias.filter(m => !m.categoriaId).sort((a, b) => a.ordem - b.ordem)
    const byId = new Map(categorias.map(c => [c.id, c]))
    const path = (id: string): string => {
      const names: string[] = []
      let cur = byId.get(id)
      const visited = new Set<string>()
      while (cur && !visited.has(cur.id)) {
        names.unshift(cur.nome)
        visited.add(cur.id)
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

  const reset = () => {
    setTitle(''); setDescription(''); setSubject(''); setDayOfWeek('segunda')
    setIsRecurring(false); setCatId(''); setNewCat(false); setNewCatName(''); setNewCatColor(CAT_COLORS[0])
  }

  const close = () => { if (!busy) { reset(); onClose() } }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!isRecurring && !subject.trim()) return
    if (isRecurring && !onAddRecurring) return

    setBusy(true)
    try {
      if (isRecurring && onAddRecurring) {
        await onAddRecurring(title.trim(), description.trim() || undefined, catId || undefined)
      } else {
        await onAdd(title.trim(), subject.trim(), dayOfWeek, description.trim() || undefined)
      }
      reset(); onClose()
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
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Nova Missão</h2>
          <button onClick={close} disabled={busy} className="modal-close"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="modal-body">
          {/* Type toggle */}
          {onAddRecurring && (
            <label className="modal-toggle">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                disabled={busy}
                className="modal-toggle-input"
              />
              <span className="modal-toggle-label">Recorrente</span>
              <span className="modal-toggle-hint">Aparece toda semana</span>
            </label>
          )}

          {/* Title */}
          <div className="modal-field">
            <label className="modal-field-label">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Cinemática — MRU e MRUV"
              disabled={busy}
              className="modal-input"
              required
              autoFocus
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
              placeholder="Detalhes sobre a missão…"
              disabled={busy}
              rows={2}
              className="modal-input modal-textarea"
            />
          </div>

          {/* Category (recurring only) */}
          <div className={`modal-slide ${isRecurring ? 'modal-slide--open' : ''}`}>
            <div className="modal-field">
              <label className="modal-field-label">Categoria</label>
              {!newCat ? (
                <div className="modal-field-row">
                  <select
                    value={catId}
                    onChange={e => setCatId(e.target.value)}
                    disabled={busy}
                    className="modal-select"
                  >
                    <option value="">Sem categoria</option>
                    {recurringCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
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
                    type="text"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nome da categoria"
                    disabled={busy}
                    className="modal-input modal-input--sm"
                  />
                  <div className="modal-colors">
                    {CAT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        disabled={busy}
                        className={`modal-color-dot ${newCatColor === c ? 'modal-color-dot--selected' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="modal-field-row">
                    <button type="button" onClick={() => { setNewCat(false); setNewCatName('') }} disabled={busy} className="modal-btn-outline modal-btn--sm">
                      Cancelar
                    </button>
                    <button type="button" onClick={createCat} disabled={busy || !newCatName.trim()} className="modal-btn-primary modal-btn--sm">
                      Criar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject (normal only) */}
          <div className={`modal-slide ${!isRecurring ? 'modal-slide--open' : ''}`}>
            <div className="modal-field">
              <label className="modal-field-label">Matéria</label>
              {loadingMaterias || loadingCategorias ? (
                <div className="modal-loading-field">Carregando…</div>
              ) : materias.length === 0 ? (
                <div className="modal-empty-field">
                  Nenhuma matéria. <a href="/personalizacao" className="modal-link">Cadastrar</a>
                </div>
              ) : (
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={busy || isRecurring}
                  className="modal-select"
                  required={!isRecurring}
                >
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
          </div>

          {/* Day (normal only) */}
          <div className={`modal-slide ${!isRecurring ? 'modal-slide--open' : ''}`}>
            <div className="modal-field">
              <label className="modal-field-label">Dia</label>
              <div className="modal-day-grid">
                {DAYS_OF_WEEK.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDayOfWeek(d.value)}
                    disabled={busy || isRecurring}
                    className={`modal-day-btn ${dayOfWeek === d.value ? 'modal-day-btn--active' : ''}`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={close} disabled={busy} className="modal-btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="modal-btn-primary">
              {busy ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
