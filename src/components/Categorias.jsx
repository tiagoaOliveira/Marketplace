import React, { useState } from 'react';
import './categorias.css';

const CategoriasShowcase = ({ onCategoriaSelect, categoriaSelecionada }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    if (categoriaSelecionada === categoria.nome) {
      onCategoriaSelect(null);
    } else {
      onCategoriaSelect(categoria.nome);
    }
  };

  return (
    <div className="categorias-wrapper">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`categorias-toggle ${isExpanded ? 'expanded' : ''}`}
      >
        <span className="categorias-toggle-content">
          <span className={`categorias-arrow ${isExpanded ? 'rotated' : ''}`}>
            ▼
          </span>
          Categorias
        </span>
        {categoriaSelecionada && (
          <span className="categorias-badge">
            {categoriaSelecionada}
          </span>
        )}
      </button>
      
      <div className={`categorias-expandable ${isExpanded ? 'expanded' : ''}`}>
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
      </div>
    </div>
  );
};

export default function App() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  
  return (
    <div>
      <CategoriasShowcase 
        onCategoriaSelect={setCategoriaSelecionada}
        categoriaSelecionada={categoriaSelecionada}
      />
      
      {categoriaSelecionada && (
        <div>
          <h2>
            Categoria Selecionada
          </h2>
          <p>
            {categoriaSelecionada}
          </p>
        </div>
      )}
    </div>
  );
}