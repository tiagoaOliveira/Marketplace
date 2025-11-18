import { useState, useEffect } from 'react'
import { Search, User, Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'
import SearchSystem from './SearchSystem'
import Produtos from './Produtos'
import { supabase } from '../lib/supabase'
import Carrossel from "./Carrossel"
import { useSlug } from '../hooks/useSlug' // 1. Importação do hook

function Header({ user }) {
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const { createSlug } = useSlug(); // 2. Uso do hook

  useEffect(() => {
    if (user) {
      carregarPedidosPendentes();

      // Configurar listener Realtime para mudanças em orders
      const subscription = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            // Recarregar contagem quando houver qualquer mudança
            carregarPedidosPendentes();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const carregarPedidosPendentes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-pending-orders-count', {
        body: {}
      })

      if (error) {
        console.error('Erro ao carregar pendentes:', error)
        return
      }

      setPedidosPendentes(data?.count || 0)
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error)
    }
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
      imagem: produto.images?.[0]
    };

    setProdutoSelecionado(produtoFormatado);
    setModalAberto(true);
  };

  const handleStoreSelect = (loja) => {
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
            onProductSelect={handleProductSelect}
            onStoreSelect={handleStoreSelect}
          />
        </div>
        <Carrossel />
      </div>

      <Produtos
        produtoSelecionado={produtoSelecionado}
        modalAberto={modalAberto}
        onFecharModal={fecharModal}
      />
    </div>
  )
}

export default Header