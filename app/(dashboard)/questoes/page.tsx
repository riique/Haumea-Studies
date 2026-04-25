'use client'

import { PageLayout } from '@/components/PageLayout'
import { Plus, Search, FileQuestion, Calendar, BookOpen, Filter, Video, FileText, X, Eye, Pencil, Trash2, AlertTriangle, Image as ImageIcon, Upload, BookmarkPlus, Bookmark, ZoomIn, ZoomOut, Bot, Sparkles, ScanText } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuestoes, useMaterias, useCategorias } from '@/hooks/useFirestoreData'
import { collection, addDoc, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { LatexRenderer } from '@/components/LatexRenderer'
import { generateExplanation, transcribeQuestion } from '@/lib/openrouter'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function QuestoesPage() {
  const { user, userData } = useAuth()
  const { questoes, loading } = useQuestoes()
  const { materias: materiasFirestore, loading: loadingMaterias } = useMaterias()
  const { categorias, loading: loadingCategorias } = useCategorias()
  const [showNewQuestao, setShowNewQuestao] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [materia, setMateria] = useState('')
  const [assunto, setAssunto] = useState('')
  const [tipoQuestao, setTipoQuestao] = useState('')
  const [enunciado, setEnunciado] = useState('')
  const [alternativas, setAlternativas] = useState(['', '', '', '', ''])
  const [mostrarAlternativas, setMostrarAlternativas] = useState(false)
  const [respostaCorreta, setRespostaCorreta] = useState('')
  const [tipoResolucao, setTipoResolucao] = useState('texto')
  const [resolucaoTexto, setResolucaoTexto] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [anotacoes, setAnotacoes] = useState('')
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [imagemUrl, setImagemUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [gerandoExplicacao, setGerandoExplicacao] = useState(false)
  const [filtroMateria, setFiltroMateria] = useState('todas')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'erradas' | 'revisar'>('todas')
  const [salvando, setSalvando] = useState(false)
  const [questaoSelecionada, setQuestaoSelecionada] = useState<any>(null)
  const [questaoEditando, setQuestaoEditando] = useState<any>(null)
  const [questaoParaExcluir, setQuestaoParaExcluir] = useState<any>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [imagemZoom, setImagemZoom] = useState<string | null>(null)
  const [mostrarRespostaModal, setMostrarRespostaModal] = useState(false)
  const [imagemResolucaoFile, setImagemResolucaoFile] = useState<File | null>(null)
  const [imagemResolucaoUrl, setImagemResolucaoUrl] = useState('')
  const [uploadingImageResolucao, setUploadingImageResolucao] = useState(false)
  const [transcrevendoQuestao, setTranscrevendoQuestao] = useState(false)

  // Usar matérias do Firestore
  const materias = useMemo(() => {
    return materiasFirestore.map(m => m.nome).sort()
  }, [materiasFirestore])

  // Flag para permitir adicionar nova matéria
  const [novaMateria, setNovaMateria] = useState(false)
  const [nomeNovaMateria, setNomeNovaMateria] = useState('')

  // Categorias hierárquicas para filtros (com indentação)
  const categoriasHierarquicas = useMemo(() => {
    const byParent = new Map<string | null, any[]>()
    categorias.forEach(c => {
      const p = c.parentId || null
      const arr = byParent.get(p) || []
      arr.push(c)
      byParent.set(p, arr)
    })
    byParent.forEach(arr => arr.sort((a, b) => a.ordem - b.ordem))
    const result: { id: string; label: string }[] = []
    const walk = (parentId: string | null, depth: number) => {
      const list = byParent.get(parentId) || []
      list.forEach(c => {
        result.push({ id: c.id, label: `${'— '.repeat(depth)}${c.nome}` })
        walk(c.id, depth + 1)
      })
    }
    walk(null, 0)
    return result
  }, [categorias])

  const labelsPorCategoria = useMemo(() => new Map(categoriasHierarquicas.map(c => [c.id, c.label])), [categoriasHierarquicas])
  const categoriaById = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias])
  const getCategoriaPathLabel = (catId: string) => {
    const parts: string[] = []
    let current: any | undefined = categoriaById.get(catId)
    let guard = 0
    while (current && guard < 100) {
      parts.push(current.nome)
      current = current.parentId ? categoriaById.get(current.parentId) : undefined
      guard++
    }
    return parts.length ? parts.reverse().join(' > ') : ''
  }

  // Mapa de matéria -> categoriaId (ou null)
  const materiaCategoriaMap = useMemo(() => {
    const m = new Map<string, string | null>()
    materiasFirestore.forEach(mat => m.set(mat.nome, mat.categoriaId || null))
    return m
  }, [materiasFirestore])

  // Questões filtradas (matéria, categoria, busca, status)
  const questoesFiltradas = useMemo(() => {
    return questoes.filter(q => {
      if (filtroMateria !== 'todas' && q.materia !== filtroMateria) return false
      if (filtroCategoria !== 'todas') {
        const catId = materiaCategoriaMap.get(q.materia) ?? null
        if (filtroCategoria === 'sem-categoria') {
          if (catId !== null) return false
        } else {
          if (catId !== filtroCategoria) return false
        }
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (
          !q.materia.toLowerCase().includes(term) &&
          !q.assunto.toLowerCase().includes(term) &&
          !q.enunciado.toLowerCase().includes(term)
        ) return false
      }

      // Filtro de status
      if (filtroStatus === 'erradas') {
        // Apenas questões respondidas E que foram erradas
        if (!q.respondida || q.acertou) return false
      }
      if (filtroStatus === 'revisar') {
        // Questões marcadas para revisar
        if (!q.paraRevisar) return false
      }

      return true
    })
  }, [questoes, filtroMateria, filtroCategoria, searchTerm, materiaCategoriaMap, filtroStatus])

  // Índice de subcategorias por parentId
  const childrenByParent = useMemo(() => {
    const mp = new Map<string | null, any[]>()
    categorias.forEach(c => {
      const p = c.parentId || null
      const arr = mp.get(p) || []
      arr.push(c)
      mp.set(p, arr)
    })
    mp.forEach(arr => arr.sort((a, b) => a.ordem - b.ordem))
    return mp
  }, [categorias])

  const hasQuestionsInCategory = (categoriaId: string): boolean => {
    const hasHere = questoesFiltradas.some(
      q => (materiaCategoriaMap.get(q.materia) || null) === categoriaId
    )
    if (hasHere) return true
    const children = childrenByParent.get(categoriaId) || []
    return children.some((child: any) => hasQuestionsInCategory(child.id))
  }

  const renderCard = (questao: any) => (
    <motion.div 
      key={questao.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
      className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {questao.materia}
            </span>
            <span className="px-3 py-1 bg-secondary text-foreground text-xs font-medium rounded-full">
              {questao.tipo}
            </span>
            {questao.paraRevisar && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                Para Revisar
              </span>
            )}
          </div>
          {questao.titulo && (
            <h3 className="text-lg font-bold text-foreground mb-1">{questao.titulo}</h3>
          )}
          <h4 className={`${questao.titulo ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-1`}>
            {questao.assunto}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{questao.enunciado}</p>
        </div>
        {questao.respondida && (
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            questao.acertou ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {questao.acertou ? '✓ Acertou' : '✗ Errou'}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {questao.data.toLocaleDateString('pt-BR')}
          </span>
          {questao.alternativas && questao.alternativas.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {questao.alternativas.length} alternativas
            </span>
          )}
          {questao.imagemUrl && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="w-3 h-3" />
              Imagem
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleParaRevisar(questao)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              questao.paraRevisar
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
            title={questao.paraRevisar ? 'Remover de revisão' : 'Marcar para revisar'}
          >
            {questao.paraRevisar ? (
              <Bookmark className="w-4 h-4" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setQuestaoSelecionada(questao)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver
          </button>
          <button
            onClick={() => handleEditarQuestao(questao)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => setQuestaoParaExcluir(questao)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderChildren = (parentId: string, depth: number) => {
    const children = (childrenByParent.get(parentId) || []).filter((cat: any) =>
      hasQuestionsInCategory(cat.id)
    )
    if (children.length === 0) return null as any
    return (
      <div className="mt-2 space-y-4">
        {children.map((cat: any) => (
          <div key={cat.id} className="space-y-2" style={{ marginLeft: depth * 12 }}>
            <h5 className="text-sm font-semibold text-foreground">{labelsPorCategoria.get(cat.id) || cat.nome}</h5>
            <div className="grid gap-4">
              {questoesFiltradas
                .filter(q => (materiaCategoriaMap.get(q.materia) || null) === cat.id)
                .map(renderCard)}
            </div>
            {renderChildren(cat.id, depth + 1)}
          </div>
        ))}
      </div>
    ) as any
  }

  const tiposQuestao = [
    'Objetiva',
    'Discursiva',
    'Somatória'
  ]

  const handleAddAlternativa = () => {
    if (alternativas.length < 10) {
      setAlternativas([...alternativas, ''])
    }
  }

  const handleRemoveAlternativa = (index: number) => {
    if (alternativas.length > 2) {
      const novas = alternativas.filter((_, i) => i !== index)
      setAlternativas(novas)
    }
  }

  const handleAlternativaChange = (index: number, value: string) => {
    const novas = [...alternativas]
    novas[index] = value
    setAlternativas(novas)
  }

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/'
      
      if (imageUrl.startsWith(baseUrl)) {
        const pathStart = imageUrl.indexOf('/o/') + 3
        const pathEnd = imageUrl.indexOf('?')
        const filePath = decodeURIComponent(imageUrl.substring(pathStart, pathEnd))
        
        const imageRef = ref(storage, filePath)
        await deleteObject(imageRef)
      }
    } catch (error) {
      console.error('Erro ao deletar imagem do Storage:', error)
      throw error
    }
  }

  const handleImageUpload = async (file: File, folder: string = 'questoes') => {
    if (!user) return ''
    
    try {
      const timestamp = Date.now()
      const fileName = `${folder}/${user.uid}/${timestamp}_${file.name}`
      const storageRef = ref(storage, fileName)
      
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      
      return url
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      alert('Erro ao fazer upload da imagem. Tente novamente.')
      return ''
    }
  }

  const handleGerarExplicacao = async () => {
    if (!user || !enunciado) {
      alert('Por favor, preencha o enunciado da questão primeiro.')
      return
    }
    
    setGerandoExplicacao(true)
    try {
      // Se tiver imagem selecionada (preview), usa ela. Senão, usa a URL salva.
      const urlParaIA = imagemUrl || null
      
      const explicacao = await generateExplanation(
        enunciado,
        urlParaIA,
        userData?.openRouterApiKey,
        userData?.openRouterModel || 'google/gemini-2.0-flash-exp:free'
      )
      
      setResolucaoTexto(explicacao)
      setTipoResolucao('texto')
    } catch (error: any) {
      console.error('Erro ao gerar explicação:', error)
      alert('Erro ao gerar explicação: ' + error.message)
    } finally {
      setGerandoExplicacao(false)
    }
  }

  const handleTranscreverQuestao = async (file: File) => {
    if (!user) {
      alert('Por favor, faca login novamente.')
      return
    }
    
    setTranscrevendoQuestao(true)
    try {
      // Converter arquivo para base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      const resultado = await transcribeQuestion(base64)
      
      // Preencher os campos com os dados transcritos
      if (resultado.titulo) {
        setTitulo(resultado.titulo)
      }
      
      if (resultado.assunto) {
        setAssunto(resultado.assunto)
      }
      
      if (resultado.enunciado) {
        setEnunciado(resultado.enunciado)
      }
      
      // Se tiver alternativas, preencher e mostrar
      if (resultado.alternativas && resultado.alternativas.length > 0) {
        // Garantir que temos pelo menos 5 alternativas (padrao)
        const alts = [...resultado.alternativas]
        while (alts.length < 5) {
          alts.push('')
        }
        setAlternativas(alts)
        setMostrarAlternativas(true)
        setTipoQuestao('Objetiva')
      }
      
      // Se tiver resposta correta, preencher
      if (resultado.respostaCorreta) {
        setRespostaCorreta(resultado.respostaCorreta)
      }
      
      // Verificar se a materia existe e selecionar
      if (resultado.materia) {
        const materiaExiste = materias.find(
          m => m.toLowerCase() === resultado.materia.toLowerCase()
        )
        if (materiaExiste) {
          setMateria(materiaExiste)
        }
      }
      
    } catch (error: any) {
      console.error('Erro ao transcrever questao:', error)
      alert('Erro ao transcrever questao: ' + error.message)
    } finally {
      setTranscrevendoQuestao(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImagemFile(file)
      
      // Preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagemUrl(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = async () => {
    // Se está editando uma questão e ela tem imagem no Storage, deletar
    if (questaoEditando && questaoEditando.imagemUrl && !imagemFile) {
      try {
        await deleteImageFromStorage(questaoEditando.imagemUrl)
        
        // Atualizar o documento para remover a URL da imagem
        await updateDoc(doc(db, 'users', user!.uid, 'questoes', questaoEditando.id), {
          imagemUrl: null
        })
      } catch (error) {
        console.error('Erro ao deletar imagem:', error)
      }
    }
    
    setImagemFile(null)
    setImagemUrl('')
  }

  const getEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ''
    }
    return ''
  }

  const handleSubmitQuestao = async () => {
    if (!user) return
    
    setSalvando(true)
    setUploadingImage(true)
    try {
      // Upload da imagem do enunciado se houver
      let uploadedImageUrl = imagemUrl
      
      // Se está editando e adicionou uma nova imagem
      if (imagemFile && questaoEditando) {
        // Deletar imagem antiga se existir
        if (questaoEditando.imagemUrl) {
          try {
            await deleteImageFromStorage(questaoEditando.imagemUrl)
          } catch (imageError) {
            console.error('Erro ao deletar imagem antiga:', imageError)
          }
        }
        
        // Upload da nova imagem
        uploadedImageUrl = await handleImageUpload(imagemFile, 'questoes')
        if (!uploadedImageUrl) {
          setSalvando(false)
          setUploadingImage(false)
          return
        }
      } else if (imagemFile && !questaoEditando) {
        // Nova questão com imagem
        uploadedImageUrl = await handleImageUpload(imagemFile, 'questoes')
        if (!uploadedImageUrl) {
          setSalvando(false)
          setUploadingImage(false)
          return
        }
      }

      // Upload da imagem da resolução se houver
      let uploadedImagemResolucaoUrl = imagemResolucaoUrl
      
      if (imagemResolucaoFile && questaoEditando) {
        // Deletar imagem de resolução antiga se existir
        if (questaoEditando.imagemResolucaoUrl) {
          try {
            await deleteImageFromStorage(questaoEditando.imagemResolucaoUrl)
          } catch (imageError) {
            console.error('Erro ao deletar imagem de resolução antiga:', imageError)
          }
        }
        
        uploadedImagemResolucaoUrl = await handleImageUpload(imagemResolucaoFile, 'resolucoes')
        if (!uploadedImagemResolucaoUrl) {
          setSalvando(false)
          setUploadingImage(false)
          return
        }
      } else if (imagemResolucaoFile && !questaoEditando) {
        uploadedImagemResolucaoUrl = await handleImageUpload(imagemResolucaoFile, 'resolucoes')
        if (!uploadedImagemResolucaoUrl) {
          setSalvando(false)
          setUploadingImage(false)
          return
        }
      }
      
      setUploadingImage(false)

      const questaoData: any = {
        titulo: titulo.trim() || undefined,
        materia,
        assunto,
        tipo: tipoQuestao.toLowerCase(),
        enunciado,
        alternativas: mostrarAlternativas ? alternativas.filter(a => a.trim()) : [],
        respostaCorreta,
        respondida: questaoEditando ? questaoEditando.respondida : false,
        acertou: questaoEditando ? questaoEditando.acertou : false,
        data: questaoEditando ? questaoEditando.data : Timestamp.now()
      }

      // Adicionar URL da imagem se houver
      if (uploadedImageUrl) {
        questaoData.imagemUrl = uploadedImageUrl
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (tipoResolucao === 'texto' && resolucaoTexto) {
        questaoData.resolucao = resolucaoTexto
      }
      
      if (tipoResolucao === 'video' && videoUrl) {
        questaoData.videoUrl = videoUrl
      }

      // Adicionar URL da imagem da resolução se houver
      if (uploadedImagemResolucaoUrl) {
        questaoData.imagemResolucaoUrl = uploadedImagemResolucaoUrl
      } else if (questaoEditando && !imagemResolucaoUrl && questaoEditando.imagemResolucaoUrl) {
        // Se removeu a imagem de resolução, remover do documento
        questaoData.imagemResolucaoUrl = null
      }

      if (anotacoes) {
        questaoData.anotacoes = anotacoes
      }

      if (questaoEditando) {
        // Atualizar questão existente
        await updateDoc(doc(db, 'users', user.uid, 'questoes', questaoEditando.id), questaoData)
      } else {
        // Criar nova questão
        await addDoc(collection(db, 'users', user.uid, 'questoes'), questaoData)
      }
      
      // Reset form
      setShowNewQuestao(false)
      setQuestaoEditando(null)
      setTitulo('')
      setMateria('')
      setAssunto('')
      setTipoQuestao('')
      setEnunciado('')
      setAlternativas(['', '', '', '', ''])
      setMostrarAlternativas(false)
      setRespostaCorreta('')
      setTipoResolucao('texto')
      setResolucaoTexto('')
      setVideoUrl('')
      setAnotacoes('')
      setImagemFile(null)
      setImagemUrl('')
      setImagemResolucaoFile(null)
      setImagemResolucaoUrl('')
      setNovaMateria(false)
      setNomeNovaMateria('')
    } catch (error) {
      console.error('Erro ao salvar questão:', error)
      alert('Erro ao salvar questão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarNovaMateria = async () => {
    if (!user || !nomeNovaMateria.trim()) return
    
    try {
      const materiasCount = materiasFirestore.length
      await addDoc(collection(db, 'users', user.uid, 'materias'), {
        nome: nomeNovaMateria.trim(),
        ordem: materiasCount,
        data: Timestamp.now()
      })
      
      setMateria(nomeNovaMateria.trim())
      setNovaMateria(false)
      setNomeNovaMateria('')
    } catch (error) {
      console.error('Erro ao salvar matéria:', error)
      alert('Erro ao salvar matéria. Tente novamente.')
    }
  }

  const handleEditarQuestao = (questao: any) => {
    setQuestaoEditando(questao)
    setTitulo(questao.titulo || '')
    setMateria(questao.materia)
    setAssunto(questao.assunto)
    setTipoQuestao(questao.tipo.charAt(0).toUpperCase() + questao.tipo.slice(1))
    setEnunciado(questao.enunciado)
    setAlternativas(questao.alternativas && questao.alternativas.length > 0 
      ? questao.alternativas 
      : ['', '', '', '', ''])
    setMostrarAlternativas(questao.alternativas && questao.alternativas.length > 0)
    setRespostaCorreta(questao.respostaCorreta)
    setTipoResolucao(questao.videoUrl ? 'video' : 'texto')
    setResolucaoTexto(questao.resolucao || '')
    setVideoUrl(questao.videoUrl || '')
    setAnotacoes(questao.anotacoes || '')
    setImagemUrl(questao.imagemUrl || '')
    setImagemFile(null)
    setImagemResolucaoUrl(questao.imagemResolucaoUrl || '')
    setImagemResolucaoFile(null)
    setShowNewQuestao(true)
  }

  const handleExcluirQuestao = async () => {
    if (!user || !questaoParaExcluir) return
    
    setExcluindo(true)
    try {
      // Se a questão tem imagem, deletar do Storage primeiro
      if (questaoParaExcluir.imagemUrl) {
        try {
          await deleteImageFromStorage(questaoParaExcluir.imagemUrl)
        } catch (imageError) {
          console.error('Erro ao deletar imagem do Storage:', imageError)
        }
      }
      
      // Se a questão tem imagem de resolução, deletar também
      if (questaoParaExcluir.imagemResolucaoUrl) {
        try {
          await deleteImageFromStorage(questaoParaExcluir.imagemResolucaoUrl)
        } catch (imageError) {
          console.error('Erro ao deletar imagem de resolução do Storage:', imageError)
        }
      }
      
      // Deletar o documento da questão
      await deleteDoc(doc(db, 'users', user.uid, 'questoes', questaoParaExcluir.id))
      setQuestaoParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir questão:', error)
      alert('Erro ao excluir questão. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleToggleParaRevisar = async (questao: any) => {
    if (!user) return
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'questoes', questao.id), {
        paraRevisar: !questao.paraRevisar
      })
    } catch (error) {
      console.error('Erro ao atualizar questão:', error)
      alert('Erro ao atualizar questão. Tente novamente.')
    }
  }

  return (
    <PageLayout
      title="Questões"
      description="Gerencie e responda questões para aprimorar seus conhecimentos"
    >
      <div className="space-y-6">
        {/* Statistics */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Estatísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total de Questões"
              value={questoes.length}
              icon={<FileQuestion className="w-6 h-6" />}
            />
            <StatCard
              title="Questões na Semana"
              value={questoes.filter(q => {
                const umaSemanaAtras = new Date()
                umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7)
                return q.data >= umaSemanaAtras
              }).length}
              subtitle="Últimos 7 dias"
              icon={<Calendar className="w-6 h-6" />}
            />
            <StatCard
              title="Total de Matérias"
              value={materiasFirestore.length}
              subtitle="Matérias cadastradas"
              icon={<BookOpen className="w-6 h-6" />}
            />
          </div>
        </div>

        {/* Filtros Rápidos */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-foreground">Filtros rápidos:</span>
            <button
              onClick={() => setFiltroStatus('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroStatus === 'todas'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              Todas ({questoes.length})
            </button>
            <button
              onClick={() => setFiltroStatus('erradas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroStatus === 'erradas'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              Erradas ({questoes.filter(q => q.respondida && !q.acertou).length})
            </button>
            <button
              onClick={() => setFiltroStatus('revisar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroStatus === 'revisar'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              Para Revisar ({questoes.filter(q => q.paraRevisar).length})
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">Filtros:</span>
              
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value)
                  setFiltroMateria('todas')
                }}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              >
                <option value="todas">Todas as categorias</option>
                {categoriasHierarquicas.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
                <option value="sem-categoria">Sem categoria</option>
              </select>

              <select
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              >
                <option value="todas">Todas as matérias</option>
                {filtroCategoria === 'todas' 
                  ? materias.map((mat) => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))
                  : materiasFirestore
                      .filter(m => {
                        if (filtroCategoria === 'sem-categoria') return !m.categoriaId
                        return m.categoriaId === filtroCategoria
                      })
                      .map((mat) => (
                        <option key={mat.nome} value={mat.nome}>{mat.nome}</option>
                      ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar questões..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowNewQuestao(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Nova Questão
          </button>
        </div>

        {/* Badge de Filtro Ativo */}
        <AnimatePresence>
          {filtroStatus !== 'todas' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
            <span className="text-sm text-muted-foreground">Filtro ativo:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm">
              <span className="font-medium">
                {filtroStatus === 'erradas' ? 'Questões Erradas' : 'Para Revisar'}
              </span>
              <button
                onClick={() => setFiltroStatus('todas')}
                className="hover:bg-primary/20 rounded p-0.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Questões ou Empty State */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando questões...</p>
          </div>
        ) : questoes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma questão cadastrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece cadastrando sua primeira questão para começar a estudar
            </p>
            <button 
              onClick={() => setShowNewQuestao(true)}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Cadastrar Primeira Questão
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sem categoria */}
            {questoesFiltradas.some(q => (materiaCategoriaMap.get(q.materia) ?? null) === null) && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Sem categoria</h4>
                <div className="grid gap-4">
                  {questoesFiltradas
                    .filter(q => (materiaCategoriaMap.get(q.materia) ?? null) === null)
                    .map(renderCard)}
                </div>
              </div>
            )}

            {/* Categorias hierárquicas */}
            {childrenByParent.get(null)
              ?.filter((root: any) => hasQuestionsInCategory(root.id))
              .map((root: any) => (
                <div key={root.id} className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">{labelsPorCategoria.get(root.id) || root.nome}</h4>
                  <div className="grid gap-4">
                    {questoesFiltradas
                      .filter(q => (materiaCategoriaMap.get(q.materia) || null) === root.id)
                      .map(renderCard)}
                  </div>
                  {renderChildren(root.id, 1)}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* New Questão Modal */}
      {showNewQuestao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">
                {questaoEditando ? 'Editar Questao' : 'Nova Questao'}
              </h3>
              
              {/* Botao Transcrever com IA */}
              <div className="relative">
                <input
                  type="file"
                  id="transcricao-upload"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleTranscreverQuestao(e.target.files[0])
                      e.target.value = '' // Reset input
                    }
                  }}
                  className="hidden"
                  disabled={transcrevendoQuestao}
                />
                <label
                  htmlFor="transcricao-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                    transcrevendoQuestao ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                >
                  {transcrevendoQuestao ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <ScanText className="w-4 h-4" />
                      Transcrever com IA
                    </>
                  )}
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Título da Questão */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Título da Questão (Opcional)
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Segunda Lei de Newton, Teorema de Pitágoras..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O título aparecerá nos cards para facilitar a identificação da questão
                </p>
              </div>

              {/* Matéria e Assunto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Matéria *
                  </label>
                  {novaMateria ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={nomeNovaMateria}
                        onChange={(e) => setNomeNovaMateria(e.target.value)}
                        placeholder="Digite o nome da nova matéria"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSalvarNovaMateria}
                          disabled={!nomeNovaMateria.trim()}
                          className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNovaMateria(false)
                            setNomeNovaMateria('')
                          }}
                          className="flex-1 px-3 py-1.5 border border-border text-foreground text-sm rounded-lg hover:bg-secondary"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={materia}
                        onChange={(e) => {
                          if (e.target.value === '__nova__') {
                            setNovaMateria(true)
                            setMateria('')
                          } else {
                            setMateria(e.target.value)
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                      >
                        <option value="">Selecione a matéria</option>
                        
                        {/* Matérias sem categoria */}
                        {materiasFirestore.filter(m => !m.categoriaId).length > 0 && (
                          <optgroup label="Sem Categoria">
                            {materiasFirestore
                              .filter(m => !m.categoriaId)
                              .sort((a, b) => a.ordem - b.ordem)
                              .map((mat) => (
                                <option key={mat.id} value={mat.nome}>{mat.nome}</option>
                              ))}
                          </optgroup>
                        )}
                        
                        {/* Matérias por categoria (hierárquico ordenado) */}
                        {categoriasHierarquicas.map((cat) => {
                          const fullLabel = getCategoriaPathLabel(cat.id) || (labelsPorCategoria.get(cat.id) || '') || ''
                          const materiasNaCategoria = materiasFirestore
                            .filter(m => m.categoriaId === cat.id)
                            .sort((a, b) => a.ordem - b.ordem)
                          if (materiasNaCategoria.length === 0) return null
                          return (
                            <optgroup key={cat.id} label={fullLabel}>
                              {materiasNaCategoria.map((mat) => (
                                <option key={mat.id} value={mat.nome}>{mat.nome}</option>
                              ))}
                            </optgroup>
                          )
                        })}
                        
                        <option value="__nova__" className="font-semibold text-primary">+ Nova Matéria</option>
                      </select>
                      {/* Mostrar caminho da categoria da matéria selecionada */}
                      {materia && (
                        (() => {
                          const m = materiasFirestore.find(mm => mm.nome === materia)
                          const catId = m?.categoriaId || null
                          return (
                            <p className="text-xs text-muted-foreground">
                              Categoria: {catId ? getCategoriaPathLabel(catId) : 'Sem categoria'}
                            </p>
                          )
                        })()
                      )}
                      {materiasFirestore.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          💡 Você ainda não tem matérias. Selecione "+ Nova Matéria" para criar a primeira.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assunto/Tópico *
                  </label>
                  <input
                    type="text"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Ex: Ondas sonoras, Cinemática..."
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tipo de Questão */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Questão *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {tiposQuestao.map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setTipoQuestao(tipo)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        tipoQuestao === tipo
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enunciado da Questão *
                </label>
                <textarea
                  value={enunciado}
                  onChange={(e) => setEnunciado(e.target.value)}
                  placeholder="Digite o enunciado completo da questão..."
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                />
              </div>

              {/* Imagem Anexada */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Imagem Anexada (Opcional)
                </label>
                <div className="space-y-2">
                  {!imagemUrl ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">Clique para fazer upload</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 5MB</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-border rounded-lg p-2">
                      <img 
                        src={imagemUrl} 
                        alt="Preview" 
                        className="max-h-40 mx-auto rounded-lg"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternativas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Alternativas (Opcional)
                  </label>
                  <button
                    onClick={() => setMostrarAlternativas(!mostrarAlternativas)}
                    className="text-sm text-primary hover:underline"
                  >
                    {mostrarAlternativas ? 'Ocultar' : 'Adicionar'} alternativas
                  </button>
                </div>

                {mostrarAlternativas && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      💡 Selecione a alternativa correta clicando no círculo ao lado
                    </p>
                    <div className="space-y-2">
                      {alternativas.map((alt, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="resposta-correta"
                            checked={respostaCorreta === String.fromCharCode(65 + index)}
                            onChange={() => setRespostaCorreta(String.fromCharCode(65 + index))}
                            className="w-4 h-4 text-primary focus:ring-1 focus:ring-primary cursor-pointer"
                          />
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            {String.fromCharCode(65 + index)})
                          </span>
                          <input
                            type="text"
                            value={alt}
                            onChange={(e) => handleAlternativaChange(index, e.target.value)}
                            placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all text-sm"
                          />
                          {alternativas.length > 2 && (
                            <button
                              onClick={() => handleRemoveAlternativa(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {alternativas.length < 10 && (
                      <button
                        onClick={handleAddAlternativa}
                        className="text-sm text-primary hover:underline"
                      >
                        + Adicionar mais alternativa
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Resposta Correta */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resposta Correta *
                </label>
                {mostrarAlternativas ? (
                  <div className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground">
                    {respostaCorreta ? `Alternativa ${respostaCorreta} selecionada` : 'Selecione uma alternativa acima'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={respostaCorreta}
                    onChange={(e) => setRespostaCorreta(e.target.value)}
                    placeholder="Digite a resposta correta"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  />
                )}
              </div>

              {/* Resolução e Explicação */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resolução e Explicação
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipoResolucao('texto')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        tipoResolucao === 'texto'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Texto
                    </button>
                    <button
                      onClick={() => setTipoResolucao('video')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        tipoResolucao === 'video'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Vídeo
                    </button>
                  </div>

                  {tipoResolucao === 'texto' && (
                    <button
                      onClick={handleGerarExplicacao}
                      disabled={gerandoExplicacao || !enunciado}
                      title={!enunciado ? 'Preencha o enunciado primeiro' : 'Gerar explicação automática'}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                    >
                      {gerandoExplicacao ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Explicação com IA
                        </>
                      )}
                    </button>
                  )}
                </div>

                {tipoResolucao === 'texto' ? (
                  <div className="space-y-3">
                    <textarea
                      value={resolucaoTexto}
                      onChange={(e) => setResolucaoTexto(e.target.value)}
                      placeholder="Digite a explicação passo a passo da resolução..."
                      rows={4}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                    />
                    
                    {/* Imagem da Resolução */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">
                        Imagem da Resolução (Opcional)
                      </label>
                      {!imagemResolucaoUrl ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary transition-colors">
                          <input
                            type="file"
                            id="image-resolucao-upload"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0]
                                setImagemResolucaoFile(file)
                                const reader = new FileReader()
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setImagemResolucaoUrl(ev.target.result as string)
                                  }
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="hidden"
                          />
                          <label htmlFor="image-resolucao-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-medium text-foreground">Adicionar imagem</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="relative border border-border rounded-lg p-2">
                          <img 
                            src={imagemResolucaoUrl} 
                            alt="Preview resolução" 
                            className="max-h-32 mx-auto rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagemResolucaoFile(null)
                              setImagemResolucaoUrl('')
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Cole a URL do vídeo (YouTube ou Vimeo)"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    />
                    {videoUrl && getEmbedUrl(videoUrl) && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={getEmbedUrl(videoUrl)}
                          className="w-full h-full"
                          allowFullScreen
                          title="Video preview"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Anotações */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Anotações (Opcional)
                </label>
                <textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Adicione observações sobre esta questão..."
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button
onClick={() => {
                  setShowNewQuestao(false)
                  setQuestaoEditando(null)
                  setTitulo('')
                  setMateria('')
                  setAssunto('')
                  setTipoQuestao('')
                  setEnunciado('')
                  setAlternativas(['', '', '', '', ''])
                  setMostrarAlternativas(false)
                  setRespostaCorreta('')
                  setTipoResolucao('texto')
                  setResolucaoTexto('')
                  setVideoUrl('')
                  setAnotacoes('')
                  setImagemFile(null)
                  setImagemUrl('')
                  setImagemResolucaoFile(null)
                  setImagemResolucaoUrl('')
                  setNovaMateria(false)
                  setNomeNovaMateria('')
                }}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitQuestao}
                disabled={!materia || !assunto || !tipoQuestao || !enunciado || !respostaCorreta || salvando || uploadingImage}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Fazendo upload da imagem...' : salvando ? 'Salvando...' : (questaoEditando ? 'Atualizar Questão' : 'Salvar Questão')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Questão */}
      {questaoSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {questaoSelecionada.materia}
                  </span>
                  <span className="px-3 py-1 bg-secondary text-foreground text-sm font-medium rounded-full">
                    {questaoSelecionada.tipo}
                  </span>
                  {questaoSelecionada.respondida && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      questaoSelecionada.acertou 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {questaoSelecionada.acertou ? '✓ Acertou' : '✗ Errou'}
                    </span>
                  )}
                </div>
                {questaoSelecionada.titulo && (
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {questaoSelecionada.titulo}
                  </h2>
                )}
                <h3 className={`${questaoSelecionada.titulo ? 'text-xl' : 'text-2xl'} font-semibold text-foreground mb-2`}>
                  {questaoSelecionada.assunto}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {questaoSelecionada.data.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => {
                  setQuestaoSelecionada(null)
                  setMostrarRespostaModal(false)
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Botao Mostrar/Esconder Resposta */}
            <div className="mb-6">
              <button
                onClick={() => setMostrarRespostaModal(!mostrarRespostaModal)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  mostrarRespostaModal
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                <Eye className="w-4 h-4" />
                {mostrarRespostaModal ? 'Esconder Resposta' : 'Mostrar Resposta'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Enunciado */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Enunciado</h4>
                <div className="bg-background border border-border rounded-lg p-4">
                  <LatexRenderer 
                    content={questaoSelecionada.enunciado}
                    className="text-sm text-foreground whitespace-pre-wrap"
                  />
                </div>
              </div>

              {/* Imagem Anexada */}
              {questaoSelecionada.imagemUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Imagem Anexada</h4>
                  <div className="bg-background border border-border rounded-lg p-4 relative group">
                    <img 
                      src={questaoSelecionada.imagemUrl} 
                      alt="Imagem da questão" 
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => setImagemZoom(questaoSelecionada.imagemUrl)}
                    />
                    <button
                      onClick={() => setImagemZoom(questaoSelecionada.imagemUrl)}
                      className="absolute top-6 right-6 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-sm">Ampliar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alternativas */}
              {questaoSelecionada.alternativas && questaoSelecionada.alternativas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Alternativas</h4>
                  <div className="space-y-2">
                    {questaoSelecionada.alternativas.map((alt: string, index: number) => {
                      const letra = String.fromCharCode(65 + index)
                      const isCorreta = questaoSelecionada.respostaCorreta === letra
                      const mostrarDestaque = mostrarRespostaModal && isCorreta
                      return (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-3 ${
                            mostrarDestaque 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-background border-border'
                          }`}
                        >
                          <span className={`font-medium mr-2 ${
                            mostrarDestaque ? 'text-green-700' : 'text-foreground'
                          }`}>
                            {letra})
                          </span>
                          <div className={`text-sm inline ${
                            mostrarDestaque ? 'text-green-900 font-medium' : 'text-foreground'
                          }`}>
                            <LatexRenderer content={alt} className="inline" />
                          </div>
                          {mostrarDestaque && (
                            <span className="ml-2 text-green-700 text-xs">Correta</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resposta Correta */}
              {mostrarRespostaModal && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Resposta Correta</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">
                      {questaoSelecionada.respostaCorreta}
                    </p>
                  </div>
                </div>
              )}

              {/* Resolução em Texto */}
              {mostrarRespostaModal && questaoSelecionada.resolucao && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Resolução</h4>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <LatexRenderer 
                      content={questaoSelecionada.resolucao}
                      className="text-sm text-foreground whitespace-pre-wrap"
                    />
                  </div>
                </div>
              )}

              {/* Imagem da Resolução */}
              {mostrarRespostaModal && questaoSelecionada.imagemResolucaoUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Imagem da Resolução</h4>
                  <div className="bg-background border border-border rounded-lg p-4 relative group">
                    <img 
                      src={questaoSelecionada.imagemResolucaoUrl} 
                      alt="Imagem da resolução" 
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => setImagemZoom(questaoSelecionada.imagemResolucaoUrl)}
                    />
                    <button
                      onClick={() => setImagemZoom(questaoSelecionada.imagemResolucaoUrl)}
                      className="absolute top-6 right-6 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-sm">Ampliar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resolução em Vídeo */}
              {mostrarRespostaModal && questaoSelecionada.videoUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Vídeo Resolução</h4>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getEmbedUrl(questaoSelecionada.videoUrl)}
                      className="w-full h-full"
                      allowFullScreen
                      title="Video resolução"
                    />
                  </div>
                </div>
              )}

              {/* Anotações */}
              {questaoSelecionada.anotacoes && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Anotações</h4>
                  <div className="bg-secondary/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {questaoSelecionada.anotacoes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setQuestaoSelecionada(null)
                  setMostrarRespostaModal(false)
                }}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {questaoParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Excluir Questão?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir a questão <strong className="text-foreground">"{questaoParaExcluir.assunto}"</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQuestaoParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirQuestao}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {excluindo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Zoom da Imagem */}
      {imagemZoom && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4"
          onClick={() => setImagemZoom(null)}
        >
          <button
            onClick={() => setImagemZoom(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="relative max-w-7xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imagemZoom} 
              alt="Imagem ampliada" 
              className="w-full h-auto rounded-lg"
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            Clique fora da imagem ou no X para fechar
          </div>
        </div>
      )}
    </PageLayout>
  )
}
