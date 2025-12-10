import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Target, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface GoalPerformance {
  month: number;
  year: number;
  target: number;
  achieved: number;
  percentage: number;
  remaining: number;
}

export default function DashboardMetas() {
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<GoalPerformance | null>(null);
  const [targetAmount, setTargetAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/goals', {
        params: { month, year }
      });
      setPerformance(response.data.data);
      if (response.data.data.target) {
        setTargetAmount((response.data.data.target / 100).toString());
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast.error('Erro ao carregar dados de metas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [month, year]);

  const handleSaveGoal = async () => {
    if (!targetAmount) return;

    try {
      await api.post('/analytics/goals', {
        month,
        year,
        targetAmount: Math.round(Number(targetAmount) * 100) // Converter para centavos
      });
      toast.success('Meta atualizada com sucesso!');
      fetchPerformance();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar meta');
    }
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Target className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">Metas de Vendas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Período</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex-1 p-2 border rounded"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 p-2 border rounded"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Definir Meta</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0,00"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSaveGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 font-medium">Progresso</h3>
            <TrendingUp className={`w-5 h-5 ${performance && performance.percentage >= 100 ? 'text-green-500' : 'text-blue-500'}`} />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {performance ? `${performance.percentage.toFixed(1)}%` : '-'}
          </div>
          <p className="text-sm text-gray-500">da meta atingida</p>
        </div>
      </div>

      {performance && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Realizado: {formatCurrency(performance.achieved)}</span>
              <span>Meta: {formatCurrency(performance.target)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  performance.percentage >= 100 ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(performance.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-green-600 font-medium mb-1">Vendido</div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(performance.achieved)}
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-blue-600 font-medium mb-1">Meta</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(performance.target)}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-orange-600 font-medium mb-1">Falta</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(performance.remaining)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
