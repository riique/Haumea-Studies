/**
 * Tipos para o sistema de Diário de Bordo
 */

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryInput {
  title: string;
  content: string;
}
