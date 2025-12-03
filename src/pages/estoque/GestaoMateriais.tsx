import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Material {
  id: number;
  nome: string;
  unidade: string;
  estoque: number;
  custoUnitario: number;
  ativo: boolean;
}

export default function GestaoMateriais() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost || !stock) {
      toast.warning('Preencha todos os campos');
      return;
    }

    try {
      const costInCents = Math.round(parseFloat(cost.replace(',', '.')) * 100);
      const stockValue = parseFloat(stock.replace(',', '.'));
      
      await api.post('/materials', {
        nome: name,
        unidade: unit,
        estoque: stockValue,
        custoUnitario: costInCents,
        ativo: true
      });

      toast.success('Material criado com sucesso!');
      loadMaterials();
      
      // Reset form
      setName('');
      setCost('');
      setStock('');
    } catch (error: any) {
      toast.error('Erro ao criar material');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      await api.delete(`/materials/${id}`);
      toast.success('Material excluído com sucesso');
      setMaterials(materials.filter(m => m.id !== id));
    } catch (error) {
      toast.error('Erro ao excluir material');
    }
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Materiais (Insumos)</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Novo Material</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ex: Farinha de Trigo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <select 
              value={unit} 
              onChange={e => setUnit(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="kg">KG</option>
              <option value="g">Gramas</option>
              <option value="l">Litros</option>
              <option value="ml">ML</option>
              <option value="un">Unidade</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial</label>
            <input 
              type="number" 
              step="0.001" 
              value={stock} 
              onChange={e => setStock(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="0.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário</label>
            <input 
              type="number" 
              step="0.01" 
              value={cost} 
              onChange={e => setCost(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="0,00"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhum material cadastrado</td></tr>
            ) : (
              materials.map(material => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{material.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{material.unidade}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{material.estoque}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(material.custoUnitario)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
