import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Product {
  id: number;
  descricao: string;
}

interface Material {
  id: number;
  nome: string;
  unidade: string;
}

interface Recipe {
  id: number;
  produtoId: number;
  materialId: number;
  quantidade: number;
  materialNome: string;
  materialUnidade: string;
}

export default function GestaoReceitas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Selection state
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Form state
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadRecipes(parseInt(selectedProduct));
    } else {
      setRecipes([]);
    }
  }, [selectedProduct]);

  const loadInitialData = async () => {
    try {
      const [productsRes, materialsRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/materials')
      ]);
      setProducts(productsRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const loadRecipes = async (productId: number) => {
    try {
      const response = await api.get(`/recipes/product/${productId}`);
      setRecipes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar receitas');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedMaterial || !quantity) {
      toast.warning('Preencha todos os campos');
      return;
    }

    try {
      await api.post('/recipes', {
        produtoId: parseInt(selectedProduct),
        materialId: parseInt(selectedMaterial),
        quantidade: parseFloat(quantity.replace(',', '.'))
      });

      toast.success('Ingrediente adicionado com sucesso!');
      loadRecipes(parseInt(selectedProduct));
      
      // Reset form (keep product selected)
      setSelectedMaterial('');
      setQuantity('');
    } catch (error: any) {
      toast.error('Erro ao adicionar ingrediente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este ingrediente?')) return;
    
    try {
      await api.delete(`/recipes/${id}`);
      toast.success('Ingrediente removido com sucesso');
      setRecipes(recipes.filter(r => r.id !== id));
    } catch (error) {
      toast.error('Erro ao remover ingrediente');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Receitas (Ficha Técnica)</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Produto Final</label>
          <select 
            value={selectedProduct} 
            onChange={e => setSelectedProduct(e.target.value)}
            className="w-full border rounded p-2 text-lg"
          >
            <option value="">Selecione um produto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.descricao}</option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <>
            <h2 className="text-xl font-semibold mb-4 border-t pt-4">Adicionar Ingrediente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Material (Insumo)</label>
                <select 
                  value={selectedMaterial} 
                  onChange={e => setSelectedMaterial(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Selecione...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="0.000"
                />
              </div>

              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 h-10 mt-4 md:mt-0">
                Adicionar
              </button>
            </form>
          </>
        )}
      </div>

      {selectedProduct && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recipes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhum ingrediente cadastrado para este produto</td></tr>
              ) : (
                recipes.map(recipe => (
                  <tr key={recipe.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{recipe.materialNome}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">{recipe.quantidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{recipe.materialUnidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(recipe.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
