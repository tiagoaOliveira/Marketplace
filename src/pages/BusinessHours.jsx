import React, { useState } from 'react';
import './BusinessHours.css';

const BusinessHours = ({ value = {}, onChange }) => {
  const diasSemana = [
    { id: 'segunda', label: 'Segunda-feira' },
    { id: 'terca', label: 'Terça-feira' },
    { id: 'quarta', label: 'Quarta-feira' },
    { id: 'quinta', label: 'Quinta-feira' },
    { id: 'sexta', label: 'Sexta-feira' },
    { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' },
    { id: 'feriados', label: 'Feriados' }
  ];

  const horariosComuns = [
    '24:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const toggleDia = (diaId) => {
    const newValue = { ...value };
    
    if (newValue[diaId]) {
      delete newValue[diaId];
    } else {
      newValue[diaId] = {
        abertura: '08:00',
        fechamento: '18:00',
        fechado: false
      };
    }
    
    onChange(newValue);
  };

  const toggleFechado = (diaId) => {
    const newValue = {
      ...value,
      [diaId]: {
        ...value[diaId],
        fechado: !value[diaId]?.fechado
      }
    };
    onChange(newValue);
  };

  const updateHorario = (diaId, tipo, valor) => {
    const newValue = {
      ...value,
      [diaId]: {
        ...value[diaId],
        [tipo]: valor
      }
    };
    onChange(newValue);
  };

  const copiarParaTodos = (diaId) => {
    const horarioBase = value[diaId];
    if (!horarioBase) return;

    const newValue = {};
    diasSemana.forEach(dia => {
      if (dia.id !== 'feriados' && dia.id !== 'domingo') {
        newValue[dia.id] = { ...horarioBase };
      }
    });

    onChange(newValue);
  };

  return (
    <div className="business-hours-container">
      <div className="business-hours-header">
        <h4>Horário de Funcionamento</h4>
        <p>Selecione os dias e horários em que sua loja funciona</p>
      </div>

      <div className="business-hours-list">
        {diasSemana.map((dia) => {
          const isActive = !!value[dia.id];
          const isFechado = value[dia.id]?.fechado;
          
          return (
            <div key={dia.id} className={`day-item ${isActive ? 'active' : ''}`}>
              <div className="day-content">
                <label className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDia(dia.id)}
                  />
                  <span className={isActive ? 'active-label' : ''}>{dia.label}</span>
                </label>

                {isActive && (
                  <>
                    <label className="closed-checkbox">
                      <input
                        type="checkbox"
                        checked={isFechado}
                        onChange={() => toggleFechado(dia.id)}
                      />
                      <span className="closed-label">Fechado</span>
                    </label>

                    {!isFechado && (
                      <div className="hours-selector">
                        <div className="time-input">
                          <label>Abre:</label>
                          <select
                            value={value[dia.id]?.abertura || '08:00'}
                            onChange={(e) => updateHorario(dia.id, 'abertura', e.target.value)}
                          >
                            {horariosComuns.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        <span className="time-separator">—</span>

                        <div className="time-input">
                          <label>Fecha:</label>
                          <select
                            value={value[dia.id]?.fechamento || '18:00'}
                            onChange={(e) => updateHorario(dia.id, 'fechamento', e.target.value)}
                          >
                            {horariosComuns.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="copy-button"
                          onClick={() => copiarParaTodos(dia.id)}
                        >
                          Copiar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(value).length === 0 && (
        <div className="empty-hours">
          Nenhum horário configurado
        </div>
      )}
    </div>
  );
};

export { BusinessHours };