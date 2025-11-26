import { useState, useEffect } from 'react'
import { Search, User, ShoppingCart } from 'lucide-react' // Removi Heart se não for usado
import { Link } from 'react-router-dom'
import './Header.css'
import SearchSystem from './SearchSystem'
import Produtos from './Produtos'
import { supabase } from '../lib/supabase'
import Carrossel from "./Carrossel"
import { useSlug } from '../hooks/useSlug'
import { useProductModalContext } from '../contexts/ProductModalContext' 

function Header({ user }) {
  // Removido: States locais de modal (produtoSelecionado, modalAberto)
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  
  const { createSlug } = useSlug();
  
  // 2. Usar o contexto para pegar a função de abrir e o componente do Modal
  const { abrirModalProduto, ProductModal } = useProductModalContext();

  useEffect(() => {
    if (user) {
      carregarPedidosPendentes();

      const subscription = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => { carregarPedidosPendentes(); }
        )
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [user]);

  const carregarPedidosPendentes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-pending-orders-count', { body: {} })
      if (!error) setPedidosPendentes(data?.count || 0)
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error)
    }
  };

  // Removido: handleProductSelect (A lógica de formatação já existe dentro de abrirModalProduto no Context)

  const handleStoreSelect = (loja) => {
    const slug = createSlug(loja.name);
    window.location.href = `/loja/${slug}`;
  };

  // Removido: fecharModal (Gerenciado pelo Context)

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
            {pedidosPendentes > 0 && (
              <span className="header-btn-badge">
                {pedidosPendentes > 99 ? '99+' : pedidosPendentes}
              </span>
            )}
          </Link>
          <Link to="Carrinho" className="header-btn">
            <ShoppingCart size={28} />
          </Link>
        </div>
      </div>

      <div className="header-search">
        <div className="search-wrapper">

          <SearchSystem
            onProductSelect={abrirModalProduto}
            onStoreSelect={handleStoreSelect}
          />
        </div>
        <Carrossel />
      </div>

      {/* Nota: Você precisará ajustar o componente Produtos para aceitar `onProdutoClick` ao invés de controlar o modal ele mesmo */}
      <Produtos
        onProdutoClick={abrirModalProduto}
      />
    </div>
  )
}

export default Header