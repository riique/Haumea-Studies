'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PageLayout } from '@/components/PageLayout'
import { LatexRenderer } from '@/components/LatexRenderer'
import {
    TopicIcon, MathKeyboard, FormulaSheet, StepViewer,
    TimerDisplay, StreakIndicator
} from './components'
import {
    TOPICS, TOPIC_CATEGORIES, TopicType,
    generatePlaylist, generateQuestion, validateAnswer,
    addChoicesToQuestion, MathQuestion,
    type PlaylistConfig,
} from '@/lib/math-generators'
import { analyzeSolution, fileToBase64, getClipboardImage } from '@/lib/math-tutor-api'
import { useMathHistory, type QuestionResult } from '@/hooks/useMathHistory'
import { getFormulas } from '@/lib/math-formulas'
import {
    Play, RotateCcw, CheckCircle2, XCircle, Lightbulb,
    ArrowRight, Trophy, BookOpen, Clock, Zap, Infinity,
    Brain, Settings2, ChevronDown, ChevronUp, Upload,
    ClipboardPaste, Bot, Image as ImageIcon, Trash2,
    Flame, Target, AlertTriangle, ChevronRight, Star,
    Shuffle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ===== TYPES =====
type AppState = 'config' | 'playing' | 'summary' | 'errors'
type TrainingMode = 'standard' | 'timed' | 'adaptive' | 'infinite'

interface TopicQuantity {
    topic: TopicType
    quantity: number
}

interface SessionResult {
    question: MathQuestion
    userAnswer: string
    isCorrect: boolean
    usedHint: boolean
    timeSpent: number
}

// ===== MAIN COMPONENT =====
export default function HaumeaMathPage() {
    // --- App State ---
    const [appState, setAppState] = useState<AppState>('config')
    const [mode, setMode] = useState<TrainingMode>('standard')
    const [multipleChoice, setMultipleChoice] = useState(false)
    const [shuffleEnabled, setShuffleEnabled] = useState(true)
    const [timerPerQuestion, setTimerPerQuestion] = useState(60)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        algebra: true, analise: true, geometria: true, estatistica_prob: true
    })

    // --- Topic Selection ---
    const [topicQuantities, setTopicQuantities] = useState<TopicQuantity[]>(
        TOPICS.map(t => ({ topic: t.id, quantity: 0 }))
    )

    // --- Playing State ---
    const [playlist, setPlaylist] = useState<MathQuestion[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
    const [answerSubmitted, setAnswerSubmitted] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [showSteps, setShowSteps] = useState(false)
    const [showKeyboard, setShowKeyboard] = useState(false)
    const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
    const [streak, setStreak] = useState(0)
    const [formulaTopic, setFormulaTopic] = useState<TopicType | null>(null)

    // --- Timer ---
    const [questionTimer, setQuestionTimer] = useState(0)
    const [sessionTimer, setSessionTimer] = useState(0)
    const questionStartRef = useRef<number>(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // --- Adaptive state ---
    const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<Record<TopicType, number>>({} as any)

    // --- Tutor ---
    const [showTutorModal, setShowTutorModal] = useState(false)
    const [tutorImage, setTutorImage] = useState<string | null>(null)
    const [tutorResponse, setTutorResponse] = useState<any>(null)
    const [analyzing, setAnalyzing] = useState(false)

    // --- History ---
    const history = useMathHistory()

    // Input ref
    const inputRef = useRef<HTMLInputElement>(null)

    const currentQuestion = playlist[currentIdx] || null
    const totalQuestions = playlist.length
    const isInfiniteMode = mode === 'infinite'
    const isTimedMode = mode === 'timed'

    // ===== TIMER LOGIC =====
    useEffect(() => {
        if (appState !== 'playing') {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        timerRef.current = setInterval(() => {
            setQuestionTimer(prev => {
                const next = prev + 1
                if (isTimedMode && next >= timerPerQuestion && !answerSubmitted) {
                    handleTimerExpired()
                }
                return next
            })
            setSessionTimer(prev => prev + 1)
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [appState, answerSubmitted, isTimedMode, timerPerQuestion])

    const handleTimerExpired = useCallback(() => {
        if (answerSubmitted) return
        setAnswerSubmitted(true)
        setIsCorrect(false)
        setSessionResults(prev => [...prev, {
            question: currentQuestion!,
            userAnswer: '(tempo esgotado)',
            isCorrect: false,
            usedHint: showHint,
            timeSpent: timerPerQuestion,
        }])
    }, [answerSubmitted, currentQuestion, showHint, timerPerQuestion])

    // ===== START PLAYLIST =====
    function startPlaylist() {
        const config: PlaylistConfig[] = topicQuantities
            .filter(tq => tq.quantity > 0)
            .map(tq => ({ topic: tq.topic, quantity: tq.quantity }))

        if (config.length === 0) return

        let questions: MathQuestion[]
        if (mode === 'infinite') {
            // Gerar lote inicial
            questions = config.flatMap(c =>
                Array.from({ length: 5 }, () => generateQuestion(c.topic))
            )
        } else {
            questions = generatePlaylist(config, shuffleEnabled)
        }

        if (multipleChoice) {
            questions = questions.map(q => addChoicesToQuestion(q))
        }

        setPlaylist(questions)
        setCurrentIdx(0)
        setSessionResults([])
        setStreak(0)
        setQuestionTimer(0)
        setSessionTimer(0)
        setUserAnswer('')
        setSelectedChoice(null)
        setAnswerSubmitted(false)
        setShowHint(false)
        setShowSteps(false)
        questionStartRef.current = Date.now()
        setAppState('playing')

        setTimeout(() => inputRef.current?.focus(), 100)
    }

    // ===== SUBMIT ANSWER =====
    function submitAnswer() {
        if (!currentQuestion || answerSubmitted) return

        let correct: boolean
        if (multipleChoice && currentQuestion.choices) {
            const chosenAnswer = selectedChoice !== null ? currentQuestion.choices[selectedChoice] : ''
            correct = validateAnswer(chosenAnswer, currentQuestion.answer)
        } else {
            correct = validateAnswer(userAnswer, currentQuestion.answer)
        }

        setIsCorrect(correct)
        setAnswerSubmitted(true)

        const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000)

        setSessionResults(prev => [...prev, {
            question: currentQuestion,
            userAnswer: multipleChoice && selectedChoice !== null
                ? currentQuestion.choices![selectedChoice]
                : userAnswer,
            isCorrect: correct,
            usedHint: showHint,
            timeSpent,
        }])

        if (correct) {
            setStreak(prev => prev + 1)
        } else {
            setStreak(0)
        }
    }

    // ===== NEXT QUESTION =====
    function nextQuestion() {
        if (isInfiniteMode) {
            // Gerar nova questão on-the-fly
            const activeTopic = topicQuantities.filter(tq => tq.quantity > 0)
            if (activeTopic.length > 0) {
                const randomTopic = activeTopic[Math.floor(Math.random() * activeTopic.length)]
                let q = generateQuestion(randomTopic.topic)
                if (multipleChoice) q = addChoicesToQuestion(q)
                setPlaylist(prev => [...prev, q])
            }
            setCurrentIdx(prev => prev + 1)
        } else {
            if (currentIdx >= totalQuestions - 1) {
                finishSession()
                return
            }
            setCurrentIdx(prev => prev + 1)
        }

        setUserAnswer('')
        setSelectedChoice(null)
        setAnswerSubmitted(false)
        setIsCorrect(false)
        setShowHint(false)
        setShowSteps(false)
        setQuestionTimer(0)
        questionStartRef.current = Date.now()

        setTimeout(() => inputRef.current?.focus(), 50)
    }

    // ===== FINISH SESSION =====
    async function finishSession() {
        setAppState('summary')

        // Salvar no Firestore
        const results: QuestionResult[] = sessionResults.map(r => ({
            topic: r.question.topic,
            question: r.question.question,
            correctAnswer: String(r.question.answer),
            userAnswer: r.userAnswer,
            isCorrect: r.isCorrect,
            usedHint: r.usedHint,
            timeSpent: r.timeSpent,
        }))

        const topicMap = new Map<TopicType, { total: number; correct: number; time: number }>()
        for (const r of results) {
            const existing = topicMap.get(r.topic) || { total: 0, correct: 0, time: 0 }
            existing.total++
            if (r.isCorrect) existing.correct++
            existing.time += r.timeSpent
            topicMap.set(r.topic, existing)
        }

        const topicStats = Array.from(topicMap.entries()).map(([topic, d]) => ({
            topic,
            total: d.total,
            correct: d.correct,
            avgTime: Math.round(d.time / d.total),
        }))

        await history.saveSession({
            mode,
            totalQuestions: sessionResults.length,
            correctAnswers: sessionResults.filter(r => r.isCorrect).length,
            totalTime: sessionTimer,
            results,
            topicStats,
        })
    }

    // ===== TUTOR LOGIC =====
    async function handleFileUpload(file: File) {
        if (!file.type.startsWith('image/')) return
        const base64 = await fileToBase64(file)
        setTutorImage(base64)
        setTutorResponse(null)
    }
    async function handlePaste() {
        const image = await getClipboardImage()
        if (image) { setTutorImage(image); setTutorResponse(null) }
    }
    async function analyzeWithTutor() {
        if (!tutorImage || !currentQuestion) return
        setAnalyzing(true)
        try {
            const response = await analyzeSolution({
                question: currentQuestion,
                imageBase64: tutorImage,
                studentAnswer: userAnswer || undefined,
            })
            setTutorResponse(response)
        } catch (e) { console.error('Erro ao analisar:', e) }
        finally { setAnalyzing(false) }
    }

    // Paste listener
    useEffect(() => {
        const handler = async (e: ClipboardEvent) => {
            if (!showTutorModal) return
            const items = e.clipboardData?.items
            if (!items) return
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile()
                    if (file) {
                        const base64 = await fileToBase64(file)
                        setTutorImage(base64)
                        setTutorResponse(null)
                    }
                }
            }
        }
        window.addEventListener('paste', handler)
        return () => window.removeEventListener('paste', handler)
    }, [showTutorModal])

    // ===== HELPERS =====
    function resetToConfig() {
        setAppState('config')
        setPlaylist([])
        setSessionResults([])
        setCurrentIdx(0)
    }

    function setQuantity(topic: TopicType, qty: number) {
        setTopicQuantities(prev => prev.map(tq =>
            tq.topic === topic ? { ...tq, quantity: Math.max(0, qty) } : tq
        ))
    }

    function toggleCategory(cat: string) {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
    }

    const totalSelected = topicQuantities.reduce((sum, tq) => sum + tq.quantity, 0)
    const correctTotal = sessionResults.filter(r => r.isCorrect).length
    const accuracy = sessionResults.length > 0
        ? Math.round((correctTotal / sessionResults.length) * 100)
        : 0

    function insertMathKey(text: string) {
        setUserAnswer(prev => prev + text)
        inputRef.current?.focus()
    }

    // Presets
    function applyPreset(preset: 'vestibular' | 'fraquezas' | 'rapido') {
        const reset = TOPICS.map(t => ({ topic: t.id, quantity: 0 }))

        if (preset === 'vestibular') {
            const vestTopics: TopicType[] = ['equacoes_2grau', 'trigonometria', 'logaritmo', 'funcoes', 'probabilidade', 'geometria_analitica', 'geometria_plana', 'geometria_espacial', 'pa_pg', 'porcentagem_juros']
            setTopicQuantities(reset.map(tq =>
                vestTopics.includes(tq.topic) ? { ...tq, quantity: 3 } : tq
            ))
        } else if (preset === 'fraquezas') {
            const weak = history.getWeakTopics(5)
            if (weak.length === 0) return
            setTopicQuantities(reset.map(tq => {
                const w = weak.find(wt => wt.topic === tq.topic)
                return w ? { ...tq, quantity: 5 } : tq
            }))
        } else if (preset === 'rapido') {
            const randomTopics = TOPICS.sort(() => Math.random() - 0.5).slice(0, 4)
            setTopicQuantities(reset.map(tq =>
                randomTopics.find(rt => rt.id === tq.topic) ? { ...tq, quantity: 3 } : tq
            ))
        }
    }

    // ==================== CONFIG VIEW ====================
    if (appState === 'config') {
        return (
            <PageLayout
                title="Haumea Math"
                description="Treino inteligente de matemática"
                action={
                    <div className="flex gap-2">
                        {history.errors.length > 0 && (
                            <button
                                onClick={() => setAppState('errors')}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                Caderno de Erros ({history.errors.length})
                            </button>
                        )}
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Last session info */}
                    {history.sessions.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
                                <span className="font-medium">{history.sessions.length}</span> sessões registradas
                            </div>
                            {history.getCurrentStreak() > 0 && (
                                <div className="flex items-center gap-1.5 text-xs bg-orange-500/10 text-orange-600 px-3 py-1.5 rounded-lg font-medium">
                                    <Flame className="w-3.5 h-3.5" /> {history.getCurrentStreak()} sessões seguidas com 70%+
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Modo de Treino</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {([
                                { id: 'standard' as const, label: 'Padrão', icon: Play, desc: 'Sem tempo' },
                                { id: 'timed' as const, label: 'Contrarrelógio', icon: Clock, desc: 'Timer por questão' },
                                { id: 'adaptive' as const, label: 'Adaptativo', icon: Brain, desc: 'Dificuldade ajusta' },
                                { id: 'infinite' as const, label: 'Infinito', icon: Infinity, desc: 'Sem fim' },
                            ]).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${mode === m.id
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                        : 'border-border hover:border-primary/30'
                                        }`}
                                >
                                    <m.icon className={`w-4 h-4 mb-1.5 ${mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Timer config for timed mode */}
                    {isTimedMode && (
                        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">Tempo por questão:</span>
                            <select
                                value={timerPerQuestion}
                                onChange={e => setTimerPerQuestion(Number(e.target.value))}
                                className="bg-card border border-border rounded px-2 py-1 text-sm"
                            >
                                <option value={30}>30s</option>
                                <option value={60}>60s</option>
                                <option value={90}>90s</option>
                                <option value={120}>2 min</option>
                            </select>
                        </div>
                    )}

                    {/* Options row */}
                    <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                            <input
                                type="checkbox"
                                checked={multipleChoice}
                                onChange={e => setMultipleChoice(e.target.checked)}
                                className="rounded border-border"
                            />
                            Múltipla escolha
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                            <input
                                type="checkbox"
                                checked={shuffleEnabled}
                                onChange={e => setShuffleEnabled(e.target.checked)}
                                className="rounded border-border"
                            />
                            <Shuffle className="w-3.5 h-3.5" /> Embaralhar
                        </label>
                    </div>

                    {/* Presets */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Atalhos</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => applyPreset('vestibular')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                                <Target className="w-3.5 h-3.5" /> Vestibular Mix
                            </button>
                            <button onClick={() => applyPreset('rapido')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                                <Zap className="w-3.5 h-3.5" /> Rápido (12 questões)
                            </button>
                            {history.getWeakTopics().length > 0 && (
                                <button onClick={() => applyPreset('fraquezas')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 rounded-lg transition-colors">
                                    <Flame className="w-3.5 h-3.5" /> Pontos Fracos
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Caderno de Erros */}
                    <button
                        onClick={() => setAppState('errors')}
                        className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/15 transition-colors">
                                <BookOpen className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Caderno de Erros</p>
                                <p className="text-xs text-muted-foreground">
                                    {history.errors.length > 0
                                        ? `${history.errors.length} questões para revisar`
                                        : 'Nenhum erro registrado'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>

                    {/* Topic Selection by Category */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Tópicos</h3>
                            {totalSelected > 0 && (
                                <span className="text-xs text-primary font-medium">{totalSelected} questões selecionadas</span>
                            )}
                        </div>

                        {TOPIC_CATEGORIES.map(cat => {
                            const topics = TOPICS.filter(t => t.category === cat.id)
                            const catOpen = expandedCategories[cat.id] !== false

                            return (
                                <div key={cat.id} className="border border-border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleCategory(cat.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                                    >
                                        <span className="font-medium text-sm text-foreground">{cat.name}</span>
                                        <div className="flex items-center gap-2">
                                            {topics.some(t => topicQuantities.find(tq => tq.topic === t.id)!.quantity > 0) && (
                                                <span className="text-xs text-primary">●</span>
                                            )}
                                            {catOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </button>

                                    {catOpen && (
                                        <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {topics.map(topic => {
                                                const qty = topicQuantities.find(tq => tq.topic === topic.id)!.quantity
                                                const progress = history.getTopicProgress(topic.id)

                                                return (
                                                    <div
                                                        key={topic.id}
                                                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${qty > 0
                                                            ? 'border-primary/30 bg-primary/5'
                                                            : 'border-transparent hover:bg-secondary/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <TopicIcon iconName={topic.iconName} className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">{topic.name}</p>
                                                                {progress && (
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        {progress.accuracy}% · {progress.level}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                                            <button
                                                                onClick={() => setQuantity(topic.id, qty - 1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary text-foreground text-sm"
                                                                disabled={qty === 0}
                                                            >−</button>
                                                            <span className="w-6 text-center text-sm font-mono tabular-nums">{qty}</span>
                                                            <button
                                                                onClick={() => setQuantity(topic.id, qty + 1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary text-foreground text-sm"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Start */}
                    <button
                        onClick={startPlaylist}
                        disabled={totalSelected === 0}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        {isInfiniteMode ? 'Iniciar Treino Infinito' : `Iniciar (${totalSelected} questões)`}
                    </button>
                </div>
            </PageLayout>
        )
    }

    // ==================== ERROR NOTEBOOK VIEW ====================
    if (appState === 'errors') {
        const errorsByTopic = new Map<TopicType, typeof history.errors>()
        for (const err of history.errors) {
            const existing = errorsByTopic.get(err.topic) || []
            existing.push(err)
            errorsByTopic.set(err.topic, existing)
        }

        return (
            <PageLayout
                title="Caderno de Erros"
                description="Questões que você errou — revise e domine"
                action={
                    <button onClick={resetToConfig} className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                        <RotateCcw className="w-4 h-4" /> Voltar
                    </button>
                }
            >
                <div className="space-y-4">
                    {Array.from(errorsByTopic.entries()).map(([topic, errs]) => {
                        const topicConfig = TOPICS.find(t => t.id === topic)
                        return (
                            <div key={topic} className="border border-border rounded-lg overflow-hidden">
                                <div className="px-4 py-2.5 bg-secondary/20 flex items-center gap-2">
                                    <TopicIcon iconName={topicConfig?.iconName || 'Calculator'} className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{topicConfig?.name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">{errs.length} erros</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {errs.map(err => (
                                        <div key={err.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/10">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm">
                                                    <LatexRenderer content={err.question} />
                                                </div>
                                                <div className="flex gap-4 mt-1.5 text-xs">
                                                    <span className="text-red-500">Sua: {err.userAnswer}</span>
                                                    <span className="text-green-600">Correta: {err.correctAnswer}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => err.id && history.removeError(err.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                                                title="Remover (já estudei)"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {history.errors.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum erro registrado</p>
                            <p className="text-sm mt-1">Continue praticando!</p>
                        </div>
                    )}
                </div>
            </PageLayout>
        )
    }

    // ==================== PLAYING VIEW ====================
    if (appState === 'playing' && currentQuestion) {
        const topicConfig = TOPICS.find(t => t.id === currentQuestion.topic)
        const progressPct = isInfiniteMode ? 0 : ((currentIdx + 1) / totalQuestions) * 100

        return (
            <PageLayout
                title="Haumea Math"
                description={isInfiniteMode ? 'Modo Infinito' : `Questão ${currentIdx + 1} de ${totalQuestions}`}
                action={
                    <div className="flex items-center gap-3">
                        <StreakIndicator streak={streak} />
                        {isTimedMode && (
                            <TimerDisplay seconds={questionTimer} limit={timerPerQuestion} />
                        )}
                        {!isTimedMode && <TimerDisplay seconds={questionTimer} />}
                        <button
                            onClick={() => {
                                if (isInfiniteMode || confirm('Encerrar sessão?')) finishSession()
                            }}
                            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                        >
                            {isInfiniteMode ? 'Parar' : 'Encerrar'}
                        </button>
                    </div>
                }
            >
                <div className="max-w-2xl mx-auto space-y-4">
                    {/* Progress bar */}
                    {!isInfiniteMode && (
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    )}

                    {/* Infinite counter */}
                    {isInfiniteMode && (
                        <div className="text-xs text-muted-foreground">
                            Questão #{currentIdx + 1} · {correctTotal}/{sessionResults.length} corretas
                        </div>
                    )}

                    {/* Topic + Difficulty */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TopicIcon iconName={topicConfig?.iconName || 'Calculator'} className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{topicConfig?.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-500/10 text-green-600' :
                                currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                                    'bg-red-500/10 text-red-600'
                                }`}>
                                {currentQuestion.difficulty}
                            </span>
                        </div>
                        <button
                            onClick={() => setFormulaTopic(currentQuestion.topic)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <BookOpen className="w-3.5 h-3.5" /> Fórmulas
                        </button>
                    </div>

                    {/* Question */}
                    <div className="p-4 bg-card border border-border rounded-xl">
                        <LatexRenderer content={currentQuestion.question} className="text-lg" />
                    </div>

                    {/* Hint */}
                    {!showHint && !answerSubmitted && currentQuestion.hint && (
                        <button
                            onClick={() => setShowHint(true)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-yellow-600 transition-colors"
                        >
                            <Lightbulb className="w-3.5 h-3.5" /> Ver dica
                        </button>
                    )}
                    <AnimatePresence>
                        {showHint && currentQuestion.hint && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-sm text-foreground"
                            >
                                <div className="flex items-start gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                                    <LatexRenderer content={currentQuestion.hint} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Answer input */}
                    {!multipleChoice ? (
                        <div>
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !answerSubmitted) submitAnswer() }}
                                    disabled={answerSubmitted}
                                    placeholder="Sua resposta..."
                                    className="flex-1 px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                />
                                {!answerSubmitted && (
                                    <button
                                        onClick={submitAnswer}
                                        disabled={!userAnswer.trim()}
                                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                                    >
                                        Enviar
                                    </button>
                                )}
                            </div>
                            <MathKeyboard
                                onInsert={insertMathKey}
                                visible={showKeyboard}
                                onToggle={() => setShowKeyboard(prev => !prev)}
                            />
                        </div>
                    ) : (
                        /* Multiple Choice */
                        <div className="space-y-2">
                            {currentQuestion.choices?.map((choice, i) => {
                                const letter = String.fromCharCode(65 + i) // A, B, C, D, E
                                const isSelected = selectedChoice === i
                                const showResult = answerSubmitted
                                const isCorrectChoice = showResult && validateAnswer(choice, currentQuestion.answer)
                                const isWrongSelected = showResult && isSelected && !isCorrectChoice

                                return (
                                    <button
                                        key={i}
                                        onClick={() => !answerSubmitted && setSelectedChoice(i)}
                                        disabled={answerSubmitted}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isCorrectChoice && showResult
                                            ? 'border-green-500 bg-green-500/10'
                                            : isWrongSelected
                                                ? 'border-red-500 bg-red-500/10'
                                                : isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/30'
                                            }`}
                                    >
                                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                                            }`}>
                                            {letter}
                                        </span>
                                        <LatexRenderer content={`$${choice}$`} className="text-sm" />
                                    </button>
                                )
                            })}
                            {!answerSubmitted && (
                                <button
                                    onClick={submitAnswer}
                                    disabled={selectedChoice === null}
                                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors mt-2"
                                >
                                    Confirmar
                                </button>
                            )}
                        </div>
                    )}

                    {/* Result feedback */}
                    <AnimatePresence>
                        {answerSubmitted && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border ${isCorrect
                                    ? 'border-green-500/30 bg-green-500/5'
                                    : 'border-red-500/30 bg-red-500/5'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {isCorrect
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        : <XCircle className="w-5 h-5 text-red-500" />
                                    }
                                    <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                        {isCorrect ? 'Correto!' : 'Incorreto'}
                                    </span>
                                </div>

                                {!isCorrect && (
                                    <div className="text-sm text-foreground">
                                        <span className="text-muted-foreground">Resposta: </span>
                                        <LatexRenderer content={currentQuestion.answerDisplay} />
                                    </div>
                                )}

                                {/* Step by step toggle */}
                                {currentQuestion.steps && currentQuestion.steps.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => setShowSteps(prev => !prev)}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
                                        >
                                            {showSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            {showSteps ? 'Ocultar resolução' : 'Ver resolução passo a passo'}
                                        </button>
                                        <StepViewer steps={currentQuestion.steps} visible={showSteps} />
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={nextQuestion}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        {!isInfiniteMode && currentIdx >= totalQuestions - 1
                                            ? <><Trophy className="w-4 h-4" /> Ver Resultado</>
                                            : <><ArrowRight className="w-4 h-4" /> Próxima</>
                                        }
                                    </button>
                                    <button
                                        onClick={() => { setShowTutorModal(true); setTutorResponse(null); setTutorImage(null) }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
                                    >
                                        <Bot className="w-4 h-4" /> Tutor IA
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Formula Sheet Modal */}
                <FormulaSheet
                    topic={formulaTopic || currentQuestion.topic}
                    open={formulaTopic !== null}
                    onClose={() => setFormulaTopic(null)}
                />

                {/* Tutor Modal */}
                {showTutorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold text-foreground">Tutor IA</h3>
                                </div>
                                <button onClick={() => setShowTutorModal(false)} className="p-1 rounded hover:bg-secondary">
                                    <XCircle className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                <p className="text-sm text-muted-foreground">
                                    Envie uma foto da sua resolução para análise detalhada.
                                </p>

                                {!tutorImage ? (
                                    <div className="space-y-2">
                                        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">Clique ou arraste uma imagem</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                            />
                                        </label>
                                        <button
                                            onClick={handlePaste}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
                                        >
                                            <ClipboardPaste className="w-4 h-4" /> Colar do clipboard
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <img src={tutorImage} alt="Resolução" className="w-full rounded-lg border border-border" />
                                            <button
                                                onClick={() => { setTutorImage(null); setTutorResponse(null) }}
                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                                            >
                                                <XCircle className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                        {!tutorResponse && (
                                            <button
                                                onClick={analyzeWithTutor}
                                                disabled={analyzing}
                                                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                            >
                                                {analyzing ? 'Analisando...' : 'Analisar Resolução'}
                                            </button>
                                        )}
                                        {tutorResponse && (
                                            <div className="p-3 bg-secondary/30 rounded-lg">
                                                <LatexRenderer content={tutorResponse.analysis || tutorResponse.feedback || JSON.stringify(tutorResponse)} className="text-sm" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </PageLayout>
        )
    }

    // ==================== SUMMARY VIEW ====================
    if (appState === 'summary') {
        const topicMap = new Map<TopicType, { total: number; correct: number }>()
        for (const r of sessionResults) {
            const existing = topicMap.get(r.question.topic) || { total: 0, correct: 0 }
            existing.total++
            if (r.isCorrect) existing.correct++
            topicMap.set(r.question.topic, existing)
        }

        const formatTime = (seconds: number) => {
            const m = Math.floor(seconds / 60)
            const s = seconds % 60
            return `${m}m ${s.toString().padStart(2, '0')}s`
        }

        return (
            <PageLayout title="Resultado" description={`Sessão ${mode === 'infinite' ? 'Infinita' : mode === 'timed' ? 'Contrarrelógio' : 'Padrão'}`}>
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Score */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className={`text-6xl font-bold mb-2 ${accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {accuracy}%
                        </div>
                        <p className="text-muted-foreground">
                            {correctTotal} de {sessionResults.length} questões corretas
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tempo total: {formatTime(sessionTimer)}
                        </p>
                    </motion.div>

                    {/* Topic breakdown */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Por Tópico</h3>
                        {Array.from(topicMap.entries()).map(([topic, data]) => {
                            const topicConfig = TOPICS.find(t => t.id === topic)
                            const pct = Math.round((data.correct / data.total) * 100)
                            return (
                                <div key={topic} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                                    <TopicIcon iconName={topicConfig?.iconName || 'Calculator'} className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium truncate">{topicConfig?.name}</span>
                                            <span className={`text-sm font-bold ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-secondary rounded-full mt-1.5">
                                            <div
                                                className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            {data.correct}/{data.total} corretas
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={resetToConfig}
                            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Novo Treino
                        </button>
                        {history.errors.length > 0 && (
                            <button
                                onClick={() => setAppState('errors')}
                                className="py-2.5 px-4 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors flex items-center gap-2"
                            >
                                <BookOpen className="w-4 h-4" /> Caderno de Erros
                            </button>
                        )}
                    </div>
                </div>
            </PageLayout>
        )
    }

    // Fallback
    return null
}
