import React, { useState, useEffect } from 'react';
import { cartService } from '../lib/services';
import { auth, supabase } from '../lib/supabase';
import './Carrinho.css';

const CarrinhoCompras = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(false);
  const [modalErro, setModalErro] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    const initializeCart = async () => {
      try {
        const currentUser = await auth.getUser();
        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);
        await carregarCarrinho(currentUser.id);
      } catch (error) {
        console.error('Erro ao inicializar carrinho:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, []);

  const carregarCarrinho = async (userId) => {
    try {
      const { data: cart, error } = await cartService.getActiveCart(userId);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar carrinho:', error);
        return;
      }

      if (cart && cart.cart_items) {
        setCartId(cart.id);
        const itens = cart.cart_items.map(item => ({
          id: item.id,
          cartId: cart.id,
          productListingId: item.product_listing_id,
          nome: item.product_listings.products.name,
          descricao: item.product_listings.products.description,
          preco: parseFloat(item.product_listings.price),
          quantidade: item.quantity,
          stock: item.product_listings.stock,
          storeName: item.product_listings.stores.name,
          storeId: item.product_listings.store_id,
          imagem: item.product_listings.products.image_url || `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center`
        }));
        setItensCarrinho(itens);
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  };

  const handleVoltar = () => {
    window.history.back();
  };

  const removerItem = async (itemId) => {
    try {
      const { error } = await cartService.removeCartItem(itemId);
      if (error) {
        console.error('Erro ao remover item:', error);
        return;
      }

      setItensCarrinho(itens => itens.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const alterarQuantidade = async (itemId, novaQuantidade) => {
    try {
      const { error } = await cartService.updateCartItem(itemId, novaQuantidade);
      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        return;
      }

      if (novaQuantidade <= 0) {
        setItensCarrinho(itens => itens.filter(item => item.id !== itemId));
      } else {
        setItensCarrinho(itens => 
          itens.map(item => 
            item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
          )
        );
      }
    } catch (error) {
      console.error('Erro ao alterar quantidade:', error);
    }
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => 
      total + (item.preco * item.quantidade), 0
    );
  };

  const finalizarCompra = async () => {
    if (!user || itensCarrinho.length === 0) return;

    setFinalizando(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('fullname, email, phone, cep, rua, numero, bairro, cidade')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao obter dados do usuário:', userError);
        setMensagemErro('Erro ao carregar seus dados. Tente novamente.');
        setModalErro(true);
        setFinalizando(false);
        return;
      }

      const totalAmount = calcularTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            buyer_name: userData.fullname || user.email,
            buyer_email: userData.email,
            buyer_phone: userData.phone,
            buyer_cep: userData.cep,
            buyer_rua: userData.rua,
            buyer_numero: userData.numero,
            buyer_bairro: userData.bairro,
            buyer_cidade: userData.cidade,
            total_amount: totalAmount
          }
        ])
        .select();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        setMensagemErro('Erro ao criar o pedido. Tente novamente.');
        setModalErro(true);
        setFinalizando(false);
        return;
      }

      const orderId = order[0].id;
      setOrderId(orderId);

      const orderItems = itensCarrinho.map(item => ({
        order_id: orderId,
        product_listing_id: item.productListingId,
        product_name: item.nome,
        store_id: item.storeId,
        store_name: item.storeName,
        price: item.preco,
        quantity: item.quantidade,
        subtotal: item.preco * item.quantidade
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erro ao adicionar itens do pedido:', itemsError);
        setMensagemErro('Erro ao processar itens do pedido. Tente novamente.');
        setModalErro(true);
        setFinalizando(false);
        return;
      }

      if (cartId) {
        await cartService.clearCart(cartId);
      }
      setItensCarrinho([]);

      setModalSucesso(true);

    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      setMensagemErro('Erro ao finalizar compra. Tente novamente.');
      setModalErro(true);
    } finally {
      setFinalizando(false);
    }
  };

  const handleFecharModalSucesso = () => {
    setModalSucesso(false);
    window.location.href = '/';
  };

  const abrirModal = (item) => {
    setProdutoSelecionado({
      id: item.productListingId,
      nome: item.nome,
      descricao: item.descricao || 'Descrição não disponível',
      preco: item.preco,
      stock: item.stock,
      storeName: item.storeName,
      imagem: item.imagem
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
  };

  const agruparPorLoja = () => {
    const agrupado = {};
    itensCarrinho.forEach(item => {
      if (!agrupado[item.storeId]) {
        agrupado[item.storeId] = {
          storeName: item.storeName,
          items: []
        };
      }
      agrupado[item.storeId].items.push(item);
    });
    return agrupado;
  };

  const handleItemClick = (e, item) => {
    if (e.target.closest('.item-controles') || e.target.closest('.btn-remover')) {
      return;
    }
    abrirModal(item);
  };

  if (loading) {
    return (
      <div className="carrinho-container">
        <div className="carrinho-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            ←
          </button>
          <h1>Carrinho de Compras</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="carrinho-container">
        <div className="carrinho-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            ←
          </button>
          <h1>Carrinho de Compras</h1>
        </div>
        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icone">🔒</div>
          <h2>Faça login para ver seu carrinho</h2>
          <p>Você precisa estar logado para acessar o carrinho!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho-container">
      <div className="carrinho-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          ←
        </button>
        <h1>Carrinho de Compras</h1>
      </div>

      {itensCarrinho.length === 0 ? (
        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icone">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione alguns produtos ao seu carrinho!</p>
        </div>
      ) : (
        <div className="carrinho-conteudo">
          <div className="carrinho-itens">
            {Object.entries(agruparPorLoja()).map(([storeId, { storeName, items }]) => (
              <div key={storeId} className="loja-grupo">
                <div className="loja-cabecalho">
                  <h2 className="loja-nome">🪴 {storeName}</h2>
                </div>
                <div className="loja-produtos">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="carrinho-item"
                      onClick={(e) => handleItemClick(e, item)}
                    >
                      <img 
                        src={item.imagem} 
                        alt={item.nome}
                        className="item-imagem"
                      />
                      <div className="item-detalhes">
                        <h3 className="item-nome">{item.nome}</h3>
                        <p className="item-preco">
                          R$ {item.preco.toFixed(2).replace('.', ',')}
                        </p>
                        <div className="item-controles">
                          <div className="quantidade-controles">
                            <button 
                              className="btn-quantidade"
                              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                            >
                              -
                            </button>
                            <span className="quantidade">{item.quantidade}</span>
                            <button 
                              className="btn-quantidade"
                              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                              disabled={item.quantidade >= item.stock}
                            >
                              +
                            </button>
                          </div>
                          <button 
                            className="btn-remover"
                            onClick={() => removerItem(item.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="carrinho-resumo">
            <div className="resumo-card">
              <h3>Resumo do Pedido</h3>
              <div className="resumo-linha">
                <span>Subtotal:</span>
                <span>R$ {calcularTotal().toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="resumo-linha">
                <span>Frete:</span>
                <span>Grátis</span>
              </div>
              <div className="resumo-total">
                <span>Total:</span>
                <span>R$ {calcularTotal().toFixed(2).replace('.', ',')}</span>
              </div>
              <button 
                className="btn btn-primary btn-lg carrinho-finalizar"
                onClick={finalizarCompra}
                disabled={finalizando}
              >
                {finalizando ? 'Processando...' : 'Finalizar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Produto */}
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
                  {produtoSelecionado.descricao}
                </p>
                
                <p className="modal-preco">
                  R$ {produtoSelecionado.preco.toFixed(2).replace('.', ',')}
                </p>
                
                <p className="modal-loja">
                  Vendido por: <strong>{produtoSelecionado.storeName}</strong>
                </p>
                
                {produtoSelecionado.stock === 0 && (
                  <p className="produto-sem-estoque">Sem estoque</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {modalSucesso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Compra Finalizada!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu pedido foi processado com sucesso.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">ID do Pedido</p>
              <p className="text-lg font-mono font-bold text-gray-900 break-all">
                {orderId}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Você receberá um email de confirmação em breve.
            </p>
            <button
              onClick={handleFecharModalSucesso}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {modalErro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Erro na Compra
              </h2>
              <button
                onClick={() => setModalErro(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {mensagemErro}
            </p>
            <button
              onClick={() => setModalErro(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrinhoCompras;