import { createContext, useContext, useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { cartService } from '../lib/services';
import { auth } from '../lib/supabase';

const ProductModalContext = createContext();

export const ProductModalProvider = ({ children }) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modalOptions, setModalOptions] = useState({});
  
  const [user, setUser] = useState(null);
  const [quantidades, setQuantidades] = useState({});
  const [cartId, setCartId] = useState(null);
  const [recarregando, setRecarregando] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await auth.getUser();
        setUser(currentUser);
        
        if (currentUser) {
          await carregarQuantidadesCarrinho(currentUser.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar contexto:', error);
      }
    };
    
    initialize();
  }, []);



  const carregarQuantidadesCarrinho = useCallback(async (userId) => {
    if (recarregando) return;
    
    try {
      setRecarregando(true);
      const { data: cart, error } = await cartService.getActiveCart(userId);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar carrinho:', error);
        return;
      }
      
      if (cart) {
        setCartId(cart.id);
        
        if (cart.cart_items) {
          const qtds = {};
          cart.cart_items.forEach(item => {
            qtds[item.product_listing_id] = item.quantity;
          });
          setQuantidades(qtds);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar quantidades:', error);
    } finally {
      setRecarregando(false);
    }
  }, [recarregando]);

  const recarregarCarrinho = useCallback(async () => {
    if (user) {
      await carregarQuantidadesCarrinho(user.id);
    }
  }, [user, carregarQuantidadesCarrinho]);

  const adicionarAoCarrinho = useCallback(async (produto) => {
    if (!user) {
      alert('Faça login para adicionar produtos ao carrinho');
      return false;
    }

    try {
      let currentCartId = cartId;
      
      if (!currentCartId) {
        const { data: newCart, error: cartError } = await cartService.createCart(user.id);
        if (cartError) throw cartError;
        currentCartId = newCart[0].id;
        setCartId(currentCartId);
      }

      const listingId = produto.productListingId || produto.id;
      const price = parseFloat(produto.preco || produto.price || 0);

      const quantidadeAtual = quantidades[listingId] || 0;
      
      if (quantidadeAtual > 0) {
        const { data: cart } = await cartService.getActiveCart(user.id);
        const item = cart?.cart_items?.find(i => i.product_listing_id === listingId);
        
        if (item) {
          const { error } = await cartService.updateCartItem(item.id, item.quantity + 1);
          if (error) throw error;
        }
      } else {
        const { error } = await cartService.addToCart(currentCartId, listingId, 1, price);
        if (error) throw error;
      }

      setQuantidades(prev => ({
        ...prev,
        [listingId]: quantidadeAtual + 1
      }));

      return true;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      alert('Erro ao adicionar produto. Tente novamente.');
      await recarregarCarrinho();
      return false;
    }
  }, [user, cartId, quantidades, recarregarCarrinho]);

  const removerDoCarrinho = useCallback(async (produto) => {
    if (!user) return false;

    try {
      const { data: cart, error: cartError } = await cartService.getActiveCart(user.id);
      if (cartError) throw cartError;
      if (!cart?.cart_items) return false;

      const listingId = produto.productListingId || produto.id;
      const item = cart.cart_items.find(i => i.product_listing_id === listingId);
      
      if (!item) return false;

      const novaQuantidade = item.quantity - 1;
      const { error } = await cartService.updateCartItem(item.id, novaQuantidade);
      if (error) throw error;

      setQuantidades(prev => ({
        ...prev,
        [listingId]: Math.max(0, novaQuantidade)
      }));

      return true;
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      await recarregarCarrinho();
      return false;
    }
  }, [user, recarregarCarrinho]);

  const getQuantidade = useCallback((produto) => {
    if (!produto) return 0;
    const listingId = produto.productListingId || produto.id;
    return quantidades[listingId] || 0;
  }, [quantidades]);

  const abrirModalProduto = useCallback((produto, options = {}) => {
    if (!produto) return;

    const images = produto.images && Array.isArray(produto.images) && produto.images.length > 0
      ? produto.images
      : [produto.imagem].filter(Boolean);

    const produtoNormalizado = {
      id: produto.id || produto.listings?.[0]?.id,
      productId: produto.productId || produto.id,
      productListingId: produto.productListingId || produto.id,
      nome: produto.nome || produto.name,
      descricao: produto.descricao || produto.description,
      preco: parseFloat(produto.preco || produto.precoMinimo || produto.price || 0),
      stock: produto.stock || produto.totalEstoque || 0,
      categoria: produto.categoria || produto.category,
      subcategoria: produto.subcategoria || produto.subcategory,
      loja: produto.loja || produto.storeName || produto.listings?.[0]?.stores?.name,
      storeId: produto.storeId || produto.listings?.[0]?.store_id,
      imagem: images[0],
      images: images
    };

    setProdutoSelecionado(produtoNormalizado);
    setModalOptions(options);
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAberto(false);
    setProdutoSelecionado(null);
    setModalOptions({});
  }, []);

  return (
    <ProductModalContext.Provider value={{ 
      abrirModalProduto, 
      fecharModal,
      modalAberto, 
      produtoSelecionado,
      adicionarAoCarrinho,
      removerDoCarrinho,
      getQuantidade,
      recarregarCarrinho,
      quantidades,
      user
    }}>
      {children}
      {modalAberto && produtoSelecionado && (
        <ProductModalComponent
          produto={produtoSelecionado}
          onClose={fecharModal}
          onAdicionar={adicionarAoCarrinho}
          onRemover={removerDoCarrinho}
          quantidade={getQuantidade(produtoSelecionado)}
          {...modalOptions}
        />
      )}
    </ProductModalContext.Provider>
  );
};

// ============ HOOK ============
export const useProductModalContext = () => {
  const context = useContext(ProductModalContext);
  if (!context) {
    throw new Error('useProductModalContext deve ser usado dentro de ProductModalProvider');
  }
  return context;
};

// ============ COMPONENTE DO MODAL ============
const ProductModalComponent = memo(({ 
  produto, 
  onClose,
  onAdicionar,
  onRemover,
  quantidade,
  onStoreClick,
  showControls = true
}) => {
  const [imagemAtual, setImagemAtual] = useState(0);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    setImagemAtual(0);
  }, [produto?.id]);

  if (!produto) return null;

  const imagens = (produto.images && produto.images.length > 0) 
    ? produto.images 
    : [produto.imagem].filter(Boolean);
  
  const temMultiplasImagens = imagens.length > 1;

  const proximaImagem = () => {
    setImagemAtual((prev) => (prev + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  const handleAdicionar = async (e) => {
    e.stopPropagation();
    if (processando) return;
    
    setProcessando(true);
    await onAdicionar(produto);
    setProcessando(false);
  };

  const handleRemover = async (e) => {
    e.stopPropagation();
    if (processando) return;
    
    setProcessando(true);
    await onRemover(produto);
    setProcessando(false);
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-products" onClick={(e) => e.stopPropagation()}>
        <button className="modal-fechar" onClick={onClose}>×</button>

        <div className="modal-body">
          <div className="modal-imagem">
            {imagens[0] ? (
              <img
                src={imagens[imagemAtual]}
                alt={`${produto.nome} - ${imagemAtual + 1}`}
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Sem imagem</text></svg>';
                }}
              />
            ) : (
              <div className="img-fallback">Sem imagem</div>
            )}
            
            {temMultiplasImagens && (
              <>
                <button 
                  className="modal-img-nav modal-img-prev" 
                  onClick={(e) => { e.stopPropagation(); imagemAnterior(); }}
                >
                  ‹
                </button>
                <button 
                  className="modal-img-nav modal-img-next" 
                  onClick={(e) => { e.stopPropagation(); proximaImagem(); }}
                >
                  ›
                </button>
                <div className="modal-img-indicators">
                  {imagens.map((_, index) => (
                    <button
                      key={index}
                      className={`modal-img-dot ${index === imagemAtual ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setImagemAtual(index); }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="modal-info">
            <h2 className="modal-titulo">{produto.nome}</h2>
            <p>{produto.descricao}</p>

            {produto.loja && (
              <p className="modal-loja">
                Vendido por:  
                <strong 
                  onClick={() => {
                    if (onStoreClick) {
                      onStoreClick(produto.loja || produto.storeName);
                      onClose();
                    }
                  }}
                  className={onStoreClick ? 'store-clickable' : ''}
                >
                  {produto.loja || produto.storeName}
                </strong>
              </p>
            )}

            <p className="modal-preco">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </p>

            {showControls && (
              <div className="modal-controles">
                <button
                  className="btn-carrinho btn-remover"
                  onClick={handleRemover}
                  disabled={!quantidade || processando}
                >
                  -
                </button>

                <span className="quantidade-produto">
                  {quantidade || 0}
                </span>

                <button
                  className="btn-carrinho btn-adicionar"
                  onClick={handleAdicionar}
                  disabled={produto.stock === 0 || (quantidade >= produto.stock) || processando}
                >
                  +
                </button>
              </div>
            )}

            {produto.stock === 0 && (
              <p className="produto-sem-estoque">
                Sem estoque
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

ProductModalComponent.displayName = 'ProductModalComponent';
