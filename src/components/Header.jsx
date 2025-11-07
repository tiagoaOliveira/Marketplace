import { useState, useEffect } from 'react'
import { Search, User, Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'
import SearchSystem from './SearchSystem'
import Produtos from './Produtos'
import Categorias from './Categorias'
import { supabase } from '../lib/supabase'

function Header({ user }) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);

  useEffect(() => {
    if (user) {
      carregarPedidosPendentes();
      
      // Configurar listener Realtime para mudanças em order_items
      const subscription = supabase
        .channel('order_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'order_items'
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
      // Verificar se o usuário é vendedor
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id);

      if (stores && stores.length > 0) {
        // É vendedor - contar itens pendentes
        const storeIds = stores.map(s => s.id);
        
        const { data: items, error } = await supabase
          .from('order_items')
          .select('id')
          .in('store_id', storeIds)
          .eq('status', 'pendente');

        if (!error && items) {
          setPedidosPendentes(items.length);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error);
    }
  };

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
      imagem: produto.images?.[0]
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