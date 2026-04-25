'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContentProgress } from '@/types/content'
import { 
  TrendingUp, 
  Target, 
  Award, 
  Clock,
  BookOpen,
  CheckCircle2
} from 'lucide-react'

interface ContentStatsProps {
  progress: ContentProgress
  totalSubjects: number
  totalFronts: number
  totalTopics: number
  recentlyCompleted?: number
}

export function ContentStats({ 
  progress, 
  totalSubjects, 
  totalFronts, 
  totalTopics,
  recentlyCompleted = 0
}: ContentStatsProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return 'default'
    if (percentage >= 50) return 'secondary'
    return 'outline'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-2xl font-bold ${getProgressColor(progress.percentage)}`}>
              {progress.percentage}%
            </span>
            <Badge variant={getProgressBadgeVariant(progress.percentage)}>
              {progress.completedItems}/{progress.totalItems}
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Structure Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Estrutura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Matérias</span>
            <span className="font-medium">{totalSubjects}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frentes</span>
            <span className="font-medium">{totalFronts}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tópicos</span>
            <span className="font-medium">{totalTopics}</span>
          </div>
        </CardContent>
      </Card>

      {/* Best Subject */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="w-4 h-4" />
            Melhor Matéria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const bestSubject = Object.values(progress.subjectProgress)
              .sort((a, b) => b.percentage - a.percentage)[0]
            
            if (!bestSubject) return <span className="text-sm text-muted-foreground">-</span>
            
            return (
              <div>
                <div className="font-medium text-sm truncate mb-1">
                  {bestSubject.name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getProgressBadgeVariant(bestSubject.percentage)}>
                    {bestSubject.percentage}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {bestSubject.completed}/{bestSubject.total}
                  </span>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 mb-1">
            +{recentlyCompleted}
          </div>
          <div className="text-xs text-muted-foreground">
            Itens concluídos hoje
          </div>
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progresso por Matéria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(progress.subjectProgress)
              .sort((a, b) => b.percentage - a.percentage)
              .map((subject: any) => (
                <div key={subject.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1">
                      {subject.name}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-muted-foreground">
                        {subject.completed}/{subject.total}
                      </span>
                      <Badge 
                        variant={getProgressBadgeVariant(subject.percentage)}
                        className="text-xs"
                      >
                        {subject.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
