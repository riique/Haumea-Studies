'use client'

import { useState } from 'react'
import { TextoMarcado, LegendaMarcacoes } from '@/components/TextoMarcado'
import { MarcacoesTexto } from '@/types/redacao'
import { BookOpen, Lightbulb, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export default function CorrecaoRedacaoMockPage() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const mock: MarcacoesTexto = {
    textoOriginal:
      'A educacao e importante. Porem a implementacao falha no Brasil. Portanto investir e urgente.',
    marcacoes: [
      { tipo: 'destaque', subtipo: 'positivo', inicio: 0, fim: 26, trecho: 'A educacao e importante.' },
      { tipo: 'erro', subtipo: 'gramatical', inicio: 28, fim: 33, trecho: 'Porem', comentario: "Use acento: 'Porém'." },
      { tipo: 'comentario', inicio: 34, fim: 39, trecho: 'a imp', comentario: 'Explique melhor quais áreas de implementação.' },
      { tipo: 'destaque', subtipo: 'atencao', inicio: 58, fim: 64, trecho: 'Brasil.' }
    ]
  }

  const isProd = process.env.NODE_ENV === 'production'

  const saveMockToFirestore = async () => {
    if (!user) {
      setMessage('Faça login para salvar o mock no seu Firestore.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const id = String(Date.now())
      const ref = doc(db, 'users', user.uid, 'redacoes', id)
      await setDoc(ref, {
        userId: user.uid,
        tema: 'Mock - marcacoesTexto',
        texto: mock.textoOriginal,
        marcacoesTexto: mock,
        notaFinal: 800,
        competencias: {
          c1: { nota: 160, feedback: '', pontosFortes: [], pontosAMelhorar: [] },
          c2: { nota: 160, feedback: '', pontosFortes: [], pontosAMelhorar: [] },
          c3: { nota: 160, feedback: '', pontosFortes: [], pontosAMelhorar: [] },
          c4: { nota: 160, feedback: '', pontosFortes: [], pontosAMelhorar: [] },
          c5: { nota: 160, feedback: '', pontosFortes: [], pontosAMelhorar: [] },
        },
        feedbackGeral: 'Mock de feedback geral para teste de UI.',
        sugestoesMelhoria: [],
        errosGramaticais: [],
        status: 'concluida',
        createdAt: serverTimestamp(),
        creditoCusto: 0,
      })
      setMessage('Documento de teste salvo com sucesso. Veja na lista de Redações.')
    } catch (e: any) {
      setMessage(e?.message || 'Erro ao salvar mock no Firestore')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mock de Marcações de Redação</h1>
      {isProd ? (
        <div className="p-6 rounded-lg border border-border bg-secondary">
          <p className="text-sm text-muted-foreground">
            Esta página de mock está desativada em produção.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-background to-secondary border-2 border-primary/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Render de teste (marcacoesTexto)</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <LegendaMarcacoes />
            </div>
            <div className="lg:col-span-3">
              <div className="bg-card rounded-lg p-6 border-2 border-border shadow-sm">
                <TextoMarcado marcacoesTexto={mock} className="text-foreground" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={saveMockToFirestore}
                  disabled={saving}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar mock no Firestore'}
                </button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="font-semibold">Dica:</span>
              <span>
                Clique nos ícones azuis
              </span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white mx-1">
                <MessageSquare className="w-3 h-3" />
              </span>
              <span>para ver comentários.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
