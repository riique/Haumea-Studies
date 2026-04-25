'use client'

import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface MobileHeaderProps {
    onMenuToggle: () => void
    isMenuOpen: boolean
}

export function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Menu Button */}
                <button
                    onClick={onMenuToggle}
                    className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                    {isMenuOpen ? (
                        <X className="w-6 h-6 text-foreground" />
                    ) : (
                        <Menu className="w-6 h-6 text-foreground" />
                    )}
                </button>

                {/* Logo */}
                <h1 className="font-display text-lg font-bold text-foreground">
                    Haumea Studies
                </h1>

                {/* Theme Toggle */}
                <ThemeToggle />
            </div>
        </header>
    )
}
