import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsService, cartService } from '../lib/services';
import { auth } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification';
import './produtos.css';

const ProdutosShowcase = ({ 
  categoriaFiltro,
  produtoSelecionado: produtoSelecionadoExterno,
  modalAberto: modalAbertoExterno,
  onFecharModal: onFecharModalExterno
}) => {
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [quantidades, setQuantidades] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    if (modalAbertoExterno !== undefined) {
      setModalAberto(modalAbertoExterno);
    }
    if (produtoSelecionadoExterno) {
      setProdutoSelecionado(produtoSelecionadoExterno);
    }
  }, [modalAbertoExterno, produtoSelecionadoExterno]);

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
      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

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
            imagem: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center`
          };
        }
      });

      const produtosArray = Object.values(produtosMap);
      setProdutos(produtosArray);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const filtrarProdutos = () => {
    let produtosFiltrados = [...produtos];

    if (categoriaFiltro) {
      produtosFiltrados = produtos.filter(produto => 
        produto.categoria === categoriaFiltro || 
        produto.subcategoria === categoriaFiltro
      );
    }

    if (!categoriaFiltro && produtosFiltrados.length > 30) {
      const shuffled = [...produtosFiltrados].sort(() => 0.5 - Math.random());
      produtosFiltrados = shuffled.slice(0, 30);
    }

    setProdutosFiltrados(produtosFiltrados);
  };

  const carregarQuantidadesCarrinho = async (userId) => {
    try {
      const { data: cart, error } = await cartService.getActiveCart(userId);
      
      if (error && error.code !== 'PGRST116') return;

      if (cart && cart.cart_items) {
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
      let { data: cart, error } = await cartService.getActiveCart(user.id);
      
      if (error || !cart) {
        const { data: newCart, error: createError } = await cartService.createCart(user.id);
        if (createError) {
          console.error('Erro ao criar carrinho:', createError);
          return;
        }
        cart = newCart[0];
      }

      const { error: addError } = await cartService.addToCart(
        cart.id,
        listing.id,
        1
      );

      if (addError) {
        console.error('Erro ao adicionar ao carrinho:', addError);
        return;
      }

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
      if (!cart || !cart.cart_items) return;

      const item = cart.cart_items.find(item => 
        item.product_listing_id === listing.id
      );

      if (!item) return;

      const novaQuantidade = item.quantity - 1;
      const { error: updateError } = await cartService.updateCartItem(
        item.id,
        novaQuantidade
      );

      if (updateError) {
        console.error('Erro ao remover do carrinho:', updateError);
        return;
      }

      setQuantidades(prev => ({
        ...prev,
        [listing.id]: Math.max(0, (prev[listing.id] || 0) - 1)
      }));

    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
    }
  };

  const abrirModal = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
    if (onFecharModalExterno) {
      onFecharModalExterno();
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

  const irParaLoja = (nomeLoja) => {
    const slug = createSlug(nomeLoja);
    navigate(`/loja/${slug}`);
    fecharModal();
  };

  const handleCardClick = (e, produto) => {
    if (e.target.closest('.produto-controles')) {
      return;
    }
    abrirModal(produto);
  };

  if (loading) {
    return (
      <div className="produtos-container">
        <p>Carregando produtos...</p>
      </div>
    );
  }

  if (produtosFiltrados.length === 0) {
    return (
      <div className="produtos-container">
        <div className="produtos-vazio">
          <p>
            {categoriaFiltro 
              ? `Nenhum produto encontrado na categoria "${categoriaFiltro}"` 
              : 'Nenhum produto disponível'
            }
          </p>
        </div>
      </div>
    );
  }

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
            <img 
              src={produto.imagem} 
              alt={produto.nome}
              className="produto-imagem"
            />
            <h3 className="produto-nome">{produto.nome}</h3>
            <p className="produto-preco">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </p>
            
            <div className="produto-controles">
              <button 
                className="btn-carrinho btn-menos"
                onClick={() => removerDoCarrinho(produto)}
                disabled={!quantidades[produto.id] || quantidades[produto.id] === 0}
              >
                -
              </button>
              
              <span className="quantidade-produto">
                {quantidades[produto.id] || 0}
              </span>
              
              <button 
                className="btn-carrinho btn-mais"
                onClick={() => adicionarAoCarrinho(produto)}
                disabled={produto.stock === 0 || (quantidades[produto.id] >= produto.stock)}
              >
                +
              </button>
            </div>

            {produto.stock === 0 && (
              <p className="produto-sem-estoque">Sem estoque</p>
            )}
          </div>
        ))}
      </div>

      {modalAberto && produtoSelecionado && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content-products" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={fecharModal}>×</button>
            
            <div className="modal-body">
              <div className="modal-imagem">
                <img 
                  src={produtoSelecionado.imagem} 
                  alt={produtoSelecionado.nome}
                />
              </div>
              
              <div className="modal-info">
                <h2 className="modal-titulo">{produtoSelecionado.nome}</h2>
                
                <p className="modal-descricao">
                  {produtoSelecionado.descricao || 'Descrição não disponível'}
                </p>
                
                <p className="modal-preco">
                  R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
                </p>
                
                <p className="modal-loja">
                  Vendido por: <strong 
                    onClick={() => irParaLoja(produtoSelecionado.loja)}
                    className="modal-loja-link"
                  >
                    {produtoSelecionado.loja}
                  </strong>
                </p>
                
                <div className="modal-controles">
                  <button 
                    className="btn-carrinho btn-menos"
                    onClick={() => removerDoCarrinho(produtoSelecionado)}
                    disabled={!quantidades[produtoSelecionado.id] || quantidades[produtoSelecionado.id] === 0}
                  >
                    -
                  </button>
                  
                  <span className="quantidade-produto">
                    {quantidades[produtoSelecionado.id] || 0}
                  </span>
                  
                  <button 
                    className="btn-carrinho btn-mais"
                    onClick={() => adicionarAoCarrinho(produtoSelecionado)}
                    disabled={produtoSelecionado.stock === 0 || (quantidades[produtoSelecionado.id] >= produtoSelecionado.stock)}
                  >
                    +
                  </button>
                </div>

                {produtoSelecionado.stock === 0 && (
                  <p className="produto-sem-estoque">Sem estoque</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutosShowcase;