// Carrinho.jsx - SIMPLIFICADO E SINCRONIZADO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../lib/services';
import { auth, supabase } from '../lib/supabase';
import { useProductModalContext } from '../contexts/ProductModalContext.jsx';
import './Carrinho.css';
import { RxArrowLeft } from "react-icons/rx";
import { FaTrash } from "react-icons/fa";
import { useSlug } from '../hooks/useSlug';

const CarrinhoCompras = () => {
  const navigate = useNavigate();
  
  // ✅ Usar contexto para tudo relacionado ao carrinho
  const { abrirModalProduto, getQuantidade, adicionarAoCarrinho, removerDoCarrinho, recarregarCarrinho } = useProductModalContext();
  const { createSlug } = useSlug();

  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(false);
  const [modalErro, setModalErro] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [showPerfilIncompleto, setShowPerfilIncompleto] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState(null);

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
          stock: item.product_listings.stock,
          storeName: item.product_listings.stores.name,
          storeId: item.product_listings.store_id,
          imagem: item.product_listings.products.images?.[0],
          images: item.product_listings.products.images
        }));
        setItensCarrinho(itens);
        await recarregarCarrinho();
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
      await recarregarCarrinho();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => {
      const qtd = getQuantidade({ productListingId: item.productListingId });
      return total + (item.preco * qtd);
    }, 0);
  };

  const verificarPerfilCompleto = (userData) => {
    const camposObrigatorios = ['phone', 'cep', 'cidade', 'bairro', 'rua', 'numero'];
    return camposObrigatorios.every(campo => userData[campo]);
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

      if (!verificarPerfilCompleto(userData)) {
        setShowPerfilIncompleto(true);
        setFinalizando(false);
        return;
      }

      setDadosUsuario(userData);
      setShowConfirmacao(true);
      setFinalizando(false);

    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      setMensagemErro('Erro ao finalizar compra. Tente novamente.');
      setModalErro(true);
      setFinalizando(false);
    }
  };

  const confirmarPedido = async () => {
    setFinalizando(true);
    setShowConfirmacao(false);

    try {
      const totalAmount = calcularTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          buyer_name: dadosUsuario.fullname || user.email,
          buyer_phone: dadosUsuario.phone,
          buyer_cep: dadosUsuario.cep,
          buyer_rua: dadosUsuario.rua,
          buyer_numero: dadosUsuario.numero,
          buyer_bairro: dadosUsuario.bairro,
          buyer_cidade: dadosUsuario.cidade,
          total_amount: totalAmount
        }])
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

      const orderItems = itensCarrinho.map(item => {
        const qtd = getQuantidade({ productListingId: item.productListingId });
        return {
          order_id: orderId,
          product_listing_id: item.productListingId,
          product_name: item.nome,
          store_id: item.storeId,
          store_name: item.storeName,
          price: item.preco,
          quantity: qtd,
          subtotal: item.preco * qtd
        };
      });

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
      await recarregarCarrinho();

    } catch (error) {
      console.error('Erro ao confirmar pedido:', error);
      setMensagemErro('Erro ao confirmar pedido. Tente novamente.');
      setModalErro(true);
    } finally {
      setFinalizando(false);
    }
  };

  const handleFecharModalSucesso = () => {
    setModalSucesso(false);
    window.location.href = '/';
  };

  const handleItemClick = (e, item) => {
    if (e.target.closest('.item-controles') || e.target.closest('.btn-remover')) return;
    
    abrirModalProduto({
      id: item.productListingId,
      productListingId: item.productListingId,
      nome: item.nome,
      preco: item.preco,
      stock: item.stock,
      loja: item.storeName,
      storeId: item.storeId,
      imagem: item.imagem,
      images: item.images || [item.imagem]
    }, {
      showControls: true,
      onStoreClick: irParaLoja
    });
  };

  const irParaLoja = (nomeLoja) => {
    const slug = createSlug(nomeLoja);
    navigate(`/loja/${slug}`);
  };

  const irParaPerfil = () => {
    navigate('/perfil');
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

  if (loading) {
    return (
      <div className="carrinho-container">
        <div className="carrinho-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            <RxArrowLeft />
          </button>
          <h1>Carrinho de Compras</h1>
        </div>
        <div></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="carrinho-container">
        <div className="carrinho-header">
          <button className="btn-voltar" onClick={handleVoltar}>
            <RxArrowLeft />
          </button>
          <h1>Carrinho de Compras</h1>
        </div>
        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icone">🔒</div>
          <h2>Faça login para ver seu carrinho</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho-container">
      <div className="carrinho-header">
        <button className="btn-voltar" onClick={handleVoltar}>
          <RxArrowLeft />
        </button>
        <h1>Carrinho de Compras</h1>
      </div>

      {showPerfilIncompleto && (
        <div className="modal-perfil-incompleto">
          <div className="modal-perfil-content">
            <button className="modal-perfil-fechar" onClick={() => setShowPerfilIncompleto(false)}>×</button>
            <div className="modal-perfil-icone">⚠️</div>
            <h2>Complete seu Endereço</h2>
            <div className="seta-animada">
              <span>Clique aqui para completar</span>
              <span className="seta">👇</span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={irParaPerfil}>
              Completar Cadastro
            </button>
          </div>
        </div>
      )}

      {showConfirmacao && dadosUsuario && (
        <div className="modal-perfil-incompleto">
          <div className="modal-perfil-content modal-confirmacao">
            <button className="modal-perfil-fechar" onClick={() => setShowConfirmacao(false)}>×</button>
            <div className="modal-perfil-icone">📋</div>
            <h2>Confirme seus Dados</h2>
            <div className="campos-faltando">
              <div className="campo-info">
                <strong>Nome:</strong>
                <p>{dadosUsuario.fullname}</p>
              </div>
              <div className="campo-info">
                <strong>Telefone:</strong>
                <p>{dadosUsuario.phone}</p>
              </div>
              <div className="campo-info">
                <strong>Endereço:</strong>
                <p>{dadosUsuario.rua}, {dadosUsuario.numero}<br />
                   {dadosUsuario.bairro} - {dadosUsuario.cidade}<br />
                   CEP: {dadosUsuario.cep}</p>
              </div>
            </div>
            <div className="modal-buttons-carrinho">
              <button className="btn btn-secondary" onClick={() => setShowConfirmacao(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={confirmarPedido} disabled={finalizando}>
                {finalizando ? 'Processando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {itensCarrinho.length === 0 ? (
        <div className="carrinho-vazio">
          <div className="carrinho-vazio-icone">🛒</div>
          <h2>Seu carrinho está vazio</h2>
        </div>
      ) : (
        <div className="carrinho-conteudo">
          <div className="carrinho-itens">
            {Object.entries(agruparPorLoja()).map(([storeId, { storeName, items }]) => (
              <div key={storeId} className="loja-grupo">
                <div className="loja-cabecalho">
                  <h2 className="loja-nome2">{storeName}</h2>
                </div>
                <div className="loja-produtos">
                  {items.map(item => {
                    const quantidade = getQuantidade({ productListingId: item.productListingId });
                    const produto = { id: item.productListingId, productListingId: item.productListingId, preco: item.preco, stock: item.stock };
                    
                    return (
                      <div key={item.id} className="carrinho-item" onClick={(e) => handleItemClick(e, item)}>
                        <img src={item.imagem} alt={item.nome} className="item-imagem2" />
                        <div className="item-detalhes">
                          <div className='item-detalhes-header'>
                            <h3 className="item-nome">{item.nome}</h3>
                            <div className='precos'>
                              <p className="item-preco">R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                              <p className="item-preco2">(R$ {(item.preco * quantidade).toFixed(2).replace('.', ',')})</p>
                            </div>
                          </div>
                          <div className="item-controles">
                            <div className="quantidade-controles">
                              <button className="btn-quantidade" onClick={(e) => { e.stopPropagation(); removerDoCarrinho(produto); }}>-</button>
                              <span className="quantidade">{quantidade}</span>
                              <button className="btn-quantidade" onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(produto); }} disabled={quantidade >= item.stock}>+</button>
                            </div>
                            <button className="btn-remover" onClick={(e) => { e.stopPropagation(); removerItem(item.id); }}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              <button className="btn btn-primary btn-lg carrinho-finalizar" onClick={finalizarCompra} disabled={finalizando}>
                {finalizando ? 'Processando...' : 'Finalizar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSucesso && (
        <div className="modal-overlay-fixed">
          <div className="modal-content-fixed">
            <div className="modal-icon-success">✓</div>
            <h2 className="modal-title">Compra Finalizada!</h2>
            <p className="modal-text">Acompanhe seu pedido em "Meus pedidos".</p>
          </div>
        </div>
      )}

      {modalErro && (
        <div className="modal-overlay-fixed">
          <div className="modal-content-fixed">
            <div className="modal-header-error">
              <h2 className="modal-title">Erro na Compra</h2>
              <button onClick={() => setModalErro(false)} className="modal-close-btn">×</button>
            </div>
            <p className="modal-text">{mensagemErro}</p>
            <button onClick={() => setModalErro(false)} className="btn btn-error">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrinhoCompras;