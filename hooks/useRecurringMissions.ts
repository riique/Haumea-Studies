'use client'

import { useState, useEffect } from 'react'
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    getDocs,
    where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { RecurringMission, RecurringMissionCategory } from '@/types/mission'

export function useRecurringMissions() {
    const { user } = useAuth()
    const [recurringMissions, setRecurringMissions] = useState<RecurringMission[]>([])
    const [categories, setCategories] = useState<RecurringMissionCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [categoriesLoading, setCategoriesLoading] = useState(true)

    // Listener para missões recorrentes
    useEffect(() => {
        if (!user) {
            setRecurringMissions([])
            setLoading(false)
            return
        }

        const recurringMissionsRef = collection(db, 'users', user.uid, 'recurringMissions')
        const q = query(
            recurringMissionsRef,
            orderBy('createdAt', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const missionsData = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    userId: data.userId,
                    title: data.title,
                    description: data.description || undefined,
                    categoryId: data.categoryId || undefined,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    isActive: data.isActive ?? true,
                    totalAccumulatedTime: data.totalAccumulatedTime || 0,
                } as RecurringMission
            })
            setRecurringMissions(missionsData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    // Listener para categorias
    useEffect(() => {
        if (!user) {
            setCategories([])
            setCategoriesLoading(false)
            return
        }

        const categoriesRef = collection(db, 'users', user.uid, 'recurringMissionCategories')
        const q = query(
            categoriesRef,
            orderBy('order', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoriesData = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    userId: data.userId,
                    name: data.name,
                    color: data.color || undefined,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    order: data.order || 0,
                } as RecurringMissionCategory
            })
            setCategories(categoriesData)
            setCategoriesLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    // ===== FUNÇÕES PARA CATEGORIAS =====

    const addCategory = async (name: string, color?: string) => {
        if (!user) return

        const categoriesRef = collection(db, 'users', user.uid, 'recurringMissionCategories')

        // Definir a ordem como o próximo número
        const maxOrder = categories.length > 0
            ? Math.max(...categories.map(c => c.order)) + 1
            : 0

        const categoryData: any = {
            userId: user.uid,
            name: name.trim(),
            createdAt: Timestamp.now(),
            order: maxOrder,
        }

        if (color && color.trim()) {
            categoryData.color = color.trim()
        }

        const docRef = await addDoc(categoriesRef, categoryData)
        return docRef.id
    }

    const updateCategory = async (categoryId: string, name: string, color?: string) => {
        if (!user) return
        const categoryRef = doc(db, 'users', user.uid, 'recurringMissionCategories', categoryId)

        const updateData: any = {
            name: name.trim(),
        }

        if (color && color.trim()) {
            updateData.color = color.trim()
        } else {
            updateData.color = null
        }

        await updateDoc(categoryRef, updateData)
    }

    const deleteCategory = async (categoryId: string) => {
        if (!user) return

        // Remover categoryId de todas as missões que pertencem a esta categoria
        const missionsToUpdate = recurringMissions.filter(m => m.categoryId === categoryId)
        for (const mission of missionsToUpdate) {
            const missionRef = doc(db, 'users', user.uid, 'recurringMissions', mission.id)
            await updateDoc(missionRef, { categoryId: null })
        }

        // Deletar a categoria
        const categoryRef = doc(db, 'users', user.uid, 'recurringMissionCategories', categoryId)
        await deleteDoc(categoryRef)
    }

    const reorderCategories = async (orderedIds: string[]) => {
        if (!user) return

        const updates = orderedIds.map((id, index) => {
            const categoryRef = doc(db, 'users', user.uid, 'recurringMissionCategories', id)
            return updateDoc(categoryRef, { order: index })
        })

        await Promise.all(updates)
    }

    // ===== FUNÇÕES PARA MISSÕES RECORRENTES =====

    const addRecurringMission = async (
        title: string,
        description?: string,
        categoryId?: string
    ) => {
        if (!user) return

        const recurringMissionsRef = collection(db, 'users', user.uid, 'recurringMissions')
        const missionData: any = {
            userId: user.uid,
            title,
            createdAt: Timestamp.now(),
            isActive: true,
            totalAccumulatedTime: 0,
        }

        if (description && description.trim()) {
            missionData.description = description.trim()
        }

        if (categoryId && categoryId.trim()) {
            missionData.categoryId = categoryId.trim()
        }

        await addDoc(recurringMissionsRef, missionData)
    }

    const updateRecurringMission = async (
        missionId: string,
        title: string,
        description?: string,
        categoryId?: string
    ) => {
        if (!user) return
        const missionRef = doc(db, 'users', user.uid, 'recurringMissions', missionId)

        const updateData: any = {
            title: title.trim(),
        }

        if (description && description.trim()) {
            updateData.description = description.trim()
        } else {
            updateData.description = null
        }

        if (categoryId && categoryId.trim()) {
            updateData.categoryId = categoryId.trim()
        } else {
            updateData.categoryId = null
        }

        await updateDoc(missionRef, updateData)
    }

    const updateMissionCategory = async (missionId: string, categoryId: string | null) => {
        if (!user) return
        const missionRef = doc(db, 'users', user.uid, 'recurringMissions', missionId)
        await updateDoc(missionRef, { categoryId: categoryId })
    }

    const deleteRecurringMission = async (missionId: string) => {
        if (!user) return
        const missionRef = doc(db, 'users', user.uid, 'recurringMissions', missionId)
        await deleteDoc(missionRef)
    }

    const toggleRecurringMissionStatus = async (missionId: string, isActive: boolean) => {
        if (!user) return
        const missionRef = doc(db, 'users', user.uid, 'recurringMissions', missionId)
        await updateDoc(missionRef, { isActive })
    }

    const updateAccumulatedTime = async (missionId: string, additionalTime: number) => {
        if (!user) return
        const missionRef = doc(db, 'users', user.uid, 'recurringMissions', missionId)

        // Buscar o tempo atual
        const recurringMission = recurringMissions.find(m => m.id === missionId)
        if (!recurringMission) return

        const newTotalTime = (recurringMission.totalAccumulatedTime || 0) + additionalTime
        await updateDoc(missionRef, {
            totalAccumulatedTime: newTotalTime
        })
    }

    // Criar instâncias de missões recorrentes para uma semana específica
    const createRecurringMissionInstances = async (weekStartDate: string) => {
        if (!user) return

        const activeMissions = recurringMissions.filter(m => m.isActive)
        const missionsRef = collection(db, 'users', user.uid, 'missions')

        // Verificar quais missões recorrentes já existem para esta semana
        const q = query(
            missionsRef,
            where('weekStartDate', '==', weekStartDate),
            where('isRecurring', '==', true)
        )
        const existingSnapshot = await getDocs(q)
        const existingRecurringIds = new Set(
            existingSnapshot.docs.map(doc => doc.data().recurringMissionId)
        )

        // Criar apenas as missões que ainda não existem
        // Missões recorrentes são criadas como tarefas genéricas - sem matéria ou dia específico
        for (const recurringMission of activeMissions) {
            if (!existingRecurringIds.has(recurringMission.id)) {
                const missionData: any = {
                    userId: user.uid,
                    title: recurringMission.title,
                    subject: 'Geral', // Matéria genérica para missões recorrentes
                    weekStartDate,
                    // dayOfWeek NÃO é definido para missões recorrentes - elas não pertencem a um dia específico
                    status: 'pendente',
                    createdAt: Timestamp.now(),
                    timeSpent: 0,
                    isTimerRunning: false,
                    isRecurring: true,
                    recurringMissionId: recurringMission.id,
                    accumulatedTime: recurringMission.totalAccumulatedTime,
                }

                if (recurringMission.description && recurringMission.description.trim()) {
                    missionData.description = recurringMission.description.trim()
                }

                // Adicionar categoryId se existir
                if (recurringMission.categoryId) {
                    missionData.recurringCategoryId = recurringMission.categoryId
                }

                await addDoc(missionsRef, missionData)
            }
        }
    }

    // Função utilitária para agrupar missões por categoria
    const getMissionsByCategory = () => {
        const grouped: Record<string, RecurringMission[]> = {
            uncategorized: []
        }

        // Inicializar grupos para cada categoria
        categories.forEach(cat => {
            grouped[cat.id] = []
        })

        // Agrupar missões
        recurringMissions.forEach(mission => {
            if (mission.categoryId && grouped[mission.categoryId]) {
                grouped[mission.categoryId].push(mission)
            } else {
                grouped.uncategorized.push(mission)
            }
        })

        return grouped
    }

    return {
        // Missões
        recurringMissions,
        loading,
        addRecurringMission,
        updateRecurringMission,
        updateMissionCategory,
        deleteRecurringMission,
        toggleRecurringMissionStatus,
        updateAccumulatedTime,
        createRecurringMissionInstances,
        getMissionsByCategory,

        // Categorias
        categories,
        categoriesLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
    }
}
