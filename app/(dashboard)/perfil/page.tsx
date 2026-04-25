'use client'

import { PageLayout } from '@/components/PageLayout'
import { User, Mail, Save, Lock, Trash2, AlertTriangle, Key, Eye, EyeOff, Coins, Sparkles, Bot } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const { user, userData } = useAuth()
  const router = useRouter()

  // Estados para perfil
  const [username, setUsername] = useState(userData?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)

  // Estados para senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')

  // Estados para API Key
  const [apiKey, setApiKey] = useState(userData?.openRouterApiKey || '')
  const [model, setModel] = useState(userData?.openRouterModel || 'google/gemini-2.0-flash-exp:free')
  const [showApiKey, setShowApiKey] = useState(false)
  const [salvandoApiKey, setSalvandoApiKey] = useState(false)

  // Estados para deletar conta
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletandoConta, setDeletandoConta] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return

    setSalvandoPerfil(true)
    try {
      // Atualizar displayName no Firebase Auth
      await updateProfile(user, {
        displayName: username
      })

      // Atualizar no Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        username
      })

      // Atualizar email se mudou
      if (email !== user.email) {
        await updateEmail(user, email)
        await updateDoc(doc(db, 'users', user.uid), {
          email
        })
      }

      alert('Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      if (error.code === 'auth/requires-recent-login') {
        alert('Por segurança, faça login novamente para alterar o email.')
      } else {
        alert('Erro ao atualizar perfil: ' + error.message)
      }
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user || !user.email) return

    setErroSenha('')

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem')
      return
    }

    setSalvandoSenha(true)
    try {
      // Reautenticar usuário
      const credential = EmailAuthProvider.credential(user.email, senhaAtual)
      await reauthenticateWithCredential(user, credential)

      // Atualizar senha
      await updatePassword(user, novaSenha)

      alert('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      if (error.code === 'auth/wrong-password') {
        setErroSenha('Senha atual incorreta')
      } else if (error.code === 'auth/weak-password') {
        setErroSenha('Senha muito fraca')
      } else {
        setErroSenha('Erro ao alterar senha: ' + error.message)
      }
    } finally {
      setSalvandoSenha(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!user) return

    setSalvandoApiKey(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        openRouterApiKey: apiKey || null,
        openRouterModel: model || 'google/gemini-2.0-flash-exp:free'
      })
      alert('Configurações do OpenRouter salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSalvandoApiKey(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'DELETAR') return

    setDeletandoConta(true)
    try {
      // Deletar dados do Firestore
      await deleteDoc(doc(db, 'users', user.uid))

      // Deletar conta do Firebase Auth
      await deleteUser(user)

      alert('Conta deletada com sucesso')
      router.push('/entrar')
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error)
      if (error.code === 'auth/requires-recent-login') {
        alert('Por segurança, faça login novamente antes de deletar a conta.')
      } else {
        alert('Erro ao deletar conta: ' + error.message)
      }
    } finally {
      setDeletandoConta(false)
    }
  }

  return (
    <PageLayout
      title="Perfil"
      description="Gerencie suas informações pessoais e preferências de conta"
    >
      <div className="space-y-6">
        {/* Credits Section */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Créditos de Correção
                </h3>
                <p className="text-muted-foreground text-sm">
                  Use para corrigir redações com inteligência artificial
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-primary/30 rounded-lg px-6 py-4">
              <Coins className="w-6 h-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Créditos disponíveis</p>
                <p className="text-3xl font-bold text-primary">{userData?.credits ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/20">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Cada correção de redação custa 1 crédito.</strong> Você recebeu 10 créditos ao criar sua conta.
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">{userData?.username || user?.displayName || 'Usuário'}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={salvandoPerfil}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Senha atual
              </label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>
            {erroSenha && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{erroSenha}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={!senhaAtual || !novaSenha || !confirmarSenha || salvandoSenha}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Lock className="w-5 h-5" />
                {salvandoSenha ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key OpenRouter
          </h3>
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground mb-2">
                <strong>Sobre o OpenRouter:</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                O OpenRouter é usado para correção inteligente de redações. Você pode usar sua própria
                API Key ou utilizar a chave fornecida pelo site (com limite de correções mensais).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sua API Key (Opcional)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-2.5 pr-12 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {apiKey
                  ? "✓ Usando sua API Key pessoal"
                  : "Deixe em branco para usar a chave do site (limitado)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Modelo da IA
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="google/gemini-2.0-flash-exp:free"
                  className="w-full px-4 py-2.5 pl-10 bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Nome do modelo no OpenRouter (ex: google/gemini-2.0-flash-exp:free, openai/gpt-4o, anthropic/claude-3.5-sonnet)
              </p>
            </div>

            <div className="bg-secondary border border-border rounded-lg p-4">
              <p className="text-sm text-foreground mb-2">
                <strong>Como obter sua API Key:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai</a></li>
                <li>Crie uma conta ou faça login</li>
                <li>Vá em "Keys" no menu</li>
                <li>Gere uma nova API Key</li>
                <li>Cole aqui e salve</li>
              </ol>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveApiKey}
                disabled={salvandoApiKey}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {salvandoApiKey ? 'Salvando...' : 'Salvar API Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Uma vez que você deletar sua conta, não há como voltar atrás. Por favor, tenha certeza.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Deletar Conta
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Deletar Conta Permanentemente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita. Todos os seus dados, incluindo questões,
                  redações e simulados serão permanentemente removidos.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Para confirmar, digite <span className="font-bold">DELETAR</span> abaixo:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Digite DELETAR"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/10 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETAR' || deletandoConta}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletandoConta ? 'Deletando...' : 'Deletar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
