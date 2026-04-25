export type ReadingStatus = 'nao_lido' | 'lendo' | 'concluido'

export interface ChapterNote {
  chapterName: string
  notes: string
}

export interface Dossier {
  finalSummary: string
  chapterNotes: ChapterNote[]
}

export interface Reading {
  id: string
  userId: string
  bookTitle: string
  institution: string
  pageCount: number
  currentPage: number
  preSummary?: string
  status: ReadingStatus
  dossier: Dossier
  createdAt: Date
}
