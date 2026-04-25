'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { MobileHeader } from '@/components/MobileHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Mobile Header - Fixed at top, only visible on mobile */}
        <MobileHeader
          onMenuToggle={toggleSidebar}
          isMenuOpen={isSidebarOpen}
        />

        {/* Main layout container */}
        <div className="flex">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

          {/* Main Content - with top padding for mobile header */}
          <main className="flex-1 min-h-screen pt-14 md:pt-0">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
