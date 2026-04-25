/**
 * Parser de XML para processar marcações de texto da IA
 */

import { TextoElemento, MarcacoesTexto } from '@/types/redacao'

/**
 * Parseia texto com tags XML e retorna array de elementos estruturados
 */
export function parseTextoMarcado(textoXML: string): TextoElemento[] {
  const elementos: TextoElemento[] = []

  // Regex para encontrar tags XML
  const tagRegex = /<(destaque|erro|comentario)(\s+tipo="([^"]+)")?>(.*?)<\/\1>/gs

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(textoXML)) !== null) {
    // Adicionar texto antes da tag
    if (match.index > lastIndex) {
      const textoAntes = textoXML.substring(lastIndex, match.index)
      if (textoAntes.trim()) {
        elementos.push({
          tipo: 'texto',
          conteudo: textoAntes,
        })
      }
    }

    // Adicionar elemento com tag
    const tagName = match[1] as 'destaque' | 'erro' | 'comentario'
    const tipoAttr = match[3]
    const conteudo = match[4]

    elementos.push({
      tipo: tagName,
      conteudo: conteudo,
      atributos: tipoAttr ? { tipo: tipoAttr as 'positivo' | 'atencao' | 'gramatical' | 'estrutural' | 'argumentativo' } : undefined,
    })

    lastIndex = match.index + match[0].length
  }

  // Adicionar texto restante
  if (lastIndex < textoXML.length) {
    const textoRestante = textoXML.substring(lastIndex)
    if (textoRestante.trim()) {
      elementos.push({
        tipo: 'texto',
        conteudo: textoRestante,
      })
    }
  }

  return elementos
}

export function processarMarcacoes(marcacoesTexto: MarcacoesTexto): TextoElemento[] {
  const elementos: TextoElemento[] = []
  const { textoOriginal, marcacoes } = marcacoesTexto

  // Filtrar marcações inválidas antes de processar
  const validMarcacoes = marcacoes.filter((m) => {
    // Verificar se os índices são números válidos
    if (typeof m.inicio !== 'number' || typeof m.fim !== 'number') {
      console.warn('Marcação com índices inválidos ignorada:', m)
      return false
    }
    // Verificar se os índices estão dentro do range do texto
    if (m.inicio < 0 || m.fim > textoOriginal.length || m.inicio > m.fim) {
      console.warn('Marcação com índices fora do range ignorada:', m)
      return false
    }
    return true
  })

  const sorted = [...validMarcacoes].sort((a, b) => a.inicio - b.inicio)
  let cursor = 0

  for (const m of sorted) {
    const start = Math.max(0, Math.min(textoOriginal.length, Math.floor(m.inicio)))
    const end = Math.max(start, Math.min(textoOriginal.length, Math.floor(m.fim)))

    // Evitar sobreposição com cursor atual
    if (start < cursor) {
      console.warn('Marcação sobreposta ignorada:', m)
      continue
    }

    if (start > cursor) {
      const plain = textoOriginal.slice(cursor, start)
      if (plain) {
        elementos.push({ tipo: 'texto', conteudo: plain })
      }
    }

    const trecho = textoOriginal.slice(start, end)

    // Ignorar marcações que resultam em trechos vazios
    if (!trecho && m.tipo !== 'comentario') {
      console.warn('Marcação com trecho vazio ignorada:', m)
      cursor = end
      continue
    }

    if (m.tipo === 'destaque') {
      elementos.push({ tipo: 'destaque', conteudo: trecho, atributos: m.subtipo ? { tipo: m.subtipo } : undefined })
      if (m.comentario) {
        elementos.push({ tipo: 'comentario', conteudo: m.comentario })
      }
    } else if (m.tipo === 'erro') {
      elementos.push({ tipo: 'erro', conteudo: trecho, atributos: m.subtipo ? { tipo: m.subtipo } : undefined })
      if (m.comentario) {
        elementos.push({ tipo: 'comentario', conteudo: m.comentario })
      }
    } else if (m.tipo === 'comentario') {
      if (trecho) elementos.push({ tipo: 'texto', conteudo: trecho })
      if (m.comentario) elementos.push({ tipo: 'comentario', conteudo: m.comentario })
    }

    cursor = end
  }

  if (cursor < textoOriginal.length) {
    const rest = textoOriginal.slice(cursor)
    if (rest) elementos.push({ tipo: 'texto', conteudo: rest })
  }

  return elementos
}

/**
 * Remove todas as tags XML do texto, deixando apenas o conteúdo
 */
export function stripXMLTags(textoXML: string): string {
  return textoXML
    .replace(/<destaque(\s+tipo="[^"]+")?>(.+?)<\/destaque>/gs, '$2')
    .replace(/<erro(\s+tipo="[^"]+")?>(.+?)<\/erro>/gs, '$2')
    .replace(/<comentario>(.+?)<\/comentario>/gs, '')
    .trim()
}

/**
 * Conta o número de marcações por tipo
 */
export function contarMarcacoes(textoXML: string): {
  destaquesPositivos: number;
  destaquesAtencao: number;
  erros: number;
  comentarios: number;
} {
  const destaquesPositivos = (textoXML.match(/<destaque tipo="positivo">/g) || []).length
  const destaquesAtencao = (textoXML.match(/<destaque tipo="atencao">/g) || []).length
  const erros = (textoXML.match(/<erro/g) || []).length
  const comentarios = (textoXML.match(/<comentario>/g) || []).length

  return {
    destaquesPositivos,
    destaquesAtencao,
    erros,
    comentarios,
  }
}
