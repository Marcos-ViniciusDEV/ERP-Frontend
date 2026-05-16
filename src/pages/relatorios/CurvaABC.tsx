import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { BarChart, Filter } from 'lucide-react';

interface ABCItem {
  produtoId: number;
  produtoNome: string;
  totalVendido: number;
  quantidadeVendida: number;
  percentageOfTotal: number;
  accumulatedPercentage: number;
  classification: 'A' | 'B' | 'C';
}

export default function CurvaABC() {
  const [, setLoading] = useState(false);
  const [data, setData] = useState<ABCItem[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/abc', {
        params: { startDate, endDate }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar curva ABC:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BarChart className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Curva ABC de Produtos</h1>
        </div>
        
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['A', 'B', 'C'].map(classType => {
          const items = data.filter(i => i.classification === classType);
          const total = items.reduce((acc, i) => acc + i.totalVendido, 0);
          const count = items.length;
          
          return (
            <div key={classType} className={`p-6 rounded-lg border ${
              classType === 'A' ? 'bg-green-50 border-green-200' :
              classType === 'B' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">Classe {classType}</h3>
                <span className="text-sm font-medium opacity-75">
                  {classType === 'A' ? '80% do Faturamento' :
                   classType === 'B' ? '15% do Faturamento' :
                   '5% do Faturamento'}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(total)}
              </div>
              <div className="text-sm opacity-75">
                {count} produtos ({((count / data.length) * 100 || 0).toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-6 font-medium text-gray-600">Classificação</th>
              <th className="py-3 px-6 font-medium text-gray-600">Produto</th>
              <th className="py-3 px-6 font-medium text-gray-600 text-right">Vendas (R$)</th>
              <th className="py-3 px-6 font-medium text-gray-600 text-center">Qtd.</th>
              <th className="py-3 px-6 font-medium text-gray-600 text-right">% Total</th>
              <th className="py-3 px-6 font-medium text-gray-600 text-right">% Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item.produtoId} className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getClassificationColor(item.classification)}`}>
                    {item.classification}
                  </span>
                </td>
                <td className="py-3 px-6 font-medium">{item.produtoNome}</td>
                <td className="py-3 px-6 text-right font-medium text-gray-900">
                  {formatCurrency(item.totalVendido)}
                </td>
                <td className="py-3 px-6 text-center text-gray-600">
                  {item.quantidadeVendida}
                </td>
                <td className="py-3 px-6 text-right text-gray-600">
                  {item.percentageOfTotal.toFixed(2)}%
                </td>
                <td className="py-3 px-6 text-right text-gray-600">
                  {item.accumulatedPercentage.toFixed(2)}%
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenhum dado encontrado para o período selecionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
