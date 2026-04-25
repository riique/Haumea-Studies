'use client'

import './leituras.css'
import { useState, useMemo, useEffect } from 'react'
import { Plus, ChevronDown, Search, FileText, Trash2 } from 'lucide-react'
import { AddBookModal } from '@/components/AddBookModal'
import { DossierModal } from '@/components/DossierModal'
import { useReadings } from '@/hooks/useReadings'
import { Reading, ReadingStatus } from '@/types/reading'

type StatusFilter = 'todos' | 'nao_lido' | 'lendo' | 'concluido'

// ── Reading Row ──────────────────────────────────────

interface ReadingRowProps {
  reading: Reading
  isExpanded: boolean
  onToggleExpand: () => void
  onStatusChange: (status: ReadingStatus) => void
  onPageChange: (page: number) => void
  onOpenDossier: () => void
  onDelete: () => void
}

function ReadingRow({
  reading, isExpanded, onToggleExpand,
  onStatusChange, onPageChange, onOpenDossier, onDelete,
}: ReadingRowProps) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [localPage, setLocalPage] = useState(reading.currentPage)

  useEffect(() => { setLocalPage(reading.currentPage) }, [reading.currentPage])

  const commitPage = () => {
    const clamped = Math.max(0, Math.min(localPage, reading.pageCount))
    if (clamped !== reading.currentPage) onPageChange(clamped)
  }

  const pct = reading.pageCount > 0
    ? Math.round((reading.currentPage / reading.pageCount) * 100)
    : 0

  const hasDossier = reading.dossier.finalSummary || reading.dossier.chapterNotes.length > 0

  return (
    <div className={`reading-row reading-row--${reading.status}`}>
      {/* Main clickable area */}
      <div className="reading-row-main" onClick={onToggleExpand}>
        <div className="reading-row-left">
          <span className={`reading-dot reading-dot--${reading.status}`} />
          <div className="reading-info">
            <h3 className="reading-title">{reading.bookTitle}</h3>
            <div className="reading-meta">
              <span className="reading-institution">{reading.institution}</span>
              {hasDossier && <span className="reading-badge">dossiê</span>}
            </div>
          </div>
        </div>
        <div className="reading-row-right">
          {reading.currentPage > 0 && (
            <span className="reading-pct">{pct}%</span>
          )}
          <span className="reading-pages">
            {reading.currentPage > 0 ? `${reading.currentPage}/` : ''}
            {reading.pageCount} pp
          </span>
          <ChevronDown
            className={`reading-chevron ${isExpanded ? 'reading-chevron--open' : ''}`}
          />
        </div>
      </div>

      {/* Progress bar */}
      {reading.currentPage > 0 && (
        <div className="reading-progress">
          <div className="reading-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Expandable detail */}
      <div className={`reading-detail ${isExpanded ? 'reading-detail--open' : ''}`}>
        <div className="reading-detail-inner">
          <div className="reading-controls">
            <div className="reading-ctrl">
              <label className="reading-label">Status</label>
              <select
                value={reading.status}
                onChange={e => onStatusChange(e.target.value as ReadingStatus)}
                className="reading-select"
                onClick={e => e.stopPropagation()}
              >
                <option value="nao_lido">Não lido</option>
                <option value="lendo">Lendo</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="reading-ctrl">
              <label className="reading-label">Página atual</label>
              <div className="reading-pg-wrap">
                <input
                  type="number"
                  min={0}
                  max={reading.pageCount}
                  value={localPage}
                  onChange={e => setLocalPage(parseInt(e.target.value) || 0)}
                  onBlur={commitPage}
                  onKeyDown={e => { if (e.key === 'Enter') commitPage() }}
                  onClick={e => e.stopPropagation()}
                  className="reading-pg-input"
                />
                <span className="reading-pg-total">/ {reading.pageCount}</span>
              </div>
            </div>
          </div>

          {reading.preSummary && (
            <p className="reading-pre-summary">{reading.preSummary}</p>
          )}

          <div className="reading-actions">
            <button onClick={onOpenDossier} className="reading-dossier-btn">
              <FileText className="w-3.5 h-3.5" />
              {hasDossier ? 'Ver Dossiê' : 'Criar Dossiê'}
            </button>

            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="reading-del-btn"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="reading-del-confirm">
                <span>Excluir?</span>
                <button onClick={onDelete} className="reading-del-yes">Sim</button>
                <button onClick={() => setConfirmDel(false)} className="reading-del-no">Não</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────

export default function LeiturasPage() {
  const {
    readings, loading,
    addReading, updateReadingStatus, updateCurrentPage,
    updateDossier, deleteReading,
  } = useReadings()

  const [addOpen, setAddOpen] = useState(false)
  const [dossierData, setDossierData] = useState<Reading | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('todos')

  // Stats
  const stats = useMemo(() => {
    const total = readings.length
    const lendo = readings.filter(r => r.status === 'lendo').length
    const done = readings.filter(r => r.status === 'concluido').length
    const pagesRead = readings.reduce((s, r) => s + (r.currentPage || 0), 0)
    return { total, lendo, done, pagesRead }
  }, [readings])

  // Filtered list
  const filtered = useMemo(() => {
    let list = readings
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.bookTitle.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q)
      )
    }
    if (filter !== 'todos') {
      list = list.filter(r => r.status === filter)
    }
    return list
  }, [readings, search, filter])

  const handleAdd = async (
    title: string, institution: string, pages: number, summary?: string,
  ) => {
    await addReading(title, institution, pages, summary)
  }

  const handleSaveDossier = async (dossier: any) => {
    if (dossierData) await updateDossier(dossierData.id, dossier)
  }

  if (loading) {
    return (
      <div className="leituras-page">
        <div className="leituras-loading">
          <div className="leituras-spinner" />
          <p>Carregando leituras…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="leituras-page">
      {/* ── Header ── */}
      <header className="leituras-header">
        <div className="leituras-header-top">
          <div>
            <h1 className="leituras-heading">Leituras</h1>
            <p className="leituras-subheading">Leitura tática para vestibulares</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="leituras-add-btn">
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>

        {readings.length > 0 && (
          <>
            <div className="leituras-stats-strip">
              <div className="leituras-stat">
                <span className="leituras-stat-val">{stats.total}</span>
                <span className="leituras-stat-lbl">{stats.total === 1 ? 'livro' : 'livros'}</span>
              </div>
              <div className="leituras-stat-div" />
              <div className="leituras-stat">
                <span className="leituras-stat-val">{stats.lendo}</span>
                <span className="leituras-stat-lbl">em leitura</span>
              </div>
              <div className="leituras-stat-div" />
              <div className="leituras-stat">
                <span className="leituras-stat-val">{stats.done}</span>
                <span className="leituras-stat-lbl">{stats.done === 1 ? 'concluído' : 'concluídos'}</span>
              </div>
              {stats.pagesRead > 0 && (
                <>
                  <div className="leituras-stat-div" />
                  <div className="leituras-stat">
                    <span className="leituras-stat-val">{stats.pagesRead.toLocaleString()}</span>
                    <span className="leituras-stat-lbl">pp lidas</span>
                  </div>
                </>
              )}
            </div>

            <div className="leituras-controls">
              <div className="leituras-search">
                <Search className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="leituras-search-input"
                />
              </div>
              <div className="leituras-status-filter">
                {(['todos', 'nao_lido', 'lendo', 'concluido'] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`leituras-filter-btn ${filter === s ? 'leituras-filter-btn--active' : ''}`}
                  >
                    {s === 'todos' ? 'Todos' : s === 'nao_lido' ? 'Não lidos' : s === 'lendo' ? 'Lendo' : 'Concluídos'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── Content ── */}
      <div className="leituras-content">
        {readings.length === 0 ? (
          <div className="leituras-empty">
            <p className="leituras-empty-quote">
              "Um livro é um sonho que você segura nas mãos."
            </p>
            <p className="leituras-empty-author">— Neil Gaiman</p>
            <p className="leituras-empty-cta">
              Adicione suas leituras obrigatórias para começar
            </p>
            <button onClick={() => setAddOpen(true)} className="leituras-empty-btn">
              <Plus className="w-4 h-4" />
              Adicionar primeiro livro
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="leituras-no-results">
            <p>Nenhuma leitura encontrada.</p>
          </div>
        ) : (
          <div className="leituras-list">
            {filtered.map(reading => (
              <ReadingRow
                key={reading.id}
                reading={reading}
                isExpanded={expandedId === reading.id}
                onToggleExpand={() => setExpandedId(
                  expandedId === reading.id ? null : reading.id
                )}
                onStatusChange={s => updateReadingStatus(reading.id, s)}
                onPageChange={p => updateCurrentPage(reading.id, p)}
                onOpenDossier={() => setDossierData(reading)}
                onDelete={() => deleteReading(reading.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {readings.length > 0 && (
        <button
          onClick={() => setAddOpen(true)}
          className="leituras-fab"
          aria-label="Adicionar livro"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Modals */}
      <AddBookModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      {dossierData && (
        <DossierModal
          isOpen={!!dossierData}
          onClose={() => setDossierData(null)}
          bookTitle={dossierData.bookTitle}
          initialDossier={dossierData.dossier}
          onSave={handleSaveDossier}
        />
      )}
    </div>
  )
}
