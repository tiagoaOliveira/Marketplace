import React, { useState, useEffect } from 'react';
import { cartService } from '../lib/services';
import { auth, supabase } from '../lib/supabase';
import './Carrinho.css';

const CarrinhoCompras = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [finalizando, setFinalizando] = useState(false);

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
        const itens = cart.cart_items.map(item => ({
          id: item.id,
          cartId: cart.id,
          productListingId: item.product_listing_id,
          nome: item.product_listings.products.name,
          preco: parseFloat(item.product_listings.price),
          quantidade: item.quantity,
          stock: item.product_listings.stock,
          storeName: item.product_listings.stores.name,
          storeId: item.product_listings.store_id,
          imagem: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&h=80&fit=crop&crop=center`
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
      // Obter dados do usuário para preencher a order
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('fullname, email, phone, cep, rua, numero, bairro, cidade')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Erro ao obter dados do usuário:', userError);
        alert('Erro ao finalizar compra. Tente novamente.');
        setFinalizando(false);
        return;
      }

      const totalAmount = calcularTotal();

      // 1. Criar order com dados do comprador
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
            total_amount: totalAmount,
            status: 'pendente'
          }
        ])
        .select();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        alert('Erro ao finalizar compra. Tente novamente.');
        setFinalizando(false);
        return;
      }

      const orderId = order[0].id;

      // 2. Criar order_items
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
        alert('Erro ao finalizar compra. Tente novamente.');
        setFinalizando(false);
        return;
      }

      // 3. Limpar carrinho
      await cartService.clearCart(user.id);
      setItensCarrinho([]);

      alert(`Compra finalizada com sucesso! ID do pedido: ${orderId}`);
      // Redirecionar para página de pedidos ou home
      // window.location.href = '/pedidos';

    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      alert('Erro ao finalizar compra. Tente novamente.');
    } finally {
      setFinalizando(false);
    }
  };

  // Agrupar itens por loja
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
                    <div key={item.id} className="carrinho-item">
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
    </div>
  );
};

export default CarrinhoCompras;