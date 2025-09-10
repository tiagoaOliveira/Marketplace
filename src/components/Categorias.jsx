import React from 'react';
import './categorias.css';

const CategoriasShowcase = () => {
  const categorias = [
    {
      id: 1,
      nome: "Mercearia",
      icone: "📱",
    },
    {
      id: 2,
      nome: "Açougue",
      icone: "🎧",
    },
    {
      id: 3,
      nome: "Padaria",
      icone: "💻",
    },
    {
      id: 4,
      nome: "Construção",
      icone: "🎮",
    },
    {
      id: 5,
      nome: "Papelaria",
      icone: "🏠",
    },
    {
      id: 6,
      nome: "Farmácia",
      icone: "📷",
    },
    {
      id:7,
      nome:"Moda",
      icone: "📷",
    },
        {
      id:8,
      nome:"Sorveteria",
      icone: "📷",
    },
        {
      id:9,
      nome:"Lanches",
      icone: "📷",
    }
  ];

  return (
    <div className="categorias-container">
      {categorias.map(categoria => (
        <div key={categoria.id} className="categoria-card">
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