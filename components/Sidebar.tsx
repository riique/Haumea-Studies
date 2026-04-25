'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  FileQuestion,
  FileText,
  GraduationCap,
  Target,
  PenTool,
  Palette,
  User,
  LogOut,
  BookOpen,
  Library,
  X,
  Crosshair,
  Calculator
} from 'lucide-react'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  )
}

interface NavCategoryProps {
  title?: string
  children: React.ReactNode
}

function NavCategory({ title, children }: NavCategoryProps) {
  return (
    <div className="space-y-1">
      {title && (
        <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { userData, user } = useAuth()

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-auto
          w-64 h-screen bg-card border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Haumea Studies
            </h1>
            {/* Close button visible only on mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Theme toggle visible only on desktop */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userData?.username || user?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">Vestibulando</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <NavCategory>
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              active={pathname === '/dashboard'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/diario"
              icon={<BookOpen className="w-5 h-5" />}
              label="Diário"
              active={pathname?.startsWith('/diario')}
              onClick={handleNavClick}
            />
            <NavItem
              href="/leituras"
              icon={<Library className="w-5 h-5" />}
              label="Leituras"
              active={pathname?.startsWith('/leituras')}
              onClick={handleNavClick}
            />
            <NavItem
              href="/missoes"
              icon={<Target className="w-5 h-5" />}
              label="Missões"
              active={pathname === '/missoes'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/questoes"
              icon={<FileQuestion className="w-5 h-5" />}
              label="Questões"
              active={pathname === '/questoes'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/redacoes"
              icon={<FileText className="w-5 h-5" />}
              label="Redações"
              active={pathname === '/redacoes'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/simulados"
              icon={<GraduationCap className="w-5 h-5" />}
              label="Simulados"
              active={pathname === '/simulados'}
              onClick={handleNavClick}
            />
          </NavCategory>

          {/* AI Correction */}
          <NavCategory title="Inteligência Artificial">
            <NavItem
              href="/correcao-redacao"
              icon={<PenTool className="w-5 h-5" />}
              label="Correção de Redação"
              active={pathname === '/correcao-redacao'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/correcao-discursiva"
              icon={<FileQuestion className="w-5 h-5" />}
              label="Correção Discursiva"
              active={pathname === '/correcao-discursiva'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/interrogatorio"
              icon={<Crosshair className="w-5 h-5" />}
              label="Interrogatório"
              active={pathname === '/interrogatorio'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/haumea-math"
              icon={<Calculator className="w-5 h-5" />}
              label="Haumea Math"
              active={pathname === '/haumea-math'}
              onClick={handleNavClick}
            />
          </NavCategory>

          {/* Settings */}
          <NavCategory title="Configurações">
            <NavItem
              href="/personalizacao"
              icon={<Palette className="w-5 h-5" />}
              label="Personalização"
              active={pathname === '/personalizacao'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/perfil"
              icon={<User className="w-5 h-5" />}
              label="Perfil"
              active={pathname === '/perfil'}
              onClick={handleNavClick}
            />
            <NavItem
              href="/sair"
              icon={<LogOut className="w-5 h-5" />}
              label="Sair"
              active={pathname === '/sair'}
              onClick={handleNavClick}
            />
          </NavCategory>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <a
            href="https://x.com/riiquestudies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Criado por <span className="font-medium">@riiquestudies</span>
          </a>
        </div>
      </aside>
    </>
  )
}
