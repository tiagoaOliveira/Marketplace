// PerfilLoja.jsx - CORRIGIDO PARA USAR CONTEXTO
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storesService } from '../lib/services';
import { supabase } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification';
import { useProductModalContext } from '../contexts/ProductModalContext.jsx';
import './PerfilLoja.css';
import { RxArrowLeft } from "react-icons/rx";

const PerfilLoja = () => {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { notification, showNotification } = useNotification();

  // ✅ Usar contexto
  const {
    abrirModalProduto,
    adicionarAoCarrinho,
    removerDoCarrinho,
    getQuantidade,
    user
  } = useProductModalContext();

  const [loja, setLoja] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState({});

  useEffect(() => {
    initialize();
  }, [storeSlug]);

  const initialize = async () => {
    try {
      const { data: stores } = await storesService.getApprovedStores();
      const lojaEncontrada = stores?.find(s => createSlug(s.name) === storeSlug);

      if (!lojaEncontrada) {
        navigate('/');
        return;
      }

      setLoja(lojaEncontrada);

      const { data: produtosData } = await storesService.getStoreProducts(lojaEncontrada.id);
      setProdutos(produtosData || []);

    } catch (error) {
      console.error('Erro ao carregar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAdicionar = async (e, listing) => {
    e.stopPropagation();

    if (!user) {
      showNotification('Faça login para adicionar produtos ao carrinho', 'warning');
      return;
    }

    const key = listing.id;
    if (processando[key]) return;

    setProcessando(prev => ({ ...prev, [key]: true }));

    // ✅ Passar produto com estrutura correta
    const produto = {
      id: listing.id,
      productListingId: listing.id,
      nome: listing.products.name,
      preco: parseFloat(listing.price),
      stock: listing.stock,
      loja: loja.name,
      storeId: loja.id,
      imagem: listing.products.images?.[0],
      images: listing.products.images || []
    };

    const sucesso = await adicionarAoCarrinho(produto);

    setProcessando(prev => ({ ...prev, [key]: false }));

    if (sucesso) {
      showNotification('Produto adicionado!', 'success');
    }
  };

  const handleRemover = async (e, listing) => {
    e.stopPropagation();

    const key = listing.id;
    if (processando[key]) return;

    setProcessando(prev => ({ ...prev, [key]: true }));

    const produto = {
      id: listing.id,
      productListingId: listing.id
    };

    await removerDoCarrinho(produto);
    setProcessando(prev => ({ ...prev, [key]: false }));
  };

  const handleVoltar = () => {
    window.history.back();
  };

  const handleCardClick = (e, listing) => {
    if (e.target.closest('.produto-controles-loja')) return;

    // ✅ Passar produto com estrutura correta
    abrirModalProduto({
      id: listing.id,
      productListingId: listing.id,
      nome: listing.products.name,
      descricao: listing.products.description,
      preco: parseFloat(listing.price),
      stock: listing.stock,
      loja: loja.name,
      storeId: loja.id,
      imagem: listing.products.images?.[0],
      images: listing.products.images || []
    }, {
      showControls: true,
      onStoreClick: () => { } // Já estamos na página da loja
    });
  };

  if (loading) {
    return <div className="perfil-loja-container"></div>;
  }

  if (!loja) {
    return <div className="perfil-loja-container">Loja não encontrada</div>;
  }

  return (
    <div className="perfil-loja-container">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="loja-header">
        {loja.banner_url && (
          <div className="loja-banner-bg">
            <img src={loja.banner_url} alt={loja.name} />
          </div>
        )}

        <button className="btn-voltar" onClick={handleVoltar}>
          <RxArrowLeft />
        </button>
      </div>

      <div className="loja-produtos-section">
        {produtos.length === 0 ? (
          <p className="sem-produtos">Esta loja ainda não possui produtos cadastrados.</p>
        ) : (
          <div className="produtos-grid">
            {produtos.map(listing => {
              const quantidade = getQuantidade({ id: listing.id, productListingId: listing.id });
              const key = listing.id;
              const estaProcessando = processando[key];

              return (
                <div
                  key={listing.id}
                  className="produto-card"
                  onClick={(e) => handleCardClick(e, listing)}
                >
                  <img
                    src={listing.products.images?.[0]}
                    alt={listing.products.name}
                    className="produto-imagem"
                  />

                  <h3 className="produto-nome-produtos">{listing.products.name}</h3>

                  <p className="produto-preco">
                    R$ {parseFloat(listing.price).toFixed(2).replace('.', ',')}
                  </p>

                  <div className="produto-controles-loja">
                    <button
                      className="btn-carrinho"
                      onClick={(e) => handleRemover(e, listing)}
                      disabled={!quantidade || estaProcessando}
                    >
                      -
                    </button>

                    <span className="quantidade-produto">
                      {quantidade}
                    </span>

                    <button
                      className="btn-carrinho"
                      onClick={(e) => handleAdicionar(e, listing)}
                      disabled={listing.stock === 0 || (quantidade >= listing.stock) || estaProcessando}
                    >
                      +
                    </button>
                  </div>

                  {listing.stock === 0 && (
                    <p className="produto-sem-estoque">Sem estoque</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilLoja;