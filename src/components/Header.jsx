import { Search, User, Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'
import Carrossel from './Carrossel'
import Produtos from './Produtos'
import Categorias from './Categorias'

function Header() {
  return (
    <body className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">
            <h2>Logo</h2>
          </Link>
        </div>
        <div className="header-actions">
          <Link to="/account" className="header-btn">
            <User size={28} />
          </Link>
          <Link to="/favorites" className="header-btn">
            <Heart size={28} />
          </Link>
          <Link to="/cart" className="header-btn">
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
      <Categorias />
      <Produtos />
    </body>
  )
}

export default Header