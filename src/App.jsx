// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Carrinho from './pages/Carrinho'
import Perfil from './pages/Perfil'
import Loja from './pages/Loja'
import './styles/reset.css'
import './styles/global.css'


function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/Marketplace">
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/loja" element={<Loja />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App