'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface UserData {
  username: string
  email: string
  createdAt: Date
  openRouterApiKey?: string
  openRouterModel?: string
  credits?: number
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        // Buscar dados adicionais do Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData)
        }
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Atualizar perfil com username
      await updateProfile(user, {
        displayName: username,
      })

      // Criar documento no Firestore
      const userData: UserData = {
        username,
        email,
        createdAt: new Date(),
        credits: 10, // Créditos iniciais
      }

      await setDoc(doc(db, 'users', user.uid), userData)

      // Criar subcoleções vazias
      await setDoc(doc(db, 'users', user.uid, 'questoes', '_init'), {
        initialized: true,
      })
      await setDoc(doc(db, 'users', user.uid, 'redacoes', '_init'), {
        initialized: true,
      })
      await setDoc(doc(db, 'users', user.uid, 'simulados', '_init'), {
        initialized: true,
      })
      await setDoc(doc(db, 'users', user.uid, 'materias', '_init'), {
        initialized: true,
      })

      // Deslogar após criar conta para forçar login
      await signOut(auth)
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      throw error
    }
  }

  const logIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
      router.push('/entrar')
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signUp,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
