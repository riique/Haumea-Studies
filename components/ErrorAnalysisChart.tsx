'use client'

import { useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'
import { motion } from 'framer-motion'
import { BookX, Brain } from 'lucide-react'

interface Simulado {
    id: string
    nome: string
    tipo: string
    banca?: 'ENEM' | 'UFSM'
    questoes?: {
        [provaKey: string]: {
            [questaoNum: string]: {
                acertou: boolean
                motivoErro?: 'falta_conteudo' | 'falta_atencao'
            }
        }
    }
}

interface ErrorAnalysisChartProps {
    simulados: Simulado[]
}

const COLORS = {
    falta_conteudo: '#ef4444',   // Vermelho
    falta_atencao: '#f59e0b',    // Âmbar
    acertos: '#22c55e'           // Verde
}

export function ErrorAnalysisChart({ simulados }: ErrorAnalysisChartProps) {
    // Calcular estatísticas de erros
    const stats = useMemo(() => {
        let totalQuestoes = 0
        let acertos = 0
        let faltaConteudo = 0
        let faltaAtencao = 0
        let errosSemMotivo = 0

        // Estatísticas por banca
        const porBanca: { [key: string]: { acertos: number; faltaConteudo: number; faltaAtencao: number; total: number } } = {}

        simulados.forEach(simulado => {
            if (!simulado.questoes) return

            const banca = simulado.banca || 'Outros'
            if (!porBanca[banca]) {
                porBanca[banca] = { acertos: 0, faltaConteudo: 0, faltaAtencao: 0, total: 0 }
            }

            Object.values(simulado.questoes).forEach(prova => {
                Object.values(prova).forEach(questao => {
                    totalQuestoes++
                    porBanca[banca].total++

                    if (questao.acertou) {
                        acertos++
                        porBanca[banca].acertos++
                    } else {
                        if (questao.motivoErro === 'falta_conteudo') {
                            faltaConteudo++
                            porBanca[banca].faltaConteudo++
                        } else if (questao.motivoErro === 'falta_atencao') {
                            faltaAtencao++
                            porBanca[banca].faltaAtencao++
                        } else {
                            errosSemMotivo++
                        }
                    }
                })
            })
        })

        return {
            totalQuestoes,
            acertos,
            faltaConteudo,
            faltaAtencao,
            errosSemMotivo,
            porBanca
        }
    }, [simulados])

    // Dados para o gráfico de pizza
    const pieData = useMemo(() => [
        { name: 'Acertos', value: stats.acertos, color: COLORS.acertos },
        { name: 'Falta de Conteúdo', value: stats.faltaConteudo, color: COLORS.falta_conteudo },
        { name: 'Falta de Atenção', value: stats.faltaAtencao, color: COLORS.falta_atencao }
    ].filter(d => d.value > 0), [stats])

    // Dados para o gráfico de barras
    const barData = useMemo(() =>
        Object.entries(stats.porBanca).map(([banca, data]) => ({
            banca,
            'Falta de Conteúdo': data.faltaConteudo,
            'Falta de Atenção': data.faltaAtencao,
            'Acertos': data.acertos
        }))
        , [stats.porBanca])

    // Total de erros categorizados
    const totalErros = stats.faltaConteudo + stats.faltaAtencao
    const porcentagemConteudo = totalErros > 0 ? Math.round((stats.faltaConteudo / totalErros) * 100) : 0
    const porcentagemAtencao = totalErros > 0 ? Math.round((stats.faltaAtencao / totalErros) * 100) : 0

    if (stats.totalQuestoes === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
                <p className="text-muted-foreground">
                    Nenhum simulado com questões marcadas. Adicione simulados e marque as questões para visualizar a análise de erros.
                </p>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-foreground">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {data.value} questões ({Math.round((data.value / stats.totalQuestoes) * 100)}%)
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-xl p-6"
        >
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Análise de Erros
                </h3>
                <p className="text-sm text-muted-foreground">
                    Identifique padrões nos seus erros para melhorar seu desempenho
                </p>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Acertos</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.acertos}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <BookX className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Falta de Conteúdo</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.faltaConteudo}
                                <span className="text-sm font-normal ml-1">({porcentagemConteudo}% dos erros)</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Falta de Atenção</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {stats.faltaAtencao}
                                <span className="text-sm font-normal ml-1">({porcentagemAtencao}% dos erros)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza */}
                <div className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-4">Distribuição Geral</h4>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Barras por Banca */}
                {barData.length > 0 && (
                    <div className="bg-secondary/30 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-foreground mb-4">Por Banca</h4>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis
                                        dataKey="banca"
                                        type="category"
                                        width={60}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Acertos" fill={COLORS.acertos} stackId="stack" />
                                    <Bar dataKey="Falta de Conteúdo" fill={COLORS.falta_conteudo} stackId="stack" />
                                    <Bar dataKey="Falta de Atenção" fill={COLORS.falta_atencao} stackId="stack" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Insight */}
            {totalErros > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2">💡 Insight</h4>
                        <p className="text-sm text-muted-foreground">
                            {porcentagemConteudo > porcentagemAtencao ? (
                                <>
                                    <strong>A maioria dos seus erros ({porcentagemConteudo}%) são por falta de conteúdo.</strong> Recomendamos revisar os tópicos onde você mais erra e focar no estudo desses conteúdos.
                                </>
                            ) : porcentagemAtencao > porcentagemConteudo ? (
                                <>
                                    <strong>A maioria dos seus erros ({porcentagemAtencao}%) são por falta de atenção.</strong> Tente ler as questões com mais calma e verificar suas respostas antes de finalizar.
                                </>
                            ) : (
                                <>
                                    Seus erros estão equilibrados entre falta de conteúdo e falta de atenção. Trabalhe em ambas as frentes: revise conteúdos e pratique atenção aos detalhes.
                                </>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
