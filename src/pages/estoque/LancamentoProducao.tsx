import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Product {
  id: number;
  descricao: string;
}

export default function LancamentoProducao() {
  const [products, setProducts] = useState<Product[]>([]);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [observation, setObservation] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/produtos');
      setProducts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      toast.warning('Preencha os campos obrigatórios');
      return;
    }

    try {
      await api.post('/production', {
        produtoId: parseInt(selectedProduct),
        quantidade: parseFloat(quantity.replace(',', '.')),
        observacao: observation
      });

      toast.success('Produção registrada com sucesso! Estoque de insumos atualizado.');
      
      // Reset form
      setSelectedProduct('');
      setQuantity('');
      setObservation('');
    } catch (error: any) {
      toast.error('Erro ao registrar produção: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Lançamento de Produção</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <p className="text-gray-600 mb-6">
          Registre a produção de itens para atualizar automaticamente o estoque dos insumos baseados na ficha técnica.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto Produzido</label>
            <select 
              value={selectedProduct} 
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full border rounded p-3 text-lg"
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.descricao}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Produzida</label>
            <input 
              type="number" 
              step="1" 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)}
              className="w-full border rounded p-3 text-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (Opcional)</label>
            <textarea 
              value={observation} 
              onChange={e => setObservation(e.target.value)}
              className="w-full border rounded p-3"
              rows={3}
              placeholder="Ex: Lote 123, Turno da manhã..."
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition-colors"
          >
            Registrar Produção
          </button>
        </form>
      </div>
    </div>
  );
}
