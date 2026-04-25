'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2, BookOpen } from 'lucide-react'

export default function EditarEntradaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entryId = searchParams.get('id') || ''
  const { entries, updateEntry, deleteEntry } = useJournalEntries()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [originalTitle, setOriginalTitle] = useState('')
  const [originalContent, setOriginalContent] = useState('')

  useEffect(() => {
    if (!entryId) {
      router.push('/diario')
      return
    }

    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      setTitle(entry.title)
      setContent(entry.content)
      setOriginalTitle(entry.title)
      setOriginalContent(entry.content)
      setLoading(false)
    } else if (entries.length > 0) {
      // Se já carregou as entradas mas não encontrou a entrada, redireciona
      router.push('/diario')
    }
  }, [entries, entryId, router])

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Por favor, adicione um título antes de salvar.')
      return
    }
    if (!content.trim()) {
      alert('Por favor, escreva algo antes de salvar.')
      return
    }

    if (title === originalTitle && content === originalContent) {
      router.push('/diario')
      return
    }

    setSaving(true)
    try {
      await updateEntry(entryId, { title, content })
      router.push('/diario')
    } catch (error) {
      alert('Erro ao salvar entrada. Tente novamente.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteEntry(entryId)
      router.push('/diario')
    } catch (error) {
      alert('Erro ao excluir entrada. Tente novamente.')
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    if ((title !== originalTitle || content !== originalContent) && !window.confirm('Deseja descartar as alterações?')) {
      return
    }
    router.push('/diario')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando entrada...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="gap-2 mb-4"
            disabled={saving || deleting}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Editar Entrada</h1>
            </div>
            
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>

        {/* Editor Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edite sua entrada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reflexões sobre Física Quântica, Dia desafiador de estudos..."
                className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Conteúdo
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva seus pensamentos, reflexões, frustrações, insights..."
                className="w-full min-h-[350px] p-4 rounded-lg border border-input bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {content.length} caracteres
                {(title !== originalTitle || content !== originalContent) && (
                  <span className="ml-2 text-amber-600">• Modificado</span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving || deleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || deleting || !title.trim() || !content.trim()}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
