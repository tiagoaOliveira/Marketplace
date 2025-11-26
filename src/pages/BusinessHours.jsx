import React from 'react';
import './BusinessHours.css';

const BusinessHours = ({ value = [], onChange, onSave }) => {
  
  const adicionarPeriodo = () => {
    onChange([...value, { dias: '', horario: '' }]);
  };

  const removerPeriodo = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updatePeriodo = (index, campo, novoValor) => {
    const newValue = value.map((periodo, i) => 
      i === index ? { ...periodo, [campo]: novoValor } : periodo
    );
    onChange(newValue);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(value);
    }
  };

  return (
    <div className="business-hours-container"> 
      <div className="business-hours-list">
        {value.map((periodo, index) => (
          <div key={index} className="day-row">
            <div className="day-row-content">
              <div className="period-line">
                <div className="input-group">
                  <span className="field-label">Dias:</span>
                  <input
                    type="text"
                    className="free-text-input"
                    placeholder="Ex: Segunda à Sexta"
                    value={periodo.dias || ''}
                    onChange={(e) => updatePeriodo(index, 'dias', e.target.value)}
                  />
                </div>
                
                <button
                  type="button"
                  className="remove-day-btn"
                  onClick={() => removerPeriodo(index)}
                  title="Remover linha"
                >
                  ×
                </button>
              </div>

              <div className="period-line">
                <div className="input-group">
                  <span className="field-label">Horário:</span>
                  <input
                    type="text"
                    className="free-text-input"
                    placeholder="Ex: 09:00 às 18:00 (Almoço 12h-13h)"
                    value={periodo.horario || ''}
                    onChange={(e) => updatePeriodo(index, 'horario', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="add-day-container">
          <button
            type="button"
            className="add-day-btn"
            onClick={adicionarPeriodo}
          >
            + Adicionar novo período
          </button>
        </div>
      </div>

      {value.length === 0 && (
        <div className="empty-hours">
          Nenhum horário definido.
        </div>
      )}

      <div className="save-actions">
        <button 
          type="button" 
          className="save-btn"
          onClick={handleSave}
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export { BusinessHours };