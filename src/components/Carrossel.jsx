import { useState, useEffect } from 'react';
import { storesService } from '../lib/services';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useSlug } from '../hooks/useSlug';
import './Carrossel.css';

const Carrossel = () => {
  const { createSlug } = useSlug();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const { data, error: storesError } = await storesService.getStoresByUserCity(user.id);

      if (storesError) {
        setError(storesError);
      } else {
        setStores(data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar lojas:', err);
      setError('Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className='carrossel-title'>Lojas Próximas</h2>
        <div className="slider">
          <div className="carrossel-loading"></div>
        </div>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return (
      <div>
        <h2 className='carrossel-title'>Lojas Próximas</h2>
        <div className="slider">
          <div className="carrossel-empty">
            Nenhuma loja cadastrada nessa cidade
          </div>
        </div>
      </div>
    );
  }

  // Duplicar lojas para efeito infinito (apenas se tiver pelo menos 3)
  const displayStores = stores.length >= 3 ? [...stores, ...stores] : stores;

  return (
    <div>
      <h2 className='carrossel-title'>Lojas Próximas</h2>
      <div className="slider">
        <div className="slide-track">
          {displayStores.map((store, index) => (
            <Link
              to={`/loja/${createSlug(store.name)}`}
              key={`${store.id}-${index}`}
              className="slide"
            >
              {store.banner_url && (
                <img src={store.banner_url} alt={store.name} />
              )}

              {!store.banner_url && (
                <div className="slide-fallback">
                  <span>Sem Imagem</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carrossel;