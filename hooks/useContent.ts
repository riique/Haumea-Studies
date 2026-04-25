'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ContentProgram, 
  ContentDocument, 
  ImportContentStructure,
  ContentProgress,
  ContentSubject,
  ContentFront,
  ContentTopic,
  ContentSubitem,
  ContentCategoryDocument
} from '@/types/content'

export function useContent() {
  const { user } = useAuth()
  const [contentPrograms, setContentPrograms] = useState<ContentDocument[]>([])
  const [contentCategories, setContentCategories] = useState<ContentCategoryDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to content programs (nova estrutura: users/{uid}/contentPrograms)
  useEffect(() => {
    if (!user) {
      setContentPrograms([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'contentPrograms')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const programs: ContentDocument[] = []
      snapshot.forEach((doc) => {
        programs.push({ id: doc.id, ...doc.data() } as ContentDocument)
      })
      setContentPrograms(programs)
      setLoading(false)
    }, (err) => {
      console.error('Error fetching content programs:', err)
      setError('Erro ao carregar conteúdo programático')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Subscribe to content categories (nova estrutura: users/{uid}/contentCategories)
  useEffect(() => {
    if (!user) {
      setContentCategories([])
      return
    }

    const q = query(
      collection(db, 'users', user.uid, 'contentCategories'),
      orderBy('order', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories: ContentCategoryDocument[] = []
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as ContentCategoryDocument)
      })
      setContentCategories(categories)
    }, (err) => {
      console.error('Error fetching content categories:', err)
      setError('Erro ao carregar categorias')
    })

    return () => unsubscribe()
  }, [user])

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Import content from JSON
  const importContentFromJSON = async (
    jsonData: ImportContentStructure
  ): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('JSON inválido: estrutura de raiz ausente')
      }
      
      const subjects: { [key: string]: ContentSubject } = {}

      // Convert JSON structure to our internal structure
      let subjectOrder = 0
      Object.entries(jsonData as any).forEach(([subjectName, subjectData]: any) => {
        const subjectId = generateId()
        const fronts: { [key: string]: ContentFront } = {}

        const frentes = (subjectData?.Frentes ?? subjectData?.frentes ?? {}) as Record<string, any>

        let frontOrder = 0
        Object.entries(frentes).forEach(([frontName, frontData]) => {
          const frontId = generateId()
          const topics: { [key: string]: ContentTopic } = {}

          const topicos = (frontData?.['Tópicos'] ?? frontData?.Topicos ?? frontData?.topicos ?? {}) as Record<string, any>

          let topicOrder = 0
          Object.entries(topicos).forEach(([topicName, topicSubitems]) => {
            const topicId = generateId()
            
            let subitemsList: string[] = []
            if (Array.isArray(topicSubitems)) {
              subitemsList = topicSubitems
            } else if (typeof topicSubitems === 'object' && topicSubitems !== null) {
              subitemsList = Object.values(topicSubitems).map(v => String(v))
            }
            
            const subitems: ContentSubitem[] = subitemsList.map(subitemName => ({
              id: generateId(),
              title: subitemName,
              completed: false
            }))

            topics[topicId] = {
              id: topicId,
              title: topicName,
              subitems,
              isExpanded: false,
              order: topicOrder++,
              completed: false
            }
          })

          fronts[frontId] = {
            id: frontId,
            title: frontName,
            topics,
            isExpanded: false,
            order: frontOrder++,
            associatedMaterias: [],
            completed: false
          }
        })

        subjects[subjectId] = {
          id: subjectId,
          title: subjectName,
          fronts,
          isExpanded: true,
          order: subjectOrder++
        }
      })

      if (Object.keys(subjects).length === 0) {
        throw new Error('JSON inválido: nenhuma disciplina encontrada')
      }

      const contentProgram: ContentProgram = {
        id: generateId(),
        userId: user.uid,
        subjects,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const subjectNamesAll = Object.values(subjects).map(s => s.title)
      const subjectNames = subjectNamesAll.slice(0, 3)
      const autoName = subjectNames.length > 0 
        ? `Conteúdo - ${subjectNames.join(', ')}${subjectNamesAll.length > 3 ? '...' : ''}`
        : 'Conteúdo Importado'

      await addDoc(collection(db, 'users', user.uid, 'contentPrograms'), {
        name: autoName,
        content: contentProgram,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (err: any) {
      console.error('Error importing content:', err)
      setError(`Erro ao importar conteúdo: ${err?.message || 'verifique o arquivo'}`)
    } finally {
      setLoading(false)
    }
  }

  // Toggle completion status of a subitem
  const toggleSubitemCompletion = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    topicId: string,
    subitemId: string
  ): Promise<void> => {
    if (!user) return

    try {
      // Find the program document
      const programDoc = contentPrograms.find(p => p.id === programDocId)
      if (!programDoc) return

      const updatedContent = { ...programDoc.content }
      const subitem = updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]?.subitems.find(
        s => s.id === subitemId
      )
      
      if (subitem) {
        subitem.completed = !subitem.completed
        updatedContent.updatedAt = new Date()

        await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
          content: updatedContent,
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      console.error('Error toggling subitem completion:', err)
      setError('Erro ao atualizar item')
    }
  }

  // Toggle completion status of a topic
  const toggleTopicCompletion = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    topicId: string
  ): Promise<void> => {
    if (!user) return

    try {
      // Find the program document
      const programDoc = contentPrograms.find(p => p.id === programDocId)
      if (!programDoc) return

      const updatedContent = { ...programDoc.content }
      const topic = updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]
      
      if (topic) {
        topic.completed = !topic.completed
        updatedContent.updatedAt = new Date()

        await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
          content: updatedContent,
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      console.error('Error toggling topic completion:', err)
      setError('Erro ao atualizar tópico')
    }
  }

  // Toggle completion status of a front
  const toggleFrontCompletion = async (
    programDocId: string,
    subjectId: string,
    frontId: string
  ): Promise<void> => {
    if (!user) return

    try {
      // Find the program document
      const programDoc = contentPrograms.find(p => p.id === programDocId)
      if (!programDoc) return

      const updatedContent = { ...programDoc.content }
      const front = updatedContent.subjects[subjectId]?.fronts[frontId]
      
      if (front) {
        front.completed = !front.completed
        updatedContent.updatedAt = new Date()

        await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
          content: updatedContent,
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      console.error('Error toggling front completion:', err)
      setError('Erro ao atualizar frente')
    }
  }

  // Toggle expansion state
  const toggleExpansion = async (
    programDocId: string,
    type: 'subject' | 'front' | 'topic',
    subjectId: string,
    frontId?: string,
    topicId?: string
  ): Promise<void> => {
    if (!user) return

    try {
      // Find the program document
      const programDoc = contentPrograms.find(p => p.id === programDocId)
      if (!programDoc) return

      const updatedContent = { ...programDoc.content }
      
      if (type === 'subject') {
        if (updatedContent.subjects[subjectId]) {
          updatedContent.subjects[subjectId].isExpanded = !updatedContent.subjects[subjectId].isExpanded
        }
      } else if (type === 'front' && frontId) {
        if (updatedContent.subjects[subjectId]?.fronts[frontId]) {
          updatedContent.subjects[subjectId].fronts[frontId].isExpanded = !updatedContent.subjects[subjectId].fronts[frontId].isExpanded
        }
      } else if (type === 'topic' && frontId && topicId) {
        if (updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]) {
          updatedContent.subjects[subjectId].fronts[frontId].topics[topicId].isExpanded = !updatedContent.subjects[subjectId].fronts[frontId].topics[topicId].isExpanded
        }
      }

      updatedContent.updatedAt = new Date()

      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error toggling expansion:', err)
      setError('Erro ao expandir/recolher')
    }
  }

  // Calculate progress statistics
  const calculateProgress = (content: ContentProgram): ContentProgress => {
    let totalItems = 0
    let completedItems = 0
    const subjectProgress: { [key: string]: any } = {}

    Object.entries(content.subjects).forEach(([subjectId, subject]) => {
      let subjectTotal = 0
      let subjectCompleted = 0

      Object.values(subject.fronts).forEach(front => {
        Object.values(front.topics).forEach(topic => {
          topic.subitems.forEach(subitem => {
            totalItems++
            subjectTotal++
            if (subitem.completed) {
              completedItems++
              subjectCompleted++
            }
          })
        })
      })

      subjectProgress[subjectId] = {
        name: subject.title,
        total: subjectTotal,
        completed: subjectCompleted,
        percentage: subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0
      }
    })

    return {
      totalItems,
      completedItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      subjectProgress
    }
  }

  // Associate/disassociate materia with front
  const toggleMateriaAssociation = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    materiaId: string
  ): Promise<void> => {
    if (!user) return

    try {
      // Find the program document
      const programDoc = contentPrograms.find(p => p.id === programDocId)
      if (!programDoc) return

      const updatedContent = { ...programDoc.content }
      const front = updatedContent.subjects[subjectId]?.fronts[frontId]
      
      if (!front) return

      if (!front.associatedMaterias) {
        front.associatedMaterias = []
      }

      const isAssociated = front.associatedMaterias.includes(materiaId)
      
      if (isAssociated) {
        front.associatedMaterias = front.associatedMaterias.filter(id => id !== materiaId)
      } else {
        front.associatedMaterias.push(materiaId)
      }

      updatedContent.updatedAt = new Date()

      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error toggling materia association:', err)
      setError('Erro ao associar matéria')
    }
  }

  // Create content category
  const createContentCategory = async (name: string, color?: string, description?: string): Promise<void> => {
    if (!user) return

    try {
      const categoryOrder = contentCategories.length
      await addDoc(collection(db, 'users', user.uid, 'contentCategories'), {
        name,
        color: color || '#6b7280',
        description: description || '',
        order: categoryOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Erro ao criar categoria')
    }
  }

  // Update content category
  const updateContentCategory = async (categoryId: string, updates: Partial<{name: string, color: string, description: string}>): Promise<void> => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'users', user.uid, 'contentCategories', categoryId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Erro ao atualizar categoria')
    }
  }

  // Delete content category
  const deleteContentCategory = async (categoryId: string): Promise<void> => {
    if (!user) return

    try {
      // Remove category from all content programs
      const programsInCategory = contentPrograms.filter(p => p.categoryId === categoryId)
      for (const program of programsInCategory) {
        await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', program.id), {
          categoryId: null,
          updatedAt: serverTimestamp()
        })
      }

      // Delete the category
      await deleteDoc(doc(db, 'users', user.uid, 'contentCategories', categoryId))
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Erro ao excluir categoria')
    }
  }

  // Assign content to category
  const assignContentToCategory = async (programDocId: string, categoryId: string | null): Promise<void> => {
    if (!user) return

    try {
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        categoryId,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error assigning content to category:', err)
      setError('Erro ao associar conteúdo à categoria')
    }
  }

  // Delete content program
  const deleteContentProgram = async (programDocId: string): Promise<void> => {
    if (!user) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId))
    } catch (err) {
      console.error('Error deleting content program:', err)
      setError('Erro ao excluir conteúdo')
    }
  }

  // Add new subject
  const addSubject = async (
    programDocId: string,
    title: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const subjectId = generateId()
      const order = Object.keys(updatedContent.subjects).length
      updatedContent.subjects[subjectId] = {
        id: subjectId,
        title,
        fronts: {},
        isExpanded: true,
        order
      }
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error adding subject:', err)
      setError('Erro ao adicionar matéria')
    }
  }

  // Add new front
  const addFront = async (
    programDocId: string,
    subjectId: string,
    title: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      if (!updatedContent.subjects[subjectId]) return
      const frontId = generateId()
      const order = Object.keys(updatedContent.subjects[subjectId].fronts).length
      updatedContent.subjects[subjectId].fronts[frontId] = {
        id: frontId,
        title,
        topics: {},
        isExpanded: true,
        order,
        associatedMaterias: [],
        completed: false
      }
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error adding front:', err)
      setError('Erro ao adicionar frente')
    }
  }

  // Add new topic
  const addTopic = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    title: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const front = updatedContent.subjects[subjectId]?.fronts[frontId]
      if (!front) return
      const topicId = generateId()
      const order = Object.keys(front.topics).length
      front.topics[topicId] = {
        id: topicId,
        title,
        subitems: [],
        isExpanded: true,
        order,
        completed: false
      }
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error adding topic:', err)
      setError('Erro ao adicionar tópico')
    }
  }

  // Add new subitem
  const addSubitem = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    topicId: string,
    title: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const topic = updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]
      if (!topic) return
      topic.subitems.push({ id: generateId(), title, completed: false })
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error adding subitem:', err)
      setError('Erro ao adicionar item')
    }
  }

  // Update front (frente/matéria) title
  const updateFrontTitle = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    newTitle: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const front = updatedContent.subjects[subjectId]?.fronts[frontId]
      if (!front) return
      front.title = newTitle.trim()
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating front title:', err)
      setError('Erro ao atualizar frente')
    }
  }

  // Update topic title
  const updateTopicTitle = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    topicId: string,
    newTitle: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const topic = updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]
      if (!topic) return
      topic.title = newTitle.trim()
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating topic title:', err)
      setError('Erro ao atualizar tópico')
    }
  }

  // Update subitem title
  const updateSubitemTitle = async (
    programDocId: string,
    subjectId: string,
    frontId: string,
    topicId: string,
    subitemId: string,
    newTitle: string
  ): Promise<void> => {
    if (!user) return
    const programDoc = contentPrograms.find(p => p.id === programDocId)
    if (!programDoc) return

    try {
      const updatedContent = { ...programDoc.content }
      const subitem = updatedContent.subjects[subjectId]?.fronts[frontId]?.topics[topicId]?.subitems.find(
        s => s.id === subitemId
      )
      if (!subitem) return
      subitem.title = newTitle.trim()
      updatedContent.updatedAt = new Date()
      await updateDoc(doc(db, 'users', user.uid, 'contentPrograms', programDocId), {
        content: updatedContent,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating subitem title:', err)
      setError('Erro ao atualizar item')
    }
  }

  // Export content to JSON
  const exportContentToJSON = (programDoc: ContentDocument): void => {
    try {
      const content = programDoc.content
      const exportData: any = {}

      // Convert internal structure back to hierarchical JSON
      Object.values(content.subjects).forEach((subject) => {
        const fronts: any = {}

        Object.values(subject.fronts).forEach((front) => {
          const topicos: any = {}

          Object.values(front.topics).forEach((topic) => {
            topicos[topic.title] = topic.subitems.map(s => s.title)
          })

          fronts[front.title] = {
            'Tópicos': topicos
          }
        })

        exportData[subject.title] = {
          'Frentes': fronts
        }
      })

      // Create JSON string
      const jsonString = JSON.stringify(exportData, null, 2)

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${programDoc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting content:', err)
      setError('Erro ao exportar conteúdo')
    }
  }

  // Export content to PDF
  const exportContentToPDF = async (programDoc: ContentDocument): Promise<void> => {
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default

      // Create a temporary container for rendering
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '210mm'
      container.style.backgroundColor = 'white'
      container.style.padding = '10px'
      container.style.fontFamily = 'Arial, sans-serif'
      container.style.color = '#000'

      const content = programDoc.content

      // Build HTML content with larger styling
      let html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="text-align: center; color: #1f2937; margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">
            ${programDoc.name}
          </h1>
      `

      Object.values(content.subjects).sort((a: any, b: any) => a.order - b.order).forEach((subject: any) => {
        html += `
          <div style="margin-bottom: 16px;">
            <h2 style="color: #1f2937; font-size: 18px; font-weight: bold; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; margin: 0 0 10px 0;">
              ${subject.title}
            </h2>
        `

        Object.values(subject.fronts).sort((a: any, b: any) => a.order - b.order).forEach((front: any) => {
          html += `
            <div style="margin-left: 12px; margin-bottom: 12px;">
              <h3 style="color: #374151; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">
                📌 ${front.title}
              </h3>
          `

          Object.values(front.topics).sort((a: any, b: any) => a.order - b.order).forEach((topic: any) => {
            html += `
              <div style="margin-left: 12px; margin-bottom: 7px;">
                <h4 style="color: #4b5563; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">
                  • ${topic.title}
                </h4>
                <ul style="margin: 0 0 6px 18px; padding: 0; list-style-type: disc;">
            `

            topic.subitems.forEach((subitem: any) => {
              html += `
                <li style="color: #6b7280; font-size: 12px; margin: 2px 0; line-height: 1.3;">
                  ${subitem.title}
                </li>
              `
            })

            html += `
                </ul>
              </div>
            `
          })

          html += `
            </div>
          `
        })

        html += `
          </div>
        `
      })

      html += `
        </div>
      `

      container.innerHTML = html
      document.body.appendChild(container)

      // Convert to canvas with single page approach
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      // Create PDF with single page
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 5
      const availableWidth = pageWidth - 2 * margin
      const availableHeight = pageHeight - 2 * margin

      // Calculate scale to fit content in one page
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const scale = Math.min(
        availableWidth / (canvasWidth / 96 * 25.4),
        availableHeight / (canvasHeight / 96 * 25.4)
      )

      const imgWidth = (canvasWidth / 96 * 25.4) * scale
      const imgHeight = (canvasHeight / 96 * 25.4) * scale

      const imgData = canvas.toDataURL('image/png')
      const x = margin + (availableWidth - imgWidth) / 2
      const y = margin

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

      // Download PDF
      pdf.save(`${programDoc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.pdf`)

      // Clean up
      document.body.removeChild(container)
    } catch (err) {
      console.error('Error exporting to PDF:', err)
      setError('Erro ao exportar para PDF')
    }
  }

  return {
    contentPrograms,
    contentCategories,
    loading,
    error,
    importContentFromJSON,
    exportContentToJSON,
    exportContentToPDF,
    toggleSubitemCompletion,
    toggleTopicCompletion,
    toggleFrontCompletion,
    toggleExpansion,
    calculateProgress,
    toggleMateriaAssociation,
    createContentCategory,
    updateContentCategory,
    deleteContentCategory,
    assignContentToCategory,
    deleteContentProgram,
    addSubject,
    addFront,
    addTopic,
    addSubitem,
    updateFrontTitle,
    updateTopicTitle,
    updateSubitemTitle
  }
}
