// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Carrinho from './pages/Carrinho'
import Perfil from './pages/Perfil'
import Loja from './pages/Loja'
import PerfilLoja from './pages/PerfilLoja'
import './styles/reset.css'
import './styles/global.css'
import { ProductModalProvider}from '../src/contexts/ProductModalContext'

// Componente interno que tem acesso ao contexto
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Header user={user} />} />
      <Route path="/carrinho" element={<Carrinho />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/loja" element={<Loja />} />
      <Route path='/loja/:storeSlug' element={<PerfilLoja />} />
    </Routes>
  )
}

function App() {
  return (
    <ProductModalProvider>
      <AuthProvider>
        <BrowserRouter basename="/Marketplace">
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ProductModalProvider>
  );
}

export default App