import React from 'react';
import './produtos.css';

const ProdutosShowcase = () => {
  const produtos = [
    {
      id: 1,
      nome: "Smartphone Galaxy Pro",
      preco: 1299.99,
      imagem: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center"
    },
    {
      id: 2,
      nome: "Fone Bluetooth Premium",
      preco: 249.90,
      imagem: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&crop=center"
    },
        {
      id: 3,
      nome: "Smartphone Galaxy Pro",
      preco: 1299.99,
      imagem: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center"
    }
  ];

  return (
    <div className="produtos-container">
      {produtos.map(produto => (
        <div key={produto.id} className="produto-card">
          <img 
            src={produto.imagem} 
            alt={produto.nome}
            className="produto-imagem"
          />
          <h3 className="produto-nome">{produto.nome}</h3>
          <p className="produto-preco">
            R$ {produto.preco.toFixed(2).replace('.', ',')}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ProdutosShowcase;