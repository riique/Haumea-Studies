'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'

export default function NovaEntradaPage() {
  const router = useRouter()
  const { createEntry } = useJournalEntries()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Por favor, adicione um título antes de salvar.')
      return
    }
    if (!content.trim()) {
      alert('Por favor, escreva algo antes de salvar.')
      return
    }

    setSaving(true)
    try {
      await createEntry({ title, content })
      router.push('/diario')
    } catch (error) {
      alert('Erro ao salvar entrada. Tente novamente.')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if ((title.trim() || content.trim()) && !window.confirm('Deseja descartar esta entrada?')) {
      return
    }
    router.push('/diario')
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
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Nova Entrada</h1>
          </div>
        </div>

        {/* Editor Card */}
        <Card>
          <CardHeader>
            <CardTitle>O que você quer registrar hoje?</CardTitle>
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
                placeholder="Escreva seus pensamentos, reflexões, frustrações, insights... Este é seu espaço pessoal.&#10;&#10;Exemplos:&#10;- Hoje o estudo de física travou completamente...&#10;- Percebi um padrão nos meus erros de português...&#10;- Estou me sentindo sobrecarregado com tantas matérias..."
                className="w-full min-h-[350px] p-4 rounded-lg border border-input bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {content.length} caracteres
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Entrada'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3">💡 Dicas para seu diário:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Seja honesto e autêntico - este é seu espaço privado</li>
              <li>• Registre tanto sucessos quanto dificuldades</li>
              <li>• Anote padrões que você percebe nos seus estudos</li>
              <li>• Use o diário para processar emoções e frustrações</li>
              <li>• Reflita sobre o que funcionou e o que não funcionou</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
