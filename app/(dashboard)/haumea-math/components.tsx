'use client'

import React, { useState } from 'react'
import { LatexRenderer } from '@/components/LatexRenderer'
import { getFormulas, TopicFormulas } from '@/lib/math-formulas'
import { TopicType, TOPICS } from '@/lib/math-generators'
import {
    Calculator, ChevronDown, ChevronUp, BookOpen,
    TrendingUp, Braces, Superscript, Triangle,
    Equal, Sigma, Divide, ArrowLeftRight, Atom,
    ListOrdered, Grid3X3, Activity, Percent,
    Layers, BarChart3, X, Radical, Axis3d, Dices,
} from 'lucide-react'

// ===== ICON MAP =====
const ICON_MAP: Record<string, React.ElementType> = {
    Calculator, TrendingUp, Braces, Superscript, Triangle,
    Equal, Sigma, Divide, ArrowLeftRight, Atom,
    Radical, ListOrdered, Grid3X3, Activity, Percent,
    Axis3d, Dices, Layers, BarChart3,
}

export function TopicIcon({ iconName, className }: { iconName: string; className?: string }) {
    const IconComponent = ICON_MAP[iconName]
    if (!IconComponent) return <Calculator className={className} />
    return <IconComponent className={className} />
}

// ===== MATH KEYBOARD =====
interface MathKeyboardProps {
    onInsert: (text: string) => void
    visible: boolean
    onToggle: () => void
}

const KEYS = [
    { label: '√', value: '√' },
    { label: 'x²', value: '²' },
    { label: 'x³', value: '³' },
    { label: 'π', value: 'π' },
    { label: '÷', value: '/' },
    { label: '×', value: '*' },
    { label: '±', value: '-' },
    { label: '⁻¹', value: '^(-1)' },
    { label: 'a/b', value: '/' },
    { label: 'log', value: 'log' },
    { label: 'ln', value: 'ln' },
    { label: 'sen', value: 'sen' },
    { label: 'cos', value: 'cos' },
    { label: 'tan', value: 'tan' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: '≠', value: '≠' },
    { label: '≥', value: '>=' },
    { label: '≤', value: '<=' },
    { label: '∞', value: '∞' },
]

export function MathKeyboard({ onInsert, visible, onToggle }: MathKeyboardProps) {
    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
                <Calculator className="w-3.5 h-3.5" />
                Teclado
                {visible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {visible && (
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 p-2 bg-secondary/50 rounded-lg border border-border">
                    {KEYS.map((k, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onInsert(k.value)}
                            className="px-2 py-1.5 text-sm font-mono bg-card hover:bg-primary/10 border border-border rounded transition-colors text-foreground"
                        >
                            {k.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ===== FORMULA SHEET =====
interface FormulaSheetProps {
    topic: TopicType
    open: boolean
    onClose: () => void
}

export function FormulaSheet({ topic, open, onClose }: FormulaSheetProps) {
    const data = getFormulas(topic)
    const topicConfig = TOPICS.find(t => t.id === topic)
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    if (!open || !data) return null

    const toggleSection = (title: string) => {
        setExpanded(prev => ({ ...prev, [title]: !prev[title] }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">
                                Fórmulas — {topicConfig?.name || data.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">Referência rápida</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {data.sections.map((section, si) => {
                        const isOpen = expanded[section.title] !== false // default open
                        return (
                            <div key={si} className="border border-border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection(section.title)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <span className="font-medium text-sm text-foreground">{section.title}</span>
                                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                {isOpen && (
                                    <div className="p-3 space-y-2">
                                        {section.formulas.map((f, fi) => (
                                            <div key={fi} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1">
                                                <span className="text-xs text-muted-foreground shrink-0 font-medium min-w-[160px]">
                                                    {f.label}
                                                </span>
                                                <div className="text-sm">
                                                    <LatexRenderer content={`$$${f.latex}$$`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ===== STEP-BY-STEP VIEWER =====
interface StepViewerProps {
    steps: string[]
    visible: boolean
}

export function StepViewer({ steps, visible }: StepViewerProps) {
    if (!visible || steps.length === 0) return null

    return (
        <div className="mt-3 p-3 bg-secondary/30 border border-border rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolução</p>
            {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs text-muted-foreground font-mono mt-1 shrink-0">{i + 1}.</span>
                    <div className="text-sm">
                        <LatexRenderer content={step} />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ===== TIMER DISPLAY =====
interface TimerDisplayProps {
    seconds: number
    limit?: number // se existir, mostra o limite
    className?: string
}

export function TimerDisplay({ seconds, limit, className = '' }: TimerDisplayProps) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

    const isWarning = limit && seconds > limit * 0.8
    const isDanger = limit && seconds >= limit

    return (
        <span className={`font-mono text-sm tabular-nums ${isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-muted-foreground'} ${className}`}>
            {timeStr}
            {limit && <span className="text-muted-foreground/50"> / {Math.floor(limit / 60)}:{(limit % 60).toString().padStart(2, '0')}</span>}
        </span>
    )
}

// ===== STREAK INDICATOR =====
export function StreakIndicator({ streak }: { streak: number }) {
    if (streak < 2) return null

    return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold">
            🔥 {streak} em sequência
        </div>
    )
}
