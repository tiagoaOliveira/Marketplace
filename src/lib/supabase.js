// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Use variáveis de ambiente para segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Credenciais do Supabase não encontradas')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Funções utilitárias para auth
export const auth = {
  // Registrar usuário
  async signUp(email, password, fullname) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullname: fullname,
        }
      }
    })
    return { data, error }
  },

  // Login
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Pegar usuário atual
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }
    return user
  },

  // Escutar mudanças de auth
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}

// Funções para manipular dados do usuário
export const userService = {
  // Buscar perfil do usuário
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  // Atualizar perfil
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
    
    return { data, error }
  },

  // Verificar se email já existe
  async checkEmailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()
    
    return { exists: !!data, error }
  }
}