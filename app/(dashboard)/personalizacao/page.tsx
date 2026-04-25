'use client'

import { PageLayout } from '@/components/PageLayout'
import { Palette, Moon, Sun, Plus, BookOpen, Trash2, TrendingUp, Target, X, AlertTriangle, GripVertical, Folder, Check, Database, Edit2 } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useQuestoes, useMaterias, useCategorias } from '@/hooks/useFirestoreData'
import { collection, addDoc, Timestamp, doc, deleteDoc, updateDoc, writeBatch, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useMigration } from '@/hooks/useMigration'
import { useFixMigration } from '@/hooks/useFixMigration'
import { useRecoverData } from '@/hooks/useRecoverData'
import { useDiagnosis } from '@/hooks/useDiagnosis'

interface Subject {
  name: string
  questionsAnswered: number
  questionsCorrect: number
  correctRate: number
  lastStudied: Date | null
}

export default function PersonalizacaoPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { questoes, loading } = useQuestoes()
  const { materias, loading: loadingMaterias } = useMaterias()
  const { categorias, loading: loadingCategorias } = useCategorias()
  const { migrateDataToNewStructure, migrating, migrationProgress } = useMigration()
  const { fixMigratedData, fixing, fixProgress } = useFixMigration()
  const { recoverDataFromMigration, recovering, recoverProgress } = useRecoverData()
  const { runDiagnosis, diagnosing, diagnosisResult } = useDiagnosis()
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddCategoria, setShowAddCategoria] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newCategoriaName, setNewCategoriaName] = useState('')
  const [categoriaParentSelecionada, setCategoriaParentSelecionada] = useState<string>('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('')
  const [salvando, setSalvando] = useState(false)
  const [materiaParaExcluir, setMateriaParaExcluir] = useState<any>(null)
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<any>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [showEditMateria, setShowEditMateria] = useState(false)
  const [materiaParaEditar, setMateriaParaEditar] = useState<any>(null)
  const [editMateriaName, setEditMateriaName] = useState('')
  const [showEditCategoria, setShowEditCategoria] = useState(false)
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<any>(null)
  const [editCategoriaName, setEditCategoriaName] = useState('')
  const [catsFechadas, setCatsFechadas] = useState<Record<string, boolean>>({})
  const [categoriaParaMover, setCategoriaParaMover] = useState<any>(null)
  const [novoPaiId, setNovoPaiId] = useState<string>('')
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [showFixModal, setShowFixModal] = useState(false)
  const [showRecoverModal, setShowRecoverModal] = useState(false)
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'ui', 'personalizacao')
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any
      if (data && data.catsFechadas) {
        setCatsFechadas(data.catsFechadas)
      }
    })
    return () => unsub()
  }, [user])

  // Calcular estatísticas por matéria baseado nas questoes
  const subjects = useMemo(() => {
    const subjectMap = new Map<string, Subject>()

    questoes.forEach(questao => {
      const materia = questao.materia
      
      if (!subjectMap.has(materia)) {
        subjectMap.set(materia, {
          name: materia,
          questionsAnswered: 0,
          questionsCorrect: 0,
          correctRate: 0,
          lastStudied: null
        })
      }

      const subject = subjectMap.get(materia)!
      
      if (questao.respondida) {
        subject.questionsAnswered++
        if (questao.acertou) {
          subject.questionsCorrect++
        }
      }

      // Atualizar último estudo
      if (!subject.lastStudied || questao.data > subject.lastStudied) {
        subject.lastStudied = questao.data
      }
    })

    // Calcular taxa de acerto
    subjectMap.forEach(subject => {
      if (subject.questionsAnswered > 0) {
        subject.correctRate = Math.round((subject.questionsCorrect / subject.questionsAnswered) * 100)
      }
    })

    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [questoes])

  const handleSalvarCategoria = async () => {
    if (!user || !newCategoriaName.trim()) return
    
    setSalvando(true)
    try {
      const parentIdTarget = categoriaParentSelecionada || null
      const siblingsCount = categorias.filter(c => (c.parentId || null) === parentIdTarget).length
      await addDoc(collection(db, 'users', user.uid, 'categorias'), {
        nome: newCategoriaName.trim(),
        parentId: parentIdTarget,
        ordem: siblingsCount,
        data: Timestamp.now()
      })
      
      setShowAddCategoria(false)
      setNewCategoriaName('')
      setCategoriaParentSelecionada('')
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleEditarCategoria = async () => {
    if (!user || !categoriaParaEditar || !editCategoriaName.trim()) return
    
    setSalvando(true)
    try {
      await updateDoc(doc(db, 'users', user.uid, 'categorias', categoriaParaEditar.id), {
        nome: editCategoriaName.trim()
      })
      
      setShowEditCategoria(false)
      setCategoriaParaEditar(null)
      setEditCategoriaName('')
    } catch (error) {
      console.error('Erro ao editar categoria:', error)
      alert('Erro ao editar categoria. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarMateria = async () => {
    if (!user || !newSubjectName.trim()) return
    
    setSalvando(true)
    try {
      const materiasNaCategoria = materias.filter(m => m.categoriaId === categoriaSelecionada)
      await addDoc(collection(db, 'users', user.uid, 'materias'), {
        nome: newSubjectName.trim(),
        categoriaId: categoriaSelecionada || null,
        ordem: materiasNaCategoria.length,
        data: Timestamp.now()
      })
      
      setShowAddSubject(false)
      setNewSubjectName('')
      setCategoriaSelecionada('')
    } catch (error) {
      console.error('Erro ao salvar matéria:', error)
      alert('Erro ao salvar matéria. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleEditarMateria = async () => {
    if (!user || !materiaParaEditar || !editMateriaName.trim()) return
    
    setSalvando(true)
    try {
      await updateDoc(doc(db, 'users', user.uid, 'materias', materiaParaEditar.id), {
        nome: editMateriaName.trim()
      })
      
      setShowEditMateria(false)
      setMateriaParaEditar(null)
      setEditMateriaName('')
    } catch (error) {
      console.error('Erro ao editar matéria:', error)
      alert('Erro ao editar matéria. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluirMateria = async () => {
    if (!user || !materiaParaExcluir) return
    
    setExcluindo(true)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'materias', materiaParaExcluir.id))
      setMateriaParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir matéria:', error)
      alert('Erro ao excluir matéria. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleExcluirCategoria = async () => {
    if (!user || !categoriaParaExcluir) return
    
    setExcluindo(true)
    try {
      const batch = writeBatch(db)

      // Remover categoriaId de todas as materias dessa categoria
      const materiasNaCategoria = materias.filter(m => m.categoriaId === categoriaParaExcluir.id)
      materiasNaCategoria.forEach(m => {
        const materiaRef = doc(db, 'users', user.uid, 'materias', m.id)
        batch.update(materiaRef, { categoriaId: null })
      })

      // Reatribuir subcategorias diretas para raiz (parentId null) e normalizar ordem
      const subcats = categorias
        .filter(c => (c.parentId || null) === categoriaParaExcluir.id)
        .sort((a, b) => a.ordem - b.ordem)

      subcats.forEach((c, idx) => {
        const ref = doc(db, 'users', user.uid, 'categorias', c.id)
        batch.update(ref, { parentId: null, ordem: idx })
      })

      // Excluir a categoria em si
      const categoriaRef = doc(db, 'users', user.uid, 'categorias', categoriaParaExcluir.id)
      batch.delete(categoriaRef)
      
      await batch.commit()
      setCategoriaParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      alert('Erro ao excluir categoria. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!user || !result.destination) return

    const { source, destination, type } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    try {
      const batch = writeBatch(db)

      if (type === 'CATEGORIA') {
        const getParentFromDroppable = (id: string): string | null => {
          if (id.startsWith('cat-parent:')) {
            const raw = id.slice('cat-parent:'.length)
            return raw === 'null' ? null : raw
          }
          return null
        }
        const sourceParentId = getParentFromDroppable(source.droppableId)
        const destParentId = getParentFromDroppable(destination.droppableId)

        const sourceSiblings = categorias
          .filter(c => (c.parentId || null) === (sourceParentId || null))
          .sort((a, b) => a.ordem - b.ordem)
        const destSiblings = (sourceParentId === destParentId)
          ? sourceSiblings
          : categorias
              .filter(c => (c.parentId || null) === (destParentId || null))
              .sort((a, b) => a.ordem - b.ordem)

        const [moved] = sourceSiblings.splice(source.index, 1)
        if (sourceParentId === destParentId) {
          sourceSiblings.splice(destination.index, 0, moved)
          sourceSiblings.forEach((cat, index) => {
            const refCat = doc(db, 'users', user.uid, 'categorias', cat.id)
            batch.update(refCat, { ordem: index })
          })
        } else {
          // update source siblings ordem
          sourceSiblings.forEach((cat, index) => {
            const refCat = doc(db, 'users', user.uid, 'categorias', cat.id)
            batch.update(refCat, { ordem: index })
          })
          // insert into destination and update parentId + ordem
          destSiblings.splice(destination.index, 0, moved)
          destSiblings.forEach((cat, index) => {
            const refCat = doc(db, 'users', user.uid, 'categorias', cat.id)
            const payload: any = { ordem: index }
            if (cat.id === moved.id) payload.parentId = destParentId || null
            batch.update(refCat, payload)
          })
        }
      } else if (type === 'MATERIA') {
        const parseMateriaDroppable = (id: string): string | null => {
          if (id === 'sem-categoria') return null
          if (id.startsWith('materias:')) return id.slice('materias:'.length)
          return id // fallback if already a plain id
        }
        const sourceCategoriaId = parseMateriaDroppable(source.droppableId)
        const destCategoriaId = parseMateriaDroppable(destination.droppableId)

        if (sourceCategoriaId === destCategoriaId) {
          const materiasNaCategoria = materias
            .filter(m => (m.categoriaId || null) === sourceCategoriaId)
            .sort((a, b) => a.ordem - b.ordem)

          const [removed] = materiasNaCategoria.splice(source.index, 1)
          materiasNaCategoria.splice(destination.index, 0, removed)

          materiasNaCategoria.forEach((mat, index) => {
            const materiaRef = doc(db, 'users', user.uid, 'materias', mat.id)
            batch.update(materiaRef, { ordem: index })
          })
        } else {
          const materiasOrigem = materias
            .filter(m => (m.categoriaId || null) === sourceCategoriaId)
            .sort((a, b) => a.ordem - b.ordem)

          const materiasDestino = materias
            .filter(m => (m.categoriaId || null) === destCategoriaId)
            .sort((a, b) => a.ordem - b.ordem)

          const [removed] = materiasOrigem.splice(source.index, 1)

          materiasOrigem.forEach((mat, index) => {
            const materiaRef = doc(db, 'users', user.uid, 'materias', mat.id)
            batch.update(materiaRef, { ordem: index })
          })

          materiasDestino.splice(destination.index, 0, removed)

          materiasDestino.forEach((mat, index) => {
            const materiaRef = doc(db, 'users', user.uid, 'materias', mat.id)
            batch.update(materiaRef, { 
              categoriaId: destCategoriaId,
              ordem: index 
            })
          })
        }
      }

      await batch.commit()
    } catch (error) {
      console.error('Erro ao reordenar:', error)
      alert('Erro ao reordenar. Tente novamente.')
    }
  }

  const formatLastStudied = (date: Date | null) => {
    if (!date) return 'Nunca'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `Há ${days} dias`
    if (days < 30) return `Há ${Math.floor(days / 7)} semanas`
    return `Há ${Math.floor(days / 30)} meses`
  }

  // Lista plana de categorias com indentação para selects
  const categoriasPlanas = useMemo(() => {
    const result: { id: string; label: string }[] = []
    const walk = (parent: string | null, depth: number) => {
      const filhos = categorias
        .filter(c => (c.parentId || null) === parent)
        .sort((a, b) => a.ordem - b.ordem)
      filhos.forEach(c => {
        result.push({ id: c.id, label: `${'— '.repeat(depth)}${c.nome}` })
        walk(c.id, depth + 1)
      })
    }
    walk(null, 0)
    return result
  }, [categorias])

  const getDescendantsIds = (rootId: string) => {
    const ids = new Set<string>()
    const stack = [rootId]
    while (stack.length) {
      const pid = stack.pop()!
      categorias.forEach(c => {
        if ((c.parentId || null) === pid) {
          ids.add(c.id)
          stack.push(c.id)
        }
      })
    }
    return ids
  }

  const confirmarMoverCategoria = async () => {
    if (!user || !categoriaParaMover) return
    const destino = novoPaiId || null
    try {
      const batch = writeBatch(db)

      // calcular nova ordem no destino
      const siblings = categorias
        .filter(c => (c.parentId || null) === destino)
        .sort((a, b) => a.ordem - b.ordem)

      const ref = doc(db, 'users', user.uid, 'categorias', categoriaParaMover.id)
      batch.update(ref, { parentId: destino, ordem: siblings.length })

      // normalizar ordem dos irmãos atuais (origem)
      const origem = categoriaParaMover.parentId || null
      const siblingsOrigem = categorias
        .filter(c => (c.parentId || null) === origem && c.id !== categoriaParaMover.id)
        .sort((a, b) => a.ordem - b.ordem)
      siblingsOrigem.forEach((c, idx) => {
        const r = doc(db, 'users', user.uid, 'categorias', c.id)
        batch.update(r, { ordem: idx })
      })

      await batch.commit()
      setCategoriaParaMover(null)
      setNovoPaiId('')
    } catch (error) {
      console.error('Erro ao mover categoria:', error)
      alert('Erro ao mover categoria. Tente novamente.')
    }
  }


  // Componente recursivo para renderizar categorias com subcategorias e materias
  const CategoryItem: React.FC<{ categoria: any; index: number; nivel?: number }> = ({ categoria, index, nivel = 0 }) => {
    const materiasNaCategoria = materias
      .filter(m => m.categoriaId === categoria.id)
      .sort((a, b) => a.ordem - b.ordem)

    return (
      <Draggable key={`cat:${categoria.id}`} draggableId={`cat:${categoria.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`bg-secondary/50 border border-border rounded-lg p-4 transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
            style={{ marginLeft: nivel * 12 }}
          >
            <Droppable droppableId={`cat-parent:${categoria.id}`} type="CATEGORIA">
              {(providedDrop, snapshotDrop) => (
                <div ref={providedDrop.innerRef} {...providedDrop.droppableProps} className={`rounded-lg ${snapshotDrop.isDraggingOver ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-3 mb-3 cursor-grab active:cursor-grabbing select-none" {...provided.dragHandleProps}>
                    <div>
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <Folder className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground flex-1">{categoria.nome}</h4>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">
                      {materiasNaCategoria.length} {materiasNaCategoria.length === 1 ? 'matéria' : 'matérias'}
                    </span>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={async () => {
                      const next = { ...catsFechadas, [categoria.id]: !catsFechadas[categoria.id] }
                      setCatsFechadas(next)
                      if (user) {
                        try {
                          await setDoc(doc(db, 'users', user.uid, 'ui', 'personalizacao'), { catsFechadas: next }, { merge: true })
                        } catch (e) {
                          console.error('Erro ao salvar preferências de categorias:', e)
                        }
                      }
                    }}
                      className="px-2 py-1 text-xs border border-border rounded hover:bg-secondary"
                      title={catsFechadas[categoria.id] ? 'Expandir' : 'Recolher'}
                      draggable={false}
                    >
                      {catsFechadas[categoria.id] ? 'Expandir' : 'Recolher'}
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => { setCategoriaParaMover(categoria); setNovoPaiId(categoria.parentId || ''); }}
                      className="px-2 py-1 text-xs border border-border rounded hover:bg-secondary"
                      title="Definir Pai"
                      draggable={false}
                    >
                      Definir Pai
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        setCategoriaParaEditar(categoria)
                        setEditCategoriaName(categoria.nome)
                        setShowEditCategoria(true)
                      }}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Editar categoria"
                      draggable={false}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setCategoriaParaExcluir(categoria)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir categoria"
                      draggable={false}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!catsFechadas[categoria.id] && (
                    <>
                      {/* Matérias desta categoria */}
                      <Droppable droppableId={`materias:${categoria.id}`} type="MATERIA">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2 min-h-[60px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-dashed border-primary' : ''}`}
                          >
                            {materiasNaCategoria.map((materia, index) => {
                              const stats = subjects.find(s => s.name === materia.nome)
                              return (
                                <Draggable key={materia.id} draggableId={materia.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`bg-card border border-border rounded-lg p-3 transition-shadow ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-sm'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <h5 className="font-medium text-foreground text-sm">{materia.nome}</h5>
                                          {stats && (
                                            <p className="text-xs text-muted-foreground">
                                              {stats.questionsAnswered} questões • {stats.correctRate}% acerto
                                            </p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setMateriaParaEditar(materia)
                                            setEditMateriaName(materia.nome)
                                            setShowEditMateria(true)
                                          }}
                                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                          title="Editar matéria"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setMateriaParaExcluir(materia)}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Excluir matéria"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {materiasNaCategoria.length === 0 && (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                Arraste matérias para cá
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Subcategorias */}
                      <div className="mt-3 space-y-2">
                        {categorias
                          .filter(c => (c.parentId || null) === categoria.id)
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((child, childIdx) => (
                            <CategoryItem key={child.id} categoria={child} index={childIdx} nivel={(nivel || 0) + 1} />
                          ))}
                      </div>
                    </>
                  )}

                  {providedDrop.placeholder}
                </div>
              )}
            </Droppable>

          </div>
        )}
      </Draggable>
    )
  }

  return (
    <PageLayout
      title="Personalização"
      description="Customize a aparência e preferências do aplicativo"
    >
      <div className="space-y-6">
        {/* Theme Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Aparência
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha o tema de sua preferência
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 p-4 rounded-lg transition-all relative ${
                theme === 'light' 
                  ? 'border-2 border-primary bg-primary/5 shadow-sm' 
                  : 'border border-border hover:bg-secondary'
              }`}
            >
              <Sun className={`w-5 h-5 ${
                theme === 'light' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">Claro</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'light' ? 'Tema atual' : 'Tema padrão'}
                </p>
              </div>
              {theme === 'light' && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 p-4 rounded-lg transition-all relative ${
                theme === 'dark' 
                  ? 'border-2 border-primary bg-primary/5 shadow-sm' 
                  : 'border border-border hover:bg-secondary'
              }`}
            >
              <Moon className={`w-5 h-5 ${
                theme === 'dark' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">Escuro</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Tema atual' : 'Fácil para os olhos'}
                </p>
              </div>
              {theme === 'dark' && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Categorias e Matérias Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Categorias e Matérias
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddCategoria(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
              <button 
                onClick={() => setShowAddSubject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Nova Matéria
              </button>
            </div>
          </div>

          {(loadingMaterias || loadingCategorias) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="cat-parent:null" type="CATEGORIA">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {/* Matérias sem categoria - SEMPRE visível para permitir drag de volta */}
                    <div className="bg-secondary/30 border border-border rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Sem Categoria
                      </h4>
                      <Droppable droppableId="sem-categoria" type="MATERIA">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`space-y-2 min-h-[60px] rounded-lg p-2 transition-colors ${
                              snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-dashed border-primary' : ''
                            }`}
                          >
                            {materias
                              .filter(m => !m.categoriaId)
                              .sort((a, b) => a.ordem - b.ordem)
                              .map((materia, index) => {
                                const stats = subjects.find(s => s.name === materia.nome)
                                return (
                                  <Draggable key={materia.id} draggableId={materia.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`bg-card border border-border rounded-lg p-3 transition-shadow ${
                                          snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-sm'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1">
                                            <h5 className="font-medium text-foreground text-sm">{materia.nome}</h5>
                                            {stats && (
                                              <p className="text-xs text-muted-foreground">
                                                {stats.questionsAnswered} questões • {stats.correctRate}% acerto
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => setMateriaParaExcluir(materia)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir matéria"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                )
                              })}
                            {materias.filter(m => !m.categoriaId).length === 0 && (
                              <div className="text-center py-4 text-sm text-muted-foreground">
                                Arraste matérias para cá para remover de categorias
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>

                    {/* Categorias em nível raiz */}
                    {categorias
                      .filter(c => (c.parentId || null) === null)
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((categoria, idx) => (
                        <CategoryItem key={categoria.id} categoria={categoria} index={idx} nivel={0} />
                      ))}

                    {provided.placeholder}

                    {categorias.length === 0 && materias.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Folder className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          Nenhuma categoria ou matéria cadastrada
                        </h4>
                        <p className="text-muted-foreground mb-4">
                          Crie categorias e adicione matérias para organizá-las
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Info sobre categorias */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Dica:</strong> Crie categorias (ex: Biologia, Exatas) e organize suas matérias usando drag-and-drop. Arraste as matérias entre categorias para reorganizá-las.
          </p>
        </div>
      </div>

      {/* Modal: Definir Pai da Categoria */}
      {categoriaParaMover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Definir categoria pai
              </h3>
              <button
                onClick={() => { setCategoriaParaMover(null); setNovoPaiId('') }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione a categoria pai para "{categoriaParaMover?.nome}".
                </p>
                <select
                  value={novoPaiId}
                  onChange={(e) => setNovoPaiId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                >
                  <option value="">Sem categoria pai (nível raiz)</option>
                  {categoriasPlanas
                    .filter(cat => {
                      if (!categoriaParaMover) return true
                      if (cat.id === categoriaParaMover.id) return false
                      const descendants = getDescendantsIds(categoriaParaMover.id)
                      if (descendants.has(cat.id)) return false
                      return true
                    })
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCategoriaParaMover(null); setNovoPaiId('') }}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarMoverCategoria}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Categoria */}
      {showAddCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Nova Categoria
              </h3>
              <button
                onClick={() => {
                  setShowAddCategoria(false)
                  setNewCategoriaName('')
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={newCategoriaName}
                  onChange={(e) => setNewCategoriaName(e.target.value)}
                  placeholder="Ex: Biologia, Exatas, Humanas..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoriaName.trim()) {
                      handleSalvarCategoria()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddCategoria(false)
                  setNewCategoriaName('')
                }}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarCategoria}
                disabled={!newCategoriaName.trim() || salvando}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Criar Categoria
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Matéria */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Nova Matéria
              </h3>
              <button
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                  setCategoriaSelecionada('')
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome da Matéria *
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Ex: Biologia 1, Física Moderna..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubjectName.trim()) {
                      handleSalvarMateria()
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Categoria (Opcional)
                </label>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                >
                  <option value="">Sem categoria</option>
                  {categoriasPlanas.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                  setCategoriaSelecionada('')
                }}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarMateria}
                disabled={!newSubjectName.trim() || salvando}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Adicionar Matéria
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {materiaParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Excluir Matéria?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir <strong className="text-foreground">"{materiaParaExcluir.nome}"</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMateriaParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirMateria}
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

      {/* Modal de Confirmação de Exclusão de Categoria */}
      {categoriaParaExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Excluir Categoria?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tem certeza que deseja excluir a categoria <strong className="text-foreground">"{categoriaParaExcluir.nome}"</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  As matérias desta categoria ficarão sem categoria. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCategoriaParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirCategoria}
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

      {/* Modal de Diagnóstico */}
      {showDiagnosisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Diagnóstico de Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verificar onde seus dados estão armazenados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosisModal(false)}
                disabled={diagnosing}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {diagnosisResult && (
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-4">Coleções Antigas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Missions:</span>
                        <span className="font-medium">{diagnosisResult.oldCollections.missions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Schedules:</span>
                        <span className="font-medium">{diagnosisResult.oldCollections.weeklySchedules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Programs:</span>
                        <span className="font-medium">{diagnosisResult.oldCollections.contentPrograms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Categories:</span>
                        <span className="font-medium">{diagnosisResult.oldCollections.contentCategories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Journal Entries:</span>
                        <span className="font-medium">{diagnosisResult.oldCollections.journalEntries}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-4">Subcoleções Novas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Missions:</span>
                        <span className="font-medium">{diagnosisResult.newSubcollections.missions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Schedules:</span>
                        <span className="font-medium">{diagnosisResult.newSubcollections.weeklySchedules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Programs:</span>
                        <span className="font-medium">{diagnosisResult.newSubcollections.contentPrograms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Categories:</span>
                        <span className="font-medium">{diagnosisResult.newSubcollections.contentCategories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Journal Entries:</span>
                        <span className="font-medium">{diagnosisResult.newSubcollections.journalEntries}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {diagnosisResult.newSubcollections.contentPrograms > 0 && diagnosisResult.newSubcollections.contentCategories === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>⚠️ Problema Identificado:</strong> Você tem {diagnosisResult.newSubcollections.contentPrograms} conteúdos mas nenhuma categoria. Clique em "Corrigir Dados" para adicionar o campo categoryId.
                    </p>
                  </div>
                )}

                {diagnosisResult.oldCollections.contentPrograms > 0 && diagnosisResult.newSubcollections.contentPrograms === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>ℹ️ Info:</strong> Seus dados estão nas coleções antigas. Clique em "Migrar Dados" para mover para a nova estrutura.
                    </p>
                  </div>
                )}

                {diagnosisResult.newSubcollections.contentPrograms > 0 && diagnosisResult.oldCollections.contentPrograms === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>✓ Tudo OK:</strong> Seus dados estão nas subcoleções novas. Se não aparecerem, tente recarregar a página.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDiagnosisModal(false)}
                disabled={diagnosing}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  await runDiagnosis()
                }}
                disabled={diagnosing}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {diagnosing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Diagnosticando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Executar Diagnóstico
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperação de Dados */}
      {showRecoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Recuperar Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Recuperar dados das subcoleções para as coleções antigas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecoverModal(false)}
                disabled={recovering}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {recoverProgress && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-foreground font-medium">{recoverProgress}</p>
                {recovering && (
                  <div className="mt-2 w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-900">
                <strong>⚠️ Aviso:</strong> Este processo recuperará os dados das subcoleções para as coleções antigas. Use apenas se tiver deletado os documentos antigos.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecoverModal(false)}
                disabled={recovering}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const success = await recoverDataFromMigration()
                  if (success) {
                    setTimeout(() => setShowRecoverModal(false), 2000)
                  }
                }}
                disabled={recovering}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {recovering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Recuperando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Iniciar Recuperação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Correção de Dados */}
      {showFixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Corrigir Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Corrigir dados já migrados para adicionar campos faltantes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFixModal(false)}
                disabled={fixing}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {fixProgress && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-foreground font-medium">{fixProgress}</p>
                {fixing && (
                  <div className="mt-2 w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-900">
                <strong>ℹ️ Info:</strong> Este processo corrigirá os dados já migrados adicionando campos faltantes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFixModal(false)}
                disabled={fixing}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const success = await fixMigratedData()
                  if (success) {
                    setTimeout(() => setShowFixModal(false), 2000)
                  }
                }}
                disabled={fixing}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {fixing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Iniciar Correção
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Migração de Dados */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Migrar Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Mover dados do formato antigo para a nova estrutura organizada por usuário
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMigrationModal(false)}
                disabled={migrating}
                className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {migrationProgress && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-foreground font-medium">{migrationProgress}</p>
                {migrating && (
                  <div className="mt-2 w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>⚠️ Aviso:</strong> Este processo migrará todos os seus dados para a nova estrutura. Certifique-se de ter um backup antes de prosseguir.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowMigrationModal(false)}
                disabled={migrating}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const success = await migrateDataToNewStructure()
                  if (success) {
                    setTimeout(() => setShowMigrationModal(false), 2000)
                  }
                }}
                disabled={migrating}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {migrating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Migrando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Iniciar Migração
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Matéria */}
      {showEditMateria && materiaParaEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Editar Matéria
              </h3>
              <button
                onClick={() => {
                  setShowEditMateria(false)
                  setMateriaParaEditar(null)
                  setEditMateriaName('')
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome da Matéria *
                </label>
                <input
                  type="text"
                  value={editMateriaName}
                  onChange={(e) => setEditMateriaName(e.target.value)}
                  placeholder="Ex: Biologia 1, Física Moderna..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editMateriaName.trim()) {
                      handleEditarMateria()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditMateria(false)
                  setMateriaParaEditar(null)
                  setEditMateriaName('')
                }}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarMateria}
                disabled={!editMateriaName.trim() || salvando}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Categoria */}
      {showEditCategoria && categoriaParaEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                Editar Categoria
              </h3>
              <button
                onClick={() => {
                  setShowEditCategoria(false)
                  setCategoriaParaEditar(null)
                  setEditCategoriaName('')
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={editCategoriaName}
                  onChange={(e) => setEditCategoriaName(e.target.value)}
                  placeholder="Ex: Biologia, Exatas, Humanas..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editCategoriaName.trim()) {
                      handleEditarCategoria()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditCategoria(false)
                  setCategoriaParaEditar(null)
                  setEditCategoriaName('')
                }}
                disabled={salvando}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarCategoria}
                disabled={!editCategoriaName.trim() || salvando}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

