// Produtos.jsx - SIMPLIFICADO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsService } from '../lib/services';
import { useProductModalContext } from '../contexts/ProductModalContext.jsx';
import './produtos.css';
import { useSlug } from '../hooks/useSlug';

const ProdutosShowcase = ({ categoriaFiltro }) => {
  const navigate = useNavigate();
  const { createSlug } = useSlug();
  const { abrirModalProduto, adicionarAoCarrinho, removerDoCarrinho, getQuantidade } = useProductModalContext();

  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    filtrarProdutos();
  }, [produtos, categoriaFiltro]);

  const carregarProdutos = async () => {
    try {
      const { data } = await listingsService.getActiveListings();
      if (!data) return;

      const produtosMap = {};
      data.forEach(listing => {
        const productId = listing.products.id;
        if (!produtosMap[productId] || listing.price < produtosMap[productId].preco) {
          produtosMap[productId] = {
            id: listing.id,
            productListingId: listing.id,
            nome: listing.products.name,
            preco: parseFloat(listing.price),
            stock: listing.stock,
            categoria: listing.products.category,
            subcategoria: listing.products.subcategory,
            loja: listing.stores.name,
            imagem: listing.products.images?.[0],
            images: listing.products.images || []
          };
        }
      });
      setProdutos(Object.values(produtosMap));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarProdutos = () => {
    let filtrados = categoriaFiltro 
      ? produtos.filter(p => p.categoria === categoriaFiltro || p.subcategoria === categoriaFiltro)
      : produtos;
    
    if (!categoriaFiltro && filtrados.length > 30) {
      filtrados = filtrados.sort(() => 0.5 - Math.random()).slice(0, 30);
    }
    setProdutosFiltrados(filtrados);
  };

  const irParaLoja = (nomeLoja) => {
    const slug = createSlug(nomeLoja);
    navigate(`/loja/${slug}`);
  };

  const handleCardClick = (e, produto) => {
    if (e.target.closest('.produto-controles')) return;
    abrirModalProduto(produto, { showControls: true, onStoreClick: irParaLoja });
  };

  if (loading) return <div className="produtos-container">Carregando...</div>;

  return (
    <div className="produtos-container">
      <div className="produtos-grid">
        {produtosFiltrados.map(produto => {
          const quantidade = getQuantidade(produto);
          
          return (
            <div key={produto.id} className="produto-card" onClick={(e) => handleCardClick(e, produto)}>
              <img src={produto.imagem} alt={produto.nome} className="produto-imagem" />
              <h3 className="produto-nome-produtos">{produto.nome}</h3>
              <p className="produto-preco">R$ {produto.preco.toFixed(2).replace('.', ',')}</p>

              <div className="produto-controles">
                <button className="btn-carrinho btn-menos" onClick={(e) => { e.stopPropagation(); removerDoCarrinho(produto); }} disabled={!quantidade}>-</button>
                <span className="quantidade-produto">{quantidade}</span>
                <button className="btn-carrinho btn-mais" onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(produto); }} disabled={produto.stock === 0 || quantidade >= produto.stock}>+</button>
              </div>

              {produto.stock === 0 && <p className="produto-sem-estoque">Sem estoque</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProdutosShowcase;