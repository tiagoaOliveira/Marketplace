import React, { useState, useEffect } from 'react';
import { cartService } from '../lib/services';
import { auth } from '../lib/supabase';
import './Carrinho.css';

const CarrinhoCompras = () => {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
          // Usar imagem padrão se não tiver
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
            {itensCarrinho.map(item => (
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
                </div>
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
              <button className="btn btn-primary btn-lg carrinho-finalizar">
                Finalizar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrinhoCompras;