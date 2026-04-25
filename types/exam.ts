export interface ExamDay {
  date: Date
  completed?: boolean
}

export interface Exam {
  id: string
  name: string
  day1?: ExamDay
  day2?: ExamDay
  redacao?: number
  createdAt: Date
}
