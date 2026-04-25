'use client'

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

interface AddExamModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, day1Date?: Date, day2Date?: Date) => Promise<void>
}

export default function AddExamModal({ isOpen, onClose, onAdd }: AddExamModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [name, setName] = useState('')
  const [day1Date, setDay1Date] = useState('')
  const [day2Date, setDay2Date] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Preencha o nome do vestibular')
      return
    }

    if (!day1Date && !day2Date) {
      setError('Adicione pelo menos uma data (Dia 1 ou Dia 2)')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Parse das datas usando fuso horário local (não UTC)
      // Quando usamos new Date("YYYY-MM-DD"), o JS interpreta como meia-noite UTC,
      // o que pode resultar em um dia anterior no fuso horário local (ex: Brasília UTC-3)
      const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number)
        return new Date(year, month - 1, day, 12, 0, 0) // meio-dia para evitar problemas de DST
      }

      const day1 = day1Date ? parseLocalDate(day1Date) : undefined
      const day2 = day2Date ? parseLocalDate(day2Date) : undefined

      if (day1 && day1 < new Date()) {
        setError('A data do Dia 1 deve ser no futuro')
        setLoading(false)
        return
      }

      if (day2 && day2 < new Date()) {
        setError('A data do Dia 2 deve ser no futuro')
        setLoading(false)
        return
      }

      if (day1 && day2 && day1 > day2) {
        setError('O Dia 1 deve ser antes do Dia 2')
        setLoading(false)
        return
      }

      await onAdd(name, day1, day2)
      setName('')
      setDay1Date('')
      setDay2Date('')
      onClose()
    } catch (err) {
      setError('Erro ao adicionar vestibular')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-xl sm:rounded-xl shadow-lg w-full sm:max-w-md max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Adicionar Vestibular</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nome do Vestibular
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: ENEM 2025"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data do Dia 1 <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <input
              type="date"
              value={day1Date}
              onChange={(e) => setDay1Date(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Data do Dia 2 <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <input
              type="date"
              value={day2Date}
              onChange={(e) => setDay2Date(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
