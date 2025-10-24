import { useState } from 'react'
import { Search, User, Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'
import SearchSystem from './SearchSystem'
import Produtos from './Produtos'
import Categorias from './Categorias'

function Header() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const handleCategoriaSelect = (categoria) => {
    setCategoriaSelecionada(categoria);
  };

  const handleMostrarTodos = () => {
    setCategoriaSelecionada('Todos');
  };

  const handleProductSelect = (produto) => {
    const produtoFormatado = {
      id: produto.listings?.[0]?.id || produto.id, 
      productId: produto.id, 
      nome: produto.name,
      descricao: produto.description,
      preco: produto.precoMinimo,
      stock: produto.totalEstoque,
      categoria: produto.category,
      subcategoria: produto.subcategory,
      loja: produto.listings?.[0]?.stores?.name || 'Loja',
      imagem: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center`
    };
    
    setProdutoSelecionado(produtoFormatado);
    setModalAberto(true);
  };

  // Callback quando uma loja é clicada na busca
  const handleStoreSelect = (loja) => {
    // Navegar para a loja
    const createSlug = (name) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    const slug = createSlug(loja.name);
    window.location.href = `/loja/${slug}`;
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
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
          <SearchSystem 
            onProductSelect={handleProductSelect}
            onStoreSelect={handleStoreSelect}
          />
        </div>
      </div>

      <Categorias
        onCategoriaSelect={handleCategoriaSelect}
        categoriaSelecionada={categoriaSelecionada}
      />

      <Produtos
        categoriaFiltro={categoriaSelecionada === 'Todos' ? null : categoriaSelecionada}
        produtoSelecionado={produtoSelecionado}
        modalAberto={modalAberto}
        onFecharModal={fecharModal}
      />
    </div>
  )
}

export default Header