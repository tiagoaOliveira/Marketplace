import React, { useState } from 'react';
import './Carrinho.css';

const CarrinhoCompras = () => {
  const [itensCarrinho, setItensCarrinho] = useState([
    {
      id: 1,
      nome: "Smartphone Galaxy Pro",
      preco: 1299.99,
      quantidade: 1,
      imagem: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&h=80&fit=crop&crop=center"
    },
    {
      id: 2,
      nome: "Fone Bluetooth Premium",
      preco: 249.90,
      quantidade: 2,
      imagem: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop&crop=center"
    }
  ]);

  const handleVoltar = () => {
    window.history.back();
  };

  const removerItem = (id) => {
    setItensCarrinho(itens => itens.filter(item => item.id !== id));
  };

  const alterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(id);
      return;
    }
    setItensCarrinho(itens => 
      itens.map(item => 
        item.id === id ? { ...item, quantidade: novaQuantidade } : item
      )
    );
  };

  const calcularTotal = () => {
    return itensCarrinho.reduce((total, item) => 
      total + (item.preco * item.quantidade), 0
    );
  };

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