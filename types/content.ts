// Types for the Content Programático system

export interface ContentSubitem {
  id: string
  title: string
  completed: boolean
}

export interface ContentTopic {
  id: string
  title: string
  subitems: ContentSubitem[]
  isExpanded: boolean
  order: number
  completed?: boolean
}

export interface ContentFront {
  id: string
  title: string
  topics: { [key: string]: ContentTopic }
  isExpanded: boolean
  order: number
  associatedMaterias?: string[] // IDs das matérias associadas
  completed?: boolean
}

export interface ContentSubject {
  id: string
  title: string
  fronts: { [key: string]: ContentFront }
  isExpanded: boolean
  order: number
}

export interface ContentProgram {
  id: string
  userId: string
  subjects: { [key: string]: ContentSubject }
  createdAt: Date
  updatedAt: Date
}

// JSON Import Structure (matches the provided example)
export interface ImportContentStructure {
  [subjectName: string]: {
    Frentes: {
      [frontName: string]: {
        Tópicos: {
          [topicName: string]: string[]
        }
      }
    }
  }
}

// Progress Statistics
export interface ContentProgress {
  totalItems: number
  completedItems: number
  percentage: number
  subjectProgress: {
    [subjectId: string]: {
      name: string
      total: number
      completed: number
      percentage: number
    }
  }
}

// Content Category
export interface ContentCategory {
  id: string
  name: string
  color?: string
  description?: string
  order: number
  createdAt: Date
}

// Firestore Document
export interface ContentDocument {
  id: string
  userId: string
  name: string
  content: ContentProgram
  categoryId?: string // Reference to ContentCategory
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
}

// Category Document for Firestore
export interface ContentCategoryDocument {
  id: string
  userId: string
  name: string
  color?: string
  description?: string
  order: number
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
}
