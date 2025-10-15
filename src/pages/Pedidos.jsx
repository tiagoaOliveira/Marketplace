// src/pages/Pedidos.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Pedidos.css'

const Pedidos = ({ user, userProfile }) => {
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [expandidos, setExpandidos] = useState({})
    const [isVendor, setIsVendor] = useState(false)
    const [visao, setVisao] = useState('comprador')

    useEffect(() => {
        if (user) {
            verificarVendedor()
        }
    }, [user])

    useEffect(() => {
        if (user && !loading) {
            carregarPedidos()
        }
    }, [visao])

    const verificarVendedor = async () => {
        try {
            const { data: stores } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)
            
            setIsVendor(stores && stores.length > 0)
            carregarPedidos()
        } catch (error) {
            console.error('Erro ao verificar vendedor:', error)
            carregarPedidos()
        }
    }

    const carregarPedidos = async () => {
        try {
            setLoading(true)

            if (isVendor && visao === 'vendedor') {
                const { data: stores } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('user_id', user.id)

                if (!stores?.length) {
                    setPedidos([])
                    return
                }

                const storeIds = stores.map(s => s.id)
                
                const { data: items } = await supabase
                    .from('order_items')
                    .select('*')
                    .in('store_id', storeIds)
                    .order('created_at', { ascending: false })

                if (!items?.length) {
                    setPedidos([])
                    return
                }

                const orderIds = [...new Set(items.map(item => item.order_id))]
                
                const { data: orders } = await supabase
                    .from('orders')
                    .select('*')
                    .in('id', orderIds)
                    .order('created_at', { ascending: false })

                const pedidosComItems = orders?.map(order => ({
                    ...order,
                    order_items: items.filter(item => item.order_id === order.id)
                })) || []

                setPedidos(pedidosComItems)
            } else {
                const { data } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                setPedidos(data || [])
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpanded = (pedidoId) => {
        setExpandidos(prev => ({
            ...prev,
            [pedidoId]: !prev[pedidoId]
        }))
    }

    const atualizarStatusItem = async (itemId, novoStatus) => {
        try {
            if (!isVendor || visao !== 'vendedor') {
                return
            }

            const { error } = await supabase
                .from('order_items')
                .update({ 
                    status: novoStatus,
                    status_updated_at: new Date().toISOString(),
                    status_updated_by: user.id
                })
                .eq('id', itemId)

            if (error) throw error

            // Atualizar state localmente
            setPedidos(prev =>
                prev.map(pedido => ({
                    ...pedido,
                    order_items: pedido.order_items?.map(item =>
                        item.id === itemId 
                            ? { 
                                ...item, 
                                status: novoStatus,
                                status_updated_at: new Date().toISOString(),
                                status_updated_by: user.id
                              } 
                            : item
                    ) || []
                }))
            )
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        }
    }

    const resumoAlteracoes = (items) => {
        if (!items?.length) return null

        const entregues = items.filter(i => i.status === 'entregue').length
        const cancelados = items.filter(i => i.status === 'cancelado').length
        const total = items.length

        if (entregues === total) return { tipo: 'entregue', texto: 'Todos entregues' }
        if (cancelados === total) return { tipo: 'cancelado', texto: 'Todos cancelados' }
        if (entregues > 0 || cancelados > 0) {
            return { 
                tipo: 'parcial', 
                texto: `${entregues} entregue(s), ${cancelados} cancelado(s)` 
            }
        }

        return null
    }

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (filtro === 'todos') return true
        
        if (visao === 'vendedor') {
            return pedido.order_items?.some(item => item.status === filtro)
        } else {
            return pedido.summary_status?.includes(filtro)
        }
    })

    const getStatusColor = (status) => {
        const cores = {
            pendente: '#FFA500',
            entregue: '#28A745',
            cancelado: '#DC3545',
            parcial: '#1E90FF'
        }
        return cores[status] || '#6C757D'
    }

    const formatarData = (data) => {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return <div className="pedidos-loading">Carregando pedidos...</div>
    }

    return (
        <div className="pedidos-container">
            {isVendor && (
                <div className="visao-alternador">
                    <button
                        className={`visao-btn ${visao === 'comprador' ? 'ativo' : ''}`}
                        onClick={() => setVisao('comprador')}
                    >
                        🛍 Minhas Compras
                    </button>
                    <button
                        className={`visao-btn ${visao === 'vendedor' ? 'ativo' : ''}`}
                        onClick={() => setVisao('vendedor')}
                    >
                        🪑 Minhas Vendas
                    </button>
                </div>
            )}

            <div className="pedidos-filtros">
                {['todos', 'pendente', 'entregue', 'cancelado'].map(status => (
                    <button
                        key={status}
                        className={`filtro-btn ${filtro === status ? 'ativo' : ''}`}
                        onClick={() => setFiltro(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {pedidosFiltrados.length === 0 ? (
                <div className="pedidos-vazio">
                    <div className="pedidos-vazio-icone">📦</div>
                    <p>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div className="pedidos-lista">
                    {pedidosFiltrados.map(pedido => {
                        const resumo = resumoAlteracoes(pedido.order_items)
                        
                        return (
                            <div key={pedido.id} className="pedido-card">
                                <div className="pedido-header">
                                    <button
                                        className="pedido-expandir"
                                        onClick={() => toggleExpanded(pedido.id)}
                                    >
                                        <span className={`arrow ${expandidos[pedido.id] ? 'ativo' : ''}`}>▼</span>
                                    </button>

                                    <div className="pedido-info">
                                        <h3>Pedido #{pedido.id.slice(0, 6)}
                                            <p className="pedido-data">
                                                {formatarData(pedido.created_at)}
                                            </p>
                                        </h3>
                                    </div>

                                    <div className="pedido-acoes">
                                        {visao === 'comprador' && resumo && (
                                            <div
                                                className="pedido-status"
                                                style={{ backgroundColor: getStatusColor(resumo.tipo) }}
                                            >
                                                {resumo.texto}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {expandidos[pedido.id] && (
                                    <div className="pedido-expandido">
                                        <div className="pedido-endereco">
                                            <h4>Dados do Comprador</h4>
                                            <p><strong>Nome:</strong> {pedido.buyer_name}</p>
                                            <p><strong>Email:</strong> {pedido.buyer_email}</p>
                                            <p><strong>Telefone:</strong> {pedido.buyer_phone || 'Não informado'}</p>
                                            <p>
                                                <strong>Endereço:</strong> {pedido.buyer_rua}, {pedido.buyer_numero}
                                                {pedido.buyer_bairro && ` - ${pedido.buyer_bairro}`}
                                                {pedido.buyer_cidade && ` - ${pedido.buyer_cidade}`}
                                                {pedido.buyer_cep && ` - ${pedido.buyer_cep}`}
                                            </p>
                                        </div>

                                        <div className="pedido-itens">
                                            <h4>{visao === 'vendedor' ? 'Seus Produtos neste Pedido' : 'Itens do Pedido'}</h4>
                                            {pedido.order_items?.map(item => (
                                                <div key={item.id} className="item-expandido">
                                                    <div className="item-info">
                                                        <span className="item-nome">{item.product_name}</span>
                                                        <span className="item-loja">{item.store_name}</span>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                                            <span 
                                                                style={{ 
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: getStatusColor(item.status),
                                                                    color: 'white',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px'
                                                                }}
                                                            >
                                                                {item.status.toUpperCase()}
                                                            </span>
                                                            {item.status_updated_at && (
                                                                <span style={{ fontSize: '11px', color: '#999' }}>
                                                                    {new Date(item.status_updated_at).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="item-dados">
                                                        <span>{item.quantity}x</span>
                                                        <span>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</span>
                                                        <span className="item-subtotal">
                                                            R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                    {visao === 'vendedor' && item.status === 'pendente' && (
                                                        <div className="pedido-botoes">
                                                            <button
                                                                className="btn-status-entregue"
                                                                onClick={() => atualizarStatusItem(item.id, 'entregue')}
                                                            >
                                                                ✓ Entregue
                                                            </button>
                                                            <button
                                                                className="btn-status-cancelado"
                                                                onClick={() => atualizarStatusItem(item.id, 'cancelado')}
                                                            >
                                                                ✕ Cancelar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pedido-total-expandido">
                                            <span>{visao === 'vendedor' ? 'Total dos seus produtos:' : 'Total do Pedido:'}</span>
                                            <span>
                                                R$ {pedido.order_items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default Pedidos