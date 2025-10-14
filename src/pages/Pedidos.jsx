// src/pages/Pedidos.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Pedidos.css'

const Pedidos = ({ user, userProfile, isVendor }) => {
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [expandidos, setExpandidos] = useState({})

    useEffect(() => {
        carregarPedidos()
    }, [user, isVendor])

    const carregarPedidos = async () => {
        try {
            setLoading(true)

            if (isVendor) {
                // Vendedor vê pedidos dos seus produtos
                const { data: stores } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('user_id', user.id)

                if (stores?.length) {
                    const storeIds = stores.map(s => s.id)
                    const { data, error } = await supabase
                        .from('order_items')
                        .select('order_id, orders(*)')
                        .in('store_id', storeIds)

                    if (error) throw error
                    const pedidosUnicos = Array.from(
                        new Map(data.map(item => [item.order_id, item.orders])).values()
                    )
                    setPedidos(pedidosUnicos || [])
                }
            } else {
                // Comprador vê seus próprios pedidos
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
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

    const atualizarStatus = async (pedidoId, novoStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: novoStatus })
                .eq('id', pedidoId)

            if (error) throw error

            setPedidos(prev =>
                prev.map(p =>
                    p.id === pedidoId ? { ...p, status: novoStatus } : p
                )
            )
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            alert('Erro ao atualizar status do pedido')
        }
    }

    const pedidosFiltrados = pedidos.filter(p =>
        filtro === 'todos' ? true : p.status === filtro
    )

    const getStatusBadge = (status) => {
        const cores = {
            pendente: '#FFA500',
            entregue: '#28A745',
            cancelado: '#DC3545'
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
                    {pedidosFiltrados.map(pedido => (
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
                                    <div
                                        className="pedido-status"
                                        style={{ backgroundColor: getStatusBadge(pedido.status) }}
                                    >
                                        {pedido.status.toUpperCase()}
                                    </div>
                                    {isVendor && pedido.status === 'pendente' && (
                                        <div className="pedido-botoes">
                                            <button
                                                className="btn-status-entregue"
                                                onClick={() => atualizarStatus(pedido.id, 'entregue')}
                                            >
                                                ✓ Entregue
                                            </button>
                                            <button
                                                className="btn-status-cancelado"
                                                onClick={() => atualizarStatus(pedido.id, 'cancelado')}
                                            >
                                                ✕ Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expandidos[pedido.id] && (
                                <div className="pedido-expandido">
                                    {!isVendor && (
                                        <div className="pedido-endereco">
                                            <h4>Endereço de Entrega</h4>
                                            <p>
                                                {pedido.buyer_rua}, {pedido.buyer_numero}
                                                {pedido.buyer_bairro && ` - ${pedido.buyer_bairro}`}
                                                {pedido.buyer_cidade && ` - ${pedido.buyer_cidade}`}
                                                {pedido.buyer_cep && ` - ${pedido.buyer_cep}`}
                                            </p>
                                            <p>
                                                <strong>Contato:</strong> {pedido.buyer_phone || 'Não informado'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pedido-itens">
                                        <h4>Itens do Pedido</h4>
                                        {pedido.order_items?.map(item => (
                                            <div key={item.id} className="item-expandido">
                                                <div className="item-info">
                                                    <span className="item-nome">{item.product_name}</span>
                                                    <span className="item-loja">Loja: {item.store_name}</span>
                                                </div>
                                                <div className="item-dados">
                                                    <span>{item.quantity}x</span>
                                                    <span>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</span>
                                                    <span className="item-subtotal">
                                                        R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pedido-total-expandido">
                                        <span>Total do Pedido:</span>
                                        <span>
                                            R$ {parseFloat(pedido.total_amount).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Pedidos