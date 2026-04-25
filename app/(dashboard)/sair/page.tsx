'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SairPage() {
  const { logOut } = useAuth()

  useEffect(() => {
    logOut()
  }, [logOut])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Saindo...</p>
      </div>
    </div>
  )
}
