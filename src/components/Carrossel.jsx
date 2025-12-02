import { useState, useEffect } from 'react';
import { storesService } from '../lib/services';
import { supabase } from '../lib/supabase';
import './Carrossel.css';

const Carrossel = () => {
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

      // Buscar lojas da mesma cidade
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

  // Se estiver carregando
  if (loading) {
    return (
      <div>
        <h2 className='carrossel-title'>Lojas Próximas</h2>
        <div className="slider">
          <div className="carrossel-loading">Carregando lojas...</div>
        </div>
      </div>
    );
  }

  // Se não houver lojas
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
      <h2 className='carrossel-title'>
        Lojas Próximas
      </h2>
      <div className="slider">
        <div className="slide-track" style={{
          width: stores.length >= 3 ? `calc(250px * ${displayStores.length})` : 'auto',
          animation: stores.length >= 3 ? 'scroll 60s linear infinite' : 'none',
          justifyContent: stores.length < 3 ? 'flex-start' : 'normal'
        }}>
          {displayStores.map((store, index) => (
            <div key={`${store.id}-${index}`} className="slide">
              <img 
                src={store.banner_url} 
                height="100" 
                width="250" 
                alt={store.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/250x100?text=Sem+Imagem';
                }}
              />
              <div className="slide-overlay">
                <span className="slide-store-name">{store.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carrossel;