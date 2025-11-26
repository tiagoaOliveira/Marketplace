import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsService, cartService } from '../lib/services';
import { auth } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification';
import { useProductModalContext } from '../contexts/ProductModalContext.jsx';
import './produtos.css';
import { useSlug } from '../hooks/useSlug';

const ProdutosShowcase = ({ categoriaFiltro }) => {
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();
  const { createSlug } = useSlug();
  const { abrirModalProduto } = useProductModalContext();

  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [quantidades, setQuantidades] = useState({});

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await auth.getUser();
        setUser(currentUser);
        await carregarProdutos();
        if (currentUser) {
          await carregarQuantidadesCarrinho(currentUser.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    filtrarProdutos();
  }, [produtos, categoriaFiltro]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await listingsService.getActiveListings();
      if (error) return;

      const produtosMap = {};
      data.forEach(listing => {
        const productId = listing.products.id;
        if (!produtosMap[productId] || listing.price < produtosMap[productId].price) {
          produtosMap[productId] = {
            id: listing.id,
            productId: productId,
            nome: listing.products.name,
            descricao: listing.products.description,
            preco: parseFloat(listing.price),
            stock: listing.stock,
            categoria: listing.products.category,
            subcategoria: listing.products.subcategory,
            loja: listing.stores.name,
            imagem: listing.products.images?.[0],
            images: listing.products.images || []
          };
        }
      });
      setProdutos(Object.values(produtosMap));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const filtrarProdutos = () => {
    let filtrados = [...produtos];
    if (categoriaFiltro) {
      filtrados = produtos.filter(produto =>
        produto.categoria === categoriaFiltro || produto.subcategoria === categoriaFiltro
      );
    }
    if (!categoriaFiltro && filtrados.length > 30) {
      const shuffled = [...filtrados].sort(() => 0.5 - Math.random());
      filtrados = shuffled.slice(0, 30);
    }
    setProdutosFiltrados(filtrados);
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
    } catch (e) {
      console.error(e);
    }
  };

  const adicionarAoCarrinho = useCallback(async (listing) => {
    if (!user) {
      showNotification('Faça login para adicionar ao carrinho', 'warning');
      return;
    }
    try {
      let { data: cart } = await cartService.getActiveCart(user.id);
      if (!cart) {
        const { data: newCart } = await cartService.createCart(user.id);
        cart = newCart[0];
      }
      await cartService.addToCart(cart.id, listing.id, 1);
      
      // Atualiza o estado localmente
      setQuantidades(prev => {
        const novaQuantidade = (prev[listing.id] || 0) + 1;
        return { ...prev, [listing.id]: novaQuantidade };
      });
    } catch (error) {
      console.error(error);
    }
  }, [user, showNotification]);

  const removerDoCarrinho = useCallback(async (listing) => {
    if (!user) return;
    try {
      const { data: cart } = await cartService.getActiveCart(user.id);
      const item = cart?.cart_items?.find(i => i.product_listing_id === listing.id);
      if (!item) return;

      await cartService.updateCartItem(item.id, item.quantity - 1);
      
      // Atualiza o estado localmente
      setQuantidades(prev => {
        const novaQuantidade = Math.max(0, (prev[listing.id] || 0) - 1);
        return { ...prev, [listing.id]: novaQuantidade };
      });
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const irParaLoja = useCallback((nomeLoja) => {
    const slug = createSlug(nomeLoja);
    navigate(`/loja/${slug}`);
  }, [navigate, createSlug]);

  // IMPORTANTE: renderControls precisa ser estável para não causar re-render
  const renderControls = useCallback((produto) => (
    <>
      <button
        className="btn-carrinho btn-menos"
        onClick={(e) => {
          e.stopPropagation();
          removerDoCarrinho(produto);
        }}
        disabled={!quantidades[produto.id]}
      >
        -
      </button>
      <span className="quantidade-produto">{quantidades[produto.id] || 0}</span>
      <button
        className="btn-carrinho btn-mais"
        onClick={(e) => {
          e.stopPropagation();
          adicionarAoCarrinho(produto);
        }}
        disabled={produto.stock === 0 || (quantidades[produto.id] >= produto.stock)}
      >
        +
      </button>
    </>
  ), [quantidades, adicionarAoCarrinho, removerDoCarrinho]);

  const handleCardClick = (e, produto) => {
    if (e.target.closest('.produto-controles')) return;
    
    abrirModalProduto(produto, {
      showControls: true,
      renderControls,
      onStoreClick: irParaLoja
    });
  };

  if (loading) return <div className="produtos-container">Carregando...</div>;

  return (
    <div className="produtos-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="produtos-grid">
        {produtosFiltrados.map(produto => (
          <div
            key={produto.id}
            className="produto-card"
            onClick={(e) => handleCardClick(e, produto)}
          >
            <img src={produto.imagem} alt={produto.nome} className="produto-imagem" />
            <h3 className="produto-nome-produtos">{produto.nome}</h3>
            <p className="produto-preco">R$ {produto.preco.toFixed(2).replace('.', ',')}</p>

            <div className="produto-controles">
              <button
                className="btn-carrinho btn-menos"
                onClick={(e) => {
                  e.stopPropagation();
                  removerDoCarrinho(produto);
                }}
                disabled={!quantidades[produto.id]}
              >
                -
              </button>
              <span className="quantidade-produto">{quantidades[produto.id] || 0}</span>
              <button
                className="btn-carrinho btn-mais"
                onClick={(e) => {
                  e.stopPropagation();
                  adicionarAoCarrinho(produto);
                }}
                disabled={produto.stock === 0 || (quantidades[produto.id] >= produto.stock)}
              >
                +
              </button>
            </div>

            {produto.stock === 0 && <p className="produto-sem-estoque">Sem estoque</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProdutosShowcase;