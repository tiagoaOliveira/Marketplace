import React from 'react';
import './categorias.css';

const CategoriasShowcase = ({ onCategoriaSelect, categoriaSelecionada }) => {
  const categorias = [
    {
      id: 1,
      nome: "Mercearia",
      icone: "🛒",
    },
    {
      id: 2,
      nome: "Açougue",
      icone: "🥩",
    },
    {
      id: 3,
      nome: "Padaria",
      icone: "🍞",
    },
    {
      id: 4,
      nome: "Construção",
      icone: "🔨",
    },
    {
      id: 5,
      nome: "Mercado",
      icone: "🏪",
    },
    {
      id: 6,
      nome: "Farmácia",
      icone: "💊",
    },
    {
      id: 7,
      nome: "Moda",
      icone: "👕",
    },
    {
      id: 8,
      nome: "Eletrônicos",
      icone: "📱",
    },
    {
      id: 9,
      nome: "Móveis",
      icone: "🪑",
    },
    {
      id: 10,
      nome: "Lanches",
      icone: "🍕",
    },
    {
      id: 11,
      nome: "Brinquedos",
      icone: "🧸",
    },
    {
      id: 12,
      nome: "EletroDom.",
      icone: "🏠",
    },
  ];

  const handleCategoriaClick = (categoria) => {
    // Se clicar na categoria já selecionada, remove a seleção
    if (categoriaSelecionada === categoria.nome) {
      onCategoriaSelect(null);
    } else {
      onCategoriaSelect(categoria.nome);
    }
  };

  return (
    <div className="categorias-container">
      {categorias.map(categoria => (
        <div 
          key={categoria.id} 
          className={`categoria-card ${categoriaSelecionada === categoria.nome ? 'categoria-selecionada' : ''}`}
          onClick={() => handleCategoriaClick(categoria)}
        >
          <div className="categoria-icone">
            {categoria.icone}
          </div>
          <h3 className="categoria-nome">{categoria.nome}</h3>
        </div>
      ))}
    </div>
  );
};

export default CategoriasShowcase;