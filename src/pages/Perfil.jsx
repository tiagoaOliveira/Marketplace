// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Perfil.css'

const PerfilUsuario = () => {
  const { user, userProfile, signUp, signIn, signOut, updateProfile, loading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [telaAtiva, setTelaAtiva] = useState('menu')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    phone: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Preencher form com dados do usuário quando carregados
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullname: userProfile.fullname || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      }))
    }
  }, [userProfile])

  const handleVoltar = () => {
    if (telaAtiva === 'menu') {
      window.history.back()
    } else {
      setTelaAtiva('menu')
      setFormErrors({})
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro do campo quando usuário digita
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = (type) => {
    const errors = {}
    
    if (type === 'cadastro') {
      if (!formData.fullname.trim()) errors.fullname = 'Nome é obrigatório'
      if (!formData.email.trim()) errors.email = 'Email é obrigatório'
      if (!formData.password) errors.password = 'Senha é obrigatória'
      if (formData.password.length < 6) errors.password = 'Senha deve ter pelo menos 6 caracteres'
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem'
      }
    }
    
    if (type === 'login') {
      if (!formData.email.trim()) errors.email = 'Email é obrigatório'
      if (!formData.password) errors.password = 'Senha é obrigatória'
    }

    if (type === 'dados') {
      if (!formData.fullname.trim()) errors.fullname = 'Nome é obrigatório'
      if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
        errors.phone = 'Formato: (11) 99999-9999'
      }
    }

    return errors
  }

  const handleSubmit = async (e, type) => {
    e.preventDefault()
    
    const errors = validateForm(type)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    try {
      if (type === 'cadastro') {
        const { error } = await signUp(formData.email, formData.password, formData.fullname)
        if (error) {
          setFormErrors({ submit: error })
        } else {
          setTelaAtiva('menu')
          // Limpar form
          setFormData({ email: '', password: '', confirmPassword: '', fullname: '', phone: '' })
        }
      }

      if (type === 'login') {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          setFormErrors({ submit: error })
        } else {
          setTelaAtiva('menu')
          setFormData({ email: '', password: '', confirmPassword: '', fullname: '', phone: '' })
        }
      }

      if (type === 'dados') {
        const updates = {
          fullname: formData.fullname,
          phone: formData.phone || null
        }
        const { error } = await updateProfile(updates)
        if (error) {
          setFormErrors({ submit: error })
        } else {
          setTelaAtiva('menu')
        }
      }
    } catch (err) {
      setFormErrors({ submit: 'Erro inesperado. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setTelaAtiva('menu')
  }

  const navigateToStores = () => {
    // Usar navigate do React Router em vez de window.location.href
    navigate('/loja')
  }

  const renderMenu = () => (
    <div className="conta-menu">
      {!isAuthenticated ? (
        <>
          <div className="conta-opcao" onClick={() => setTelaAtiva('login')}>
            <span className="opcao-icone">🔐</span>
            <div>
              <h3>Entrar</h3>
              <p>Acesse sua conta</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={() => setTelaAtiva('cadastro')}>
            <span className="opcao-icone">👤</span>
            <div>
              <h3>Cadastrar</h3>
              <p>Crie sua conta</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="conta-opcao" onClick={() => setTelaAtiva('dados')}>
            <span className="opcao-icone">⚙️</span>
            <div>
              <h3>Meus Dados</h3>
              <p>Edite suas informações</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={navigateToStores}>
            <span className="opcao-icone">🏪</span>
            <div>
              <h3>Minha Loja</h3>
              <p>Gerenciar lojas e produtos</p>
            </div>
          </div>
          <div className="conta-opcao" onClick={handleLogout}>
            <span className="opcao-icone">🚪</span>
            <div>
              <h3>Sair</h3>
              <p>Fazer logout</p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderCadastro = () => (
    <form className="conta-form" onSubmit={(e) => handleSubmit(e, 'cadastro')}>
      <h2>Criar Conta</h2>
      
      {formErrors.submit && (
        <div className="error-message">{formErrors.submit}</div>
      )}
      
      <div className="form-group">
        <label>Nome Completo</label>
        <input 
          type="text" 
          name="fullname"
          value={formData.fullname}
          onChange={handleInputChange}
          placeholder="Digite seu nome completo" 
        />
        {formErrors.fullname && <span className="field-error">{formErrors.fullname}</span>}
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Digite seu email" 
        />
        {formErrors.email && <span className="field-error">{formErrors.email}</span>}
      </div>
      
      <div className="form-group">
        <label>Senha</label>
        <input 
          type="password" 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Digite sua senha" 
        />
        {formErrors.password && <span className="field-error">{formErrors.password}</span>}
      </div>
      
      <div className="form-group">
        <label>Confirmar Senha</label>
        <input 
          type="password" 
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirme sua senha" 
        />
        {formErrors.confirmPassword && <span className="field-error">{formErrors.confirmPassword}</span>}
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary btn-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Criando...' : 'Criar Conta'}
      </button>
    </form>
  )

  const renderLogin = () => (
    <form className="conta-form" onSubmit={(e) => handleSubmit(e, 'login')}>
      <h2>Entrar</h2>
      
      {formErrors.submit && (
        <div className="error-message">{formErrors.submit}</div>
      )}
      
      <div className="form-group">
        <label>Email</label>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Digite seu email" 
        />
        {formErrors.email && <span className="field-error">{formErrors.email}</span>}
      </div>
      
      <div className="form-group">
        <label>Senha</label>
        <input 
          type="password" 
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Digite sua senha" 
        />
        {formErrors.password && <span className="field-error">{formErrors.password}</span>}
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary btn-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
      
      <button 
        type="button" 
        className="btn-link" 
        onClick={() => setTelaAtiva('cadastro')}
      >
        Não tem conta? Cadastre-se
      </button>
    </form>
  )

  const renderDados = () => (
    <form className="conta-form" onSubmit={(e) => handleSubmit(e, 'dados')}>      
      {formErrors.submit && (
        <div className="error-message">{formErrors.submit}</div>
      )}
      
      <div className="form-group">
        <label>Nome Completo</label>
        <input 
          type="text" 
          name="fullname"
          value={formData.fullname}
          onChange={handleInputChange}
        />
        {formErrors.fullname && <span className="field-error">{formErrors.fullname}</span>}
      </div>
      
      <div className="form-group">
        <label>Email</label>
        <input 
          type="email" 
          value={formData.email}
          disabled
          className="disabled-field"
        />
        <small>Email não pode ser alterado</small>
      </div>
      
      <div className="form-group">
        <label>Telefone</label>
        <input 
          type="tel" 
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="(11) 99999-9999" 
        />
        {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary btn-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  )

  const renderConteudo = () => {
    if (loading) {
      return <div className="loading-message">Carregando...</div>
    }

    switch (telaAtiva) {
      case 'cadastro':
        return renderCadastro()
      case 'login':
        return renderLogin()
      case 'dados':
        return renderDados()
      default:
        return renderMenu()
    }
  }

  const getTitulo = () => {
    switch (telaAtiva) {
      case 'cadastro':
        return 'Criar Conta'
      case 'login':
        return 'Entrar'
      case 'dados':
        return 'Meus Dados'
      default:
        return isAuthenticated ? 'Minha Conta' : 'Conta'
    }
  }

  return (
    <div className="conta-container">
      <div className="conta-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          ←
        </button>
        <h1>{getTitulo()}</h1>
      </div>

      <div className="conta-conteudo">
        {renderConteudo()}
      </div>
    </div>
  )
}

export default PerfilUsuario