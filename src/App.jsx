import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Carrinho from './pages/Carrinho'
import Perfil from './pages/Perfil'


function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Header />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App