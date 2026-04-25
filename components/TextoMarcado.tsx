/**
 * Componente para renderizar texto com marcações XML da IA
 */

import React, { useState } from 'react'
import { parseTextoMarcado, processarMarcacoes } from '@/lib/xmlParser'
import { TextoElemento, MarcacoesTexto } from '@/types/redacao'
import { CheckCircle, AlertCircle, XCircle, MessageSquare } from 'lucide-react'

interface TextoMarcadoProps {
  textoXML?: string
  marcacoesTexto?: MarcacoesTexto
  className?: string
}

export function TextoMarcado({ textoXML, marcacoesTexto, className = '' }: TextoMarcadoProps) {
  const elementos = marcacoesTexto
    ? processarMarcacoes(marcacoesTexto)
    : textoXML
      ? parseTextoMarcado(textoXML)
      : ([] as TextoElemento[])
  const [comentarioVisivel, setComentarioVisivel] = useState<number | null>(null)

  const renderElemento = (elemento: TextoElemento, index: number) => {
    switch (elemento.tipo) {
      case 'texto':
        return <span key={index}>{elemento.conteudo}</span>

      case 'destaque':
        const isPositivo = elemento.atributos?.tipo === 'positivo'
        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
              isPositivo
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            }`}
            title={isPositivo ? 'Destaque positivo' : 'Ponto de atenção'}
          >
            {isPositivo ? (
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
            )}
            <span className="font-medium">{elemento.conteudo}</span>
          </span>
        )

      case 'erro':
        const tipoErro = elemento.atributos?.tipo || 'gramatical'
        const corErro =
          tipoErro === 'gramatical'
            ? 'bg-red-100 text-red-800 border-red-300'
            : tipoErro === 'estrutural'
            ? 'bg-orange-100 text-orange-800 border-orange-300'
            : 'bg-purple-100 text-purple-800 border-purple-300'

        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${corErro}`}
            title={`Erro ${tipoErro}`}
          >
            <XCircle className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium line-through decoration-2">
              {elemento.conteudo}
            </span>
          </span>
        )

      case 'comentario':
        return (
          <span key={index} className="relative inline-block">
            <button
              onClick={() =>
                setComentarioVisivel(comentarioVisivel === index ? null : index)
              }
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
              title="Ver comentário"
            >
              <MessageSquare className="w-3 h-3" />
            </button>
            {comentarioVisivel === index && (
              <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">{elemento.conteudo}</p>
                </div>
                <div className="absolute bottom-[-8px] left-3 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-blue-300" />
              </div>
            )}
          </span>
        )

      default:
        return null
    }
  }

  return (
    <div className={`text-base leading-relaxed whitespace-pre-wrap ${className}`}>
      {elementos.map((elemento, index) => renderElemento(elemento, index))}
    </div>
  )
}

interface LegendaMarcacoesProps {
  className?: string
}

export function LegendaMarcacoes({ className = '' }: LegendaMarcacoesProps) {
  return (
    <div className={`bg-secondary rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-foreground mb-3">
        Legendas das Marcações
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300">
            <CheckCircle className="w-3 h-3" />
            <span className="font-medium">Texto</span>
          </span>
          <span className="text-muted-foreground">Destaque positivo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">Texto</span>
          </span>
          <span className="text-muted-foreground">Ponto de atenção</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3" />
            <span className="font-medium line-through">Texto</span>
          </span>
          <span className="text-muted-foreground">Erro identificado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">
            <MessageSquare className="w-3 h-3" />
          </span>
          <span className="text-muted-foreground">Comentário da IA (clique para ver)</span>
        </div>
      </div>
    </div>
  )
}
