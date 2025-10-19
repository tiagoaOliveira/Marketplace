import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storesService, cartService } from '../lib/services';
import { supabase } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification';
import './PerfilLoja.css';

const PerfilLoja = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();
  const [loja, setLoja] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [quantidades, setQuantidades] = useState({});

  useEffect(() => {
    initialize();
  }, [storeSlug]);

  const initialize = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data: stores } = await storesService.getApprovedStores();
      const lojaEncontrada = stores?.find(s => createSlug(s.name) === storeSlug);

      if (!lojaEncontrada) {
        navigate('/');
        return;
      }

      setLoja(lojaEncontrada);

      const { data: produtosData } = await storesService.getStoreProducts(lojaEncontrada.id);
      setProdutos(produtosData || []);

      if (currentUser) {
        await carregarQuantidadesCarrinho(currentUser.id);
      }
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const carregarQuantidadesCarrinho = async (userId) => {
    try {
      const { data: cart } = await cartService.getActiveCart(userId);
      if (cart?.cart_items) {
        const qtds = {};
        cart.cart_items.forEach(item => {
          qtds[item.product_listing_id] = item.quantity;
        });
        setQuantidades(qtds);
      }
    } catch (error) {
      console.error('Erro ao carregar quantidades:', error);
    }
  };

  const adicionarAoCarrinho = async (listing) => {
    if (!user) {
      showNotification('Faça login para adicionar produtos ao carrinho', 'warning');
      return;
    }

    try {
      let { data: cart } = await cartService.getActiveCart(user.id);
      
      if (!cart) {
        const { data: newCart } = await cartService.createCart(user.id);
        cart = newCart[0];
      }

      await cartService.addToCart(cart.id, listing.id, 1, listing.price);

      setQuantidades(prev => ({
        ...prev,
        [listing.id]: (prev[listing.id] || 0) + 1
      }));
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };

  const removerDoCarrinho = async (listing) => {
    if (!user) return;

    try {
      const { data: cart } = await cartService.getActiveCart(user.id);
      if (!cart?.cart_items) return;

      const item = cart.cart_items.find(i => i.product_listing_id === listing.id);
      if (!item) return;

      await cartService.updateCartItem(item.id, item.quantity - 1);

      setQuantidades(prev => ({
        ...prev,
        [listing.id]: Math.max(0, (prev[listing.id] || 0) - 1)
      }));
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
    }
  };

  const handleVoltar = () => {
    window.history.back();
  };

  if (loading) {
    return <div className="perfil-loja-container">Carregando...</div>;
  }

  if (!loja) {
    return <div className="perfil-loja-container">Loja não encontrada</div>;
  }

  return (
    <div className="perfil-loja-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="loja-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          ←
        </button>
        <div className="loja-info">
          <h1 className="loja-nome">{loja.name}</h1>
          {loja.description && (
            <p className="loja-descricao">{loja.description}</p>
          )}
          <div className="loja-detalhes">
            {loja.email && (
              <span className="loja-contato">📧 {loja.email}</span>
            )}
            {loja.phone && (
              <span className="loja-contato">📞 {loja.phone}</span>
            )}
          </div>
        </div>
      </div>

      <div className="loja-produtos-section">        
        {produtos.length === 0 ? (
          <p className="sem-produtos">Esta loja ainda não possui produtos cadastrados.</p>
        ) : (
          <div className="produtos-grid">
            {produtos.map(listing => (
              <div key={listing.id} className="produto-card">
                <img 
                  src={`https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop`}
                  alt={listing.products.name}
                  className="produto-imagem"
                />
                <h3 className="produto-nome">{listing.products.name}</h3>
                {listing.products.description && (
                  <p className="produto-descricao">{listing.products.description}</p>
                )}
                <p className="produto-preco">
                  R$ {parseFloat(listing.price).toFixed(2).replace('.', ',')}
                </p>
                
                <div className="produto-controles">
                  <button 
                    className="btn-carrinho"
                    onClick={() => removerDoCarrinho(listing)}
                    disabled={!quantidades[listing.id]}
                  >
                    -
                  </button>
                  
                  <span className="quantidade-produto">
                    {quantidades[listing.id] || 0}
                  </span>
                  
                  <button 
                    className="btn-carrinho"
                    onClick={() => adicionarAoCarrinho(listing)}
                    disabled={listing.stock === 0 || (quantidades[listing.id] >= listing.stock)}
                  >
                    +
                  </button>
                </div>

                {listing.stock === 0 && (
                  <p className="produto-sem-estoque">Sem estoque</p>
                )}
                {listing.stock > 0 && listing.stock < 10 && (
                  <p className="produto-estoque-baixo">
                    Apenas {listing.stock} em estoque
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilLoja;