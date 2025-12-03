import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Offer {
  id: number;
  produtoId: number;
  precoOferta: number;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
}

interface Product {
  id: number;
  descricao: string;
  precoVenda: number;
}

export default function GestaoOfertas() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [offersRes, productsRes] = await Promise.all([
        api.get('/offers'),
        api.get('/produtos')
      ]);
      setOffers(offersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !price || !startDate || !endDate) {
      toast.warning('Preencha todos os campos');
      return;
    }

    try {
      const priceInCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
      
      await api.post('/offers', {
        produtoId: parseInt(selectedProduct),
        precoOferta: priceInCents,
        dataInicio: new Date(startDate),
        dataFim: new Date(endDate),
        ativo: true
      });

      toast.success('Oferta criada com sucesso!');
      loadData();
      
      // Reset form
      setSelectedProduct('');
      setPrice('');
      setStartDate('');
      setEndDate('');
    } catch (error: any) {
      toast.error('Erro ao criar oferta: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta oferta?')) return;
    
    try {
      await api.delete(`/offers/${id}`);
      toast.success('Oferta excluída com sucesso');
      setOffers(offers.filter(o => o.id !== id));
    } catch (error) {
      toast.error('Erro ao excluir oferta');
    }
  };

  const getProductName = (id: number) => {
    return products.find(p => p.id === id)?.descricao || 'Produto desconhecido';
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Ofertas</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Nova Oferta</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
            <select 
              value={selectedProduct} 
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Selecione...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.descricao} - {formatCurrency(p.precoVenda)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Oferta</label>
            <input 
              type="number" 
              step="0.01" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              placeholder="0,00"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-10 mt-4 md:mt-0">
            Adicionar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Oferta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma oferta cadastrada</td></tr>
            ) : (
              offers.map(offer => {
                const now = new Date();
                const start = new Date(offer.dataInicio);
                const end = new Date(offer.dataFim);
                let status = 'Agendada';
                let statusColor = 'text-yellow-600 bg-yellow-100';
                
                if (now >= start && now <= end) {
                  status = 'Ativa';
                  statusColor = 'text-green-600 bg-green-100';
                } else if (now > end) {
                  status = 'Expirada';
                  statusColor = 'text-red-600 bg-red-100';
                }

                return (
                  <tr key={offer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{getProductName(offer.produtoId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">{formatCurrency(offer.precoOferta)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(start, 'dd/MM/yyyy')} até {format(end, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
