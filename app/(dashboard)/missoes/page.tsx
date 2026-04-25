'use client'

import './missoes.css'
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
    Plus,
    Check,
    Trash2,
    Pencil,
    ChevronDown,
    Search,
    Info,
    RotateCcw,
    Clock,
    Target,
} from 'lucide-react'
import { useMissions } from '@/hooks/useMissions'
import { useRecurringMissions } from '@/hooks/useRecurringMissions'
import { useAllMissionsStats } from '@/hooks/useAllMissionsStats'
import { Mission, DayOfWeek } from '@/types/mission'
import { AddMissionModal } from '@/components/AddMissionModal'
import { EditMissionModal } from '@/components/EditMissionModal'
import { MissionTimer } from '@/components/MissionTimer'
import { MissionInfoModal } from '@/components/MissionInfoModal'
import { MissionsInfoModal } from '@/components/MissionsInfoModal'

// ── Helpers ──────────────────────────────────────────────

function getMonday(d: Date): Date {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
}

function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtWeekLabel(monday: Date): string {
    const sun = new Date(monday)
    sun.setDate(sun.getDate() + 6)
    const m = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`
    return `${m(monday)} — ${m(sun)}`
}

function fmtTime(secs: number): string {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m`
    return '0m'
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
    { key: 'segunda', label: 'Segunda-feira', short: 'Seg' },
    { key: 'terca', label: 'Terça-feira', short: 'Ter' },
    { key: 'quarta', label: 'Quarta-feira', short: 'Qua' },
    { key: 'quinta', label: 'Quinta-feira', short: 'Qui' },
    { key: 'sexta', label: 'Sexta-feira', short: 'Sex' },
    { key: 'sabado', label: 'Sábado', short: 'Sáb' },
    { key: 'domingo', label: 'Domingo', short: 'Dom' },
]

type StatusFilter = 'todos' | 'pendente' | 'concluido'

// ── Progress Ring ────────────────────────────────────────

function ProgressRing({ pct, size = 52, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ

    return (
        <svg width={size} height={size} className="progress-ring" style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={stroke}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}

// ── Mission Row ──────────────────────────────────────────

interface MissionRowProps {
    mission: Mission
    onToggle: () => void
    onDelete: () => void
    onEdit: () => void
    onInfo: () => void
    onStartTimer: () => void
    onStopTimer: (t: number) => void
}

function MissionRow({ mission, onToggle, onDelete, onEdit, onInfo, onStartTimer, onStopTimer }: MissionRowProps) {
    const done = mission.status === 'concluido'
    const [showConfirm, setShowConfirm] = useState(false)

    return (
        <div
            className={`
        mission-row group
        ${done ? 'mission-row--done' : ''}
      `}
        >
            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={`
          mission-check
          ${done ? 'mission-check--done' : ''}
        `}
                aria-label={done ? 'Marcar como pendente' : 'Marcar como concluído'}
            >
                {done && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onInfo}>
                <p className={`mission-title ${done ? 'mission-title--done' : ''}`}>
                    {mission.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="mission-subject">{mission.subject}</span>
                    {mission.isRecurring && (
                        <span className="mission-badge--recurring">recorrente</span>
                    )}
                    {mission.description && (
                        <span className="text-[10px] text-muted-foreground">•&nbsp;{mission.description.slice(0, 40)}{mission.description.length > 40 ? '…' : ''}</span>
                    )}
                </div>
            </div>

            {/* Timer */}
            <MissionTimer
                missionId={mission.id}
                timeSpent={mission.timeSpent || 0}
                isRunning={mission.isTimerRunning || false}
                timerStartedAt={mission.timerStartedAt}
                onStart={onStartTimer}
                onStop={onStopTimer}
                isCompleted={done}
            />

            {/* Actions */}
            <div className="mission-actions">
                <button onClick={onEdit} className="mission-action-btn" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                {!showConfirm ? (
                    <button onClick={() => setShowConfirm(true)} className="mission-action-btn mission-action-btn--danger" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <button
                        onClick={() => { onDelete(); setShowConfirm(false) }}
                        className="mission-action-btn mission-action-btn--confirm"
                        title="Confirmar exclusão"
                        onBlur={() => setTimeout(() => setShowConfirm(false), 200)}
                        autoFocus
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ── Day Accordion ────────────────────────────────────────

interface DayAccordionProps {
    dayKey: DayOfWeek
    label: string
    short: string
    missions: Mission[]
    isToday: boolean
    isExpanded: boolean
    onToggleExpand: () => void
    onAddMission: () => void
    onToggleStatus: (id: string, status: 'pendente' | 'concluido') => void
    onDelete: (id: string) => void
    onEdit: (m: Mission) => void
    onInfo: (m: Mission) => void
    onStartTimer: (id: string) => void
    onStopTimer: (id: string, t: number) => void
}

function DayAccordion({
    dayKey, label, short, missions, isToday, isExpanded, onToggleExpand,
    onAddMission, onToggleStatus, onDelete, onEdit, onInfo, onStartTimer, onStopTimer,
}: DayAccordionProps) {
    const done = missions.filter(m => m.status === 'concluido').length
    const total = missions.length
    const totalTime = missions.reduce((s, m) => s + (m.timeSpent || 0), 0)

    return (
        <div className={`day-accordion ${isToday ? 'day-accordion--today' : ''}`}>
            {/* Header */}
            <button className="day-header" onClick={onToggleExpand}>
                <div className="flex items-center gap-3">
                    <span className={`day-indicator ${isToday ? 'day-indicator--today' : ''}`}>
                        {short}
                    </span>
                    <div className="text-left">
                        <span className="day-label">{label}</span>
                        <span className="day-meta">
                            {total === 0
                                ? 'nenhuma missão'
                                : `${done}/${total} · ${fmtTime(totalTime)}`
                            }
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {total > 0 && (
                        <div className="day-pct">
                            <div className="day-pct-fill" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                        </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Body */}
            <div className={`day-body ${isExpanded ? 'day-body--open' : ''}`}>
                <div className="day-content">
                    {missions.length === 0 ? (
                        <p className="day-empty">Nenhuma missão neste dia.</p>
                    ) : (
                        missions.map(m => (
                            <MissionRow
                                key={m.id}
                                mission={m}
                                onToggle={() => onToggleStatus(m.id, m.status === 'pendente' ? 'concluido' : 'pendente')}
                                onDelete={() => onDelete(m.id)}
                                onEdit={() => onEdit(m)}
                                onInfo={() => onInfo(m)}
                                onStartTimer={() => onStartTimer(m.id)}
                                onStopTimer={(t) => onStopTimer(m.id, t)}
                            />
                        ))
                    )}
                    <button onClick={onAddMission} className="day-add-btn">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Page ────────────────────────────────────────────

export default function MissoesPage() {
    // Week navigation
    const [weekOffset, setWeekOffset] = useState(0)
    const monday = useMemo(() => {
        const d = getMonday(new Date())
        d.setDate(d.getDate() + weekOffset * 7)
        return d
    }, [weekOffset])
    const weekStart = fmtDate(monday)

    // Data hooks
    const {
        missions, loading,
        addMission, updateMissionStatus, updateMission, deleteMission,
        startTimer, stopTimer,
    } = useMissions(weekStart)

    const {
        recurringMissions, loading: loadingRecurring,
        addRecurringMission, updateMissionCategory,
        categories, addCategory,
        createRecurringMissionInstances,
    } = useRecurringMissions()

    const { stats, loading: loadingStats } = useAllMissionsStats()

    // Create recurring instances when week changes
    useEffect(() => {
        if (!loadingRecurring && recurringMissions.length > 0) {
            createRecurringMissionInstances(weekStart)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekStart, loadingRecurring])

    // UI state
    const [expandedDays, setExpandedDays] = useState<Set<DayOfWeek>>(() => {
        const todayIdx = new Date().getDay()
        const todayKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][todayIdx] as DayOfWeek
        return new Set([todayKey])
    })
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
    const [showAddModal, setShowAddModal] = useState(false)
    const [addDayHint, setAddDayHint] = useState<DayOfWeek | undefined>()
    const [editMission, setEditMission] = useState<Mission | null>(null)
    const [infoMission, setInfoMission] = useState<Mission | null>(null)
    const [showStats, setShowStats] = useState(false)
    const [showRecurring, setShowRecurring] = useState(false)

    // Computed
    const todayKey = useMemo(() => {
        const d = new Date().getDay()
        return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][d] as DayOfWeek
    }, [])

    const isCurrentWeek = weekOffset === 0

    const filtered = useMemo(() => {
        let list = missions
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(m =>
                m.title.toLowerCase().includes(q) ||
                m.subject.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q)
            )
        }
        if (statusFilter !== 'todos') {
            list = list.filter(m => m.status === statusFilter)
        }
        return list
    }, [missions, search, statusFilter])

    const missionsByDay = useMemo(() => {
        const map: Record<DayOfWeek, Mission[]> = {
            segunda: [], terca: [], quarta: [], quinta: [],
            sexta: [], sabado: [], domingo: [],
        }
        filtered.forEach(m => {
            if (m.dayOfWeek && map[m.dayOfWeek]) {
                map[m.dayOfWeek].push(m)
            }
        })
        return map
    }, [filtered])

    const recurringFiltered = useMemo(() => {
        return filtered.filter(m => m.isRecurring && !m.dayOfWeek)
    }, [filtered])

    // Stats computed
    const weekStats = useMemo(() => {
        const total = missions.filter(m => !m.isRecurring || m.dayOfWeek).length
        const done = missions.filter(m => (m.status === 'concluido') && (!m.isRecurring || m.dayOfWeek)).length
        const totalTime = missions.reduce((s, m) => s + (m.timeSpent || 0), 0)
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return { total, done, totalTime, pct }
    }, [missions])

    // Handlers
    const toggleDay = useCallback((day: DayOfWeek) => {
        setExpandedDays(prev => {
            const next = new Set(prev)
            if (next.has(day)) next.delete(day)
            else next.add(day)
            return next
        })
    }, [])

    const openAddForDay = useCallback((day: DayOfWeek) => {
        setAddDayHint(day)
        setShowAddModal(true)
    }, [])

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Carregando missões…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="missoes-page">
            {/* ── Header ── */}
            <header className="missoes-header">
                <div className="missoes-header-top">
                    <div>
                        <h1 className="missoes-heading">Missões</h1>
                        <p className="missoes-subheading">{fmtWeekLabel(monday)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Progress ring */}
                        <div className="missoes-ring-wrap" title={`${weekStats.pct}% concluído`}>
                            <ProgressRing pct={weekStats.pct} />
                            <span className="missoes-ring-label">{weekStats.pct}%</span>
                        </div>

                        <button
                            onClick={() => setShowStats(true)}
                            className="missoes-icon-btn"
                            title="Estatísticas"
                        >
                            <Info className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="missoes-stats-strip">
                    <div className="missoes-stat">
                        <Target className="w-3.5 h-3.5" />
                        <span>{weekStats.done}/{weekStats.total}</span>
                    </div>
                    <div className="missoes-stat-divider" />
                    <div className="missoes-stat">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{fmtTime(weekStats.totalTime)}</span>
                    </div>
                    {recurringFiltered.length > 0 && (
                        <>
                            <div className="missoes-stat-divider" />
                            <div className="missoes-stat">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{recurringFiltered.length} recorrente{recurringFiltered.length > 1 ? 's' : ''}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Week nav + filters */}
                <div className="missoes-controls">
                    <div className="missoes-week-nav">
                        <button onClick={() => setWeekOffset(o => o - 1)} className="missoes-nav-btn">←</button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="missoes-nav-today"
                            disabled={isCurrentWeek}
                            aria-disabled={isCurrentWeek}
                        >
                            Hoje
                        </button>
                        <button onClick={() => setWeekOffset(o => o + 1)} className="missoes-nav-btn">→</button>
                    </div>

                    <div className="missoes-filters">
                        {/* Search */}
                        <div className="missoes-search">
                            <Search className="w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar…"
                                className="missoes-search-input"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="missoes-status-filter">
                            {(['todos', 'pendente', 'concluido'] as StatusFilter[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`missoes-filter-btn ${statusFilter === s ? 'missoes-filter-btn--active' : ''}`}
                                >
                                    {s === 'todos' ? 'Todos' : s === 'pendente' ? 'Pendentes' : 'Concluídos'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <div className="missoes-content">
                {/* Recurring missions section */}
                {recurringFiltered.length > 0 && (
                    <section className="missoes-recurring-section">
                        <button
                            className="missoes-recurring-header"
                            onClick={() => setShowRecurring(!showRecurring)}
                        >
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                                <span className="missoes-recurring-title">Missões Recorrentes</span>
                                <span className="missoes-recurring-count">{recurringFiltered.length}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showRecurring ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`day-body ${showRecurring ? 'day-body--open' : ''}`}>
                            <div className="day-content">
                                {recurringFiltered.map(m => (
                                    <MissionRow
                                        key={m.id}
                                        mission={m}
                                        onToggle={() => updateMissionStatus(m.id, m.status === 'pendente' ? 'concluido' : 'pendente')}
                                        onDelete={() => deleteMission(m.id)}
                                        onEdit={() => setEditMission(m)}
                                        onInfo={() => setInfoMission(m)}
                                        onStartTimer={() => startTimer(m.id)}
                                        onStopTimer={(t) => stopTimer(m.id, t)}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Day accordions */}
                <div className="missoes-days">
                    {DAYS.map(({ key, label, short }) => (
                        <DayAccordion
                            key={key}
                            dayKey={key}
                            label={label}
                            short={short}
                            missions={missionsByDay[key]}
                            isToday={isCurrentWeek && key === todayKey}
                            isExpanded={expandedDays.has(key)}
                            onToggleExpand={() => toggleDay(key)}
                            onAddMission={() => openAddForDay(key)}
                            onToggleStatus={(id, s) => updateMissionStatus(id, s)}
                            onDelete={(id) => deleteMission(id)}
                            onEdit={(m) => setEditMission(m)}
                            onInfo={(m) => setInfoMission(m)}
                            onStartTimer={(id) => startTimer(id)}
                            onStopTimer={(id, t) => stopTimer(id, t)}
                        />
                    ))}
                </div>

                {/* FAB */}
                <button
                    onClick={() => { setAddDayHint(undefined); setShowAddModal(true) }}
                    className="missoes-fab"
                    aria-label="Adicionar missão"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* ── Modals ── */}
            <AddMissionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={async (title, subject, day, desc) => {
                    await addMission(title, subject, day, weekStart, desc)
                }}
                onAddRecurring={addRecurringMission}
                onAddCategory={addCategory}
                recurringCategories={categories}
                weekStartDate={weekStart}
                initialDayOfWeek={addDayHint}
            />

            {editMission && (
                <EditMissionModal
                    isOpen={!!editMission}
                    onClose={() => setEditMission(null)}
                    onUpdate={updateMission}
                    onUpdateRecurringCategory={updateMissionCategory}
                    onAddCategory={addCategory}
                    recurringCategories={categories}
                    mission={editMission}
                />
            )}

            {infoMission && (
                <MissionInfoModal
                    isOpen={!!infoMission}
                    onClose={() => setInfoMission(null)}
                    mission={infoMission}
                />
            )}

            <MissionsInfoModal
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                stats={stats}
                loading={loadingStats}
            />
        </div>
    )
}
