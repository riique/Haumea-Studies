'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface ContentFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  showCompleted: boolean
  onToggleCompleted: () => void
  showPending: boolean
  onTogglePending: () => void
  selectedSubjects: string[]
  onSubjectToggle: (subjectId: string) => void
  availableSubjects: { id: string; name: string; count: number }[]
  onReset: () => void
}

export function ContentFilters({
  searchTerm,
  onSearchChange,
  showCompleted,
  onToggleCompleted,
  showPending,
  onTogglePending,
  selectedSubjects,
  onSubjectToggle,
  availableSubjects,
  onReset
}: ContentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = searchTerm || !showCompleted || !showPending || selectedSubjects.length < availableSubjects.length

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium text-sm">Filtros</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Ativos
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={onToggleCompleted}
                className="text-xs"
              >
                {showCompleted ? (
                  <CheckSquare className="w-3 h-3 mr-1" />
                ) : (
                  <Square className="w-3 h-3 mr-1" />
                )}
                Concluídos
              </Button>
              
              <Button
                variant={showPending ? "default" : "outline"}
                size="sm"
                onClick={onTogglePending}
                className="text-xs"
              >
                {showPending ? (
                  <CheckSquare className="w-3 h-3 mr-1" />
                ) : (
                  <Square className="w-3 h-3 mr-1" />
                )}
                Pendentes
              </Button>
            </div>
          </div>

          {/* Subject Filters */}
          {availableSubjects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Matérias</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Button
                      variant={selectedSubjects.includes(subject.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSubjectToggle(subject.id)}
                      className="text-xs flex-1 justify-start mr-2"
                    >
                      {selectedSubjects.includes(subject.id) ? (
                        <CheckSquare className="w-3 h-3 mr-1" />
                      ) : (
                        <Square className="w-3 h-3 mr-1" />
                      )}
                      {subject.name}
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {subject.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
