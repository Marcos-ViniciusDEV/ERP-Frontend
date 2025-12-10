import React, { useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Search, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';

interface SaleItem {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  desconto: number;
}

interface Sale {
  id: number;
  numeroVenda: string;
  dataVenda: string;
  valorTotal: number;
  valorLiquido: number;
  operadorNome: string;
  itens: SaleItem[];
}

interface ReturnItem {
  productId: number;
  quantity: number;
  condition: 'GOOD' | 'DAMAGED';
}

export default function GestaoDevolucoes() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setLoading(true);
    try {
      const response = await api.get(`/vendas/${searchTerm}`);
      setSale(response.data);
      setSelectedItems([]);
      setReason('');
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      toast.error('Venda não encontrada');
      setSale(null);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (item: SaleItem, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, {
        productId: item.produtoId,
        quantity: 1,
        condition: 'GOOD'
      }]);
    } else {
      setSelectedItems(prev => prev.filter(i => i.productId !== item.produtoId));
    }
  };

  const updateItemQuantity = (productId: number, quantity: number, max: number) => {
    if (quantity < 1 || quantity > max) return;
    setSelectedItems(prev => prev.map(i => 
      i.productId === productId ? { ...i, quantity } : i
    ));
  };

  const updateItemCondition = (productId: number, condition: 'GOOD' | 'DAMAGED') => {
    setSelectedItems(prev => prev.map(i => 
      i.productId === productId ? { ...i, condition } : i
    ));
  };

  const handleSubmit = async () => {
    if (!sale || selectedItems.length === 0 || !reason) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/returns', {
        originalSaleId: sale.id,
        reason,
        items: selectedItems
      });
      
      toast.success('Devolução registrada com sucesso!');
      setSale(null);
      setSearchTerm('');
      setSelectedItems([]);
      setReason('');
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      toast.error('Erro ao registrar devolução');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setLocation('/vendas/consultar')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Trocas e Devoluções</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Venda (ID ou Número)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 123 ou V123456789"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Buscar
            </button>
          </div>
        </form>
      </div>

      {sale && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes da Venda</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Número</span>
                <span className="font-medium">{sale.numeroVenda}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Data</span>
                <span className="font-medium">{new Date(sale.dataVenda).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Operador</span>
                <span className="font-medium">{sale.operadorNome || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Valor Total</span>
                <span className="font-medium text-green-600 font-bold">
                  {(sale.valorLiquido / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Itens da Venda</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-right">Preço Unit.</th>
                    <th className="py-3 px-4 text-center">Qtd. Vendida</th>
                    <th className="py-3 px-4 text-center">Qtd. Devolver</th>
                    <th className="py-3 px-4">Condição</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.itens.map((item) => {
                    const isSelected = selectedItems.some(i => i.productId === item.produtoId);
                    const selectedItem = selectedItems.find(i => i.productId === item.produtoId);

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleItemSelection(item, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">{item.produtoNome}</td>
                        <td className="py-3 px-4 text-right">
                          {(item.precoUnitario / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3 px-4 text-center">{item.quantidade}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="1"
                            max={item.quantidade}
                            value={selectedItem?.quantity || 1}
                            onChange={(e) => updateItemQuantity(item.produtoId, Number(e.target.value), item.quantidade)}
                            disabled={!isSelected}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center mx-auto block disabled:bg-gray-100"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={selectedItem?.condition || 'GOOD'}
                            onChange={(e) => updateItemCondition(item.produtoId, e.target.value as any)}
                            disabled={!isSelected}
                            className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                          >
                            <option value="GOOD">Bom Estado (Retorna ao Estoque)</option>
                            <option value="DAMAGED">Danificado (Estoque de Troca)</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Motivo da Devolução</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
              placeholder="Descreva o motivo da devolução..."
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading || selectedItems.length === 0 || !reason}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
