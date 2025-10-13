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
    let isMounted = true

    // Verificar usuário atual no carregamento
    const getInitialUser = async () => {
      try {        
        const user = await auth.getUser()
        
        if (!isMounted) return
        
        if (user) {
          setUser(user)
          
          // Tentar buscar perfil com timeout
          try {
            const profilePromise = userService.getProfile(user.id)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 5000)
            )
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise, 
              timeoutPromise
            ])
            
            if (!isMounted) return
            
            if (profileError) {
            } else if (profile) {
              setUserProfile(profile)
            }
          } catch (profileError) {
          }
        } else {
          clearUserData()
        }
      } catch (error) {
        if (isMounted) {
          setError('Erro ao verificar autenticação')
          clearUserData()
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialUser()

    // Escutar mudanças de autenticação
    const subscription = auth.onAuthStateChange(
      async (event, session) => {
        
        if (!isMounted) return
        
        try {
          if (session?.user) {
            setUser(session.user)
            setError(null)
            setLoading(false) // Importante: definir loading como false aqui
            
            // Tentar buscar perfil sem bloquear a UI
            setTimeout(async () => {
              try {
                const { data: profile, error: profileError } = await userService.getProfile(session.user.id)
                if (!profileError && profile && isMounted) {
                  setUserProfile(profile)
                }
              } catch (profileError) {
              }
            }, 100)
          } else {
            clearUserData()
            setLoading(false)
          }
        } catch (error) {
          console.error('Erro na mudança de auth:', error)
          if (isMounted) {
            setLoading(false)
            clearUserData()
          }
        }
      }
    )

    return () => {
      isMounted = false
      
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
      
      if (data && data[0]) {
        setUserProfile(data[0])
      }
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