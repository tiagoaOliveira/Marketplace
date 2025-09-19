import { useState } from 'react'
import { Search, User, Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'
import Carrossel from './Carrossel'
import Produtos from './Produtos'
import Categorias from './Categorias'

function Header() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');

  const handleCategoriaSelect = (categoria) => {
    setCategoriaSelecionada(categoria);
  };

  const handleMostrarTodos = () => {
    setCategoriaSelecionada('Todos');
  };

  return (
    <div className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">
            <h2>Logo</h2>
          </Link>
        </div>
        <div className="header-actions">
          <Link to="/Perfil" className="header-btn">
            <User size={28} />
          </Link>
          <Link to="Carrinho" className="header-btn">
            <ShoppingCart size={28} />
          </Link>
        </div>
      </div>
      
      <div className="header-search">
        <div className="search-wrapper">
          <Search className="search-icon" size={26} />
          <input
            type="text"
            placeholder=" Buscar produtos..."
            className="search-input"
          />
        </div>
      </div>

      <Carrossel />      
      <Categorias 
        onCategoriaSelect={handleCategoriaSelect}
        categoriaSelecionada={categoriaSelecionada}
      />
      
      <Produtos 
        categoriaFiltro={categoriaSelecionada === 'Todos' ? null : categoriaSelecionada}
      />
    </div>
  )
}

export default Header