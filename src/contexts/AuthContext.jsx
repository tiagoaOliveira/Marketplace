// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, userService } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Função para limpar dados sensíveis
  const clearUserData = () => {
    setUser(null)
    setUserProfile(null)
    setError(null)
  }

  useEffect(() => {
    // Verificar usuário atual no carregamento
    const getInitialUser = async () => {
      try {
        setLoading(true)
        const user = await auth.getUser()
        console.log('Initial user check:', user)
        
        if (user) {
          setUser(user)
          // Tentar buscar perfil, mas não falhar se não existir
          try {
            const { data: profile, error: profileError } = await userService.getProfile(user.id)
            if (profileError) {
              console.log('Perfil não encontrado, será criado no primeiro login:', profileError)
            } else {
              setUserProfile(profile)
            }
          } catch (profileError) {
            console.log('Erro ao buscar perfil:', profileError)
            // Usuário existe mas não tem perfil - isso é normal para novos usuários
          }
        } else {
          clearUserData()
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        setError('Erro ao carregar dados do usuário')
        clearUserData()
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // Escutar mudanças de autenticação
    const subscription = auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        try {
          if (session?.user) {
            setUser(session.user)
            // Tentar buscar perfil
            try {
              const { data: profile, error: profileError } = await userService.getProfile(session.user.id)
              if (!profileError && profile) {
                setUserProfile(profile)
              }
            } catch (profileError) {
              console.log('Perfil não encontrado para usuário logado')
            }
            setError(null)
          } else {
            clearUserData()
          }
        } catch (error) {
          console.error('Erro na mudança de auth:', error)
          clearUserData()
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email, password, fullname) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signUp(email, password, fullname)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signIn(email, password)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await auth.signOut()
      if (error) throw error
      
      clearUserData()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')
      
      const { data, error } = await userService.updateProfile(user.id, updates)
      
      if (error) throw error
      
      setUserProfile(data[0])
      return { data, error: null }
    } catch (error) {
      setError(error.message)
      return { data: null, error: error.message }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}