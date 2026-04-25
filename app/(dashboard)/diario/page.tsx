'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Plus, Edit2, Trash2, BookOpen, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DiarioPage() {
  const router = useRouter()
  const { entries, loading, deleteEntry } = useJournalEntries()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (entryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.')) {
      setDeletingId(entryId)
      try {
        await deleteEntry(entryId)
      } catch (error) {
        alert('Erro ao excluir entrada. Tente novamente.')
      } finally {
        setDeletingId(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando entradas...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Diário de Bordo</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Registre seus pensamentos, frustrações, insights e reflexões sobre seu processo de estudo.
            Este é seu espaço pessoal para autoconhecimento e crescimento.
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Button
            size="lg"
            onClick={() => router.push('/diario/novo')}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Entrada
          </Button>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma entrada ainda
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Comece seu diário de bordo registrando seus primeiros pensamentos sobre sua jornada de estudos.
              </p>
              <Button onClick={() => router.push('/diario/novo')} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Entrada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={entry.createdAt.toISOString()}>
                      {format(entry.createdAt, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </time>
                    {entry.updatedAt.getTime() !== entry.createdAt.getTime() && (
                      <span className="text-xs">
                        (editado em {format(entry.updatedAt, "d/MM/yyyy 'às' HH:mm", { locale: ptBR })})
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/diario/editar?id=${entry.id}`)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === entry.id ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
