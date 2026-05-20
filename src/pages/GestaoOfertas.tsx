/**
 * GestaoOfertas — Motor de Promoções Avançado
 *
 * Funcionalidades:
 * - Criação de ofertas com 4 tipos de desconto: Preço Fixo, % Desconto, Leve X Pague Y, % no 2º Item
 * - Agendamento com data e hora (promoções relâmpago)
 * - Toggle de ativação/pausar sem excluir
 * - Cards de resumo por status
 * - Filtros por status e tipo de desconto
 * - Design premium com gradientes e animações
 */

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { format, isAfter, isBefore } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Tag,
  Plus,
  Trash2,
  Pencil,
  Power,
  PowerOff,
  X,
  Search,
  Filter,
  Percent,
  DollarSign,
  ShoppingCart,
  Gift,
  Calendar,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertCircle,
  Timer,
  Package,
  Sparkles,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoDesconto = 'PRECO_FIXO' | 'PERCENTUAL' | 'LEVE_X_PAGUE_Y' | 'DESCONTO_SEGUNDO';

interface Offer {
  id: number;
  produtoId: number;
  nome: string | null;
  tipoDesconto: TipoDesconto;
  precoOferta: number;
  percentualDesconto: number;
  qtdLeve: number;
  qtdPague: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string | null;
  horaFim: string | null;
  aplicacaoAutomatica: boolean;
  ativo: boolean;
  createdAt: string;
  produto?: {
    id: number;
    descricao: string;
    precoVenda: number;
    codigo: string;
  } | null;
}

interface Product {
  id: number;
  descricao: string;
  precoVenda: number;
  codigo: string;
  codigoBarras?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPOS: Record<TipoDesconto, { label: string; icon: React.ReactNode; color: string; bg: string; description: string }> = {
  PRECO_FIXO: {
    label: 'Preço Fixo',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-100 border-emerald-200',
    description: 'Define um preço especial fixo para o produto',
  },
  PERCENTUAL: {
    label: '% Desconto',
    icon: <Percent className="w-4 h-4" />,
    color: 'text-blue-700',
    bg: 'bg-blue-100 border-blue-200',
    description: 'Aplica um percentual de desconto sobre o preço atual',
  },
  LEVE_X_PAGUE_Y: {
    label: 'Leve X Pague Y',
    icon: <ShoppingCart className="w-4 h-4" />,
    color: 'text-purple-700',
    bg: 'bg-purple-100 border-purple-200',
    description: 'Ex: Leve 3, Pague 2. O cliente paga menos itens',
  },
  DESCONTO_SEGUNDO: {
    label: '% no 2º Item',
    icon: <Gift className="w-4 h-4" />,
    color: 'text-orange-700',
    bg: 'bg-orange-100 border-orange-200',
    description: 'Aplica desconto nos itens pares (2º, 4º, 6º...)',
  },
};

function getStatus(offer: Offer): 'ativa' | 'agendada' | 'expirada' | 'pausada' {
  if (!offer.ativo) return 'pausada';
  const now = new Date();
  const start = new Date(offer.dataInicio);
  const end = new Date(offer.dataFim);
  if (isBefore(now, start)) return 'agendada';
  if (isAfter(now, end)) return 'expirada';
  return 'ativa';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'ativa':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ativa' };
    case 'agendada':
      return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Agendada' };
    case 'expirada':
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Expirada' };
    case 'pausada':
      return { dot: 'bg-red-400', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Pausada' };
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200', label: status };
  }
}

function formatDesconto(offer: Offer): string {
  switch (offer.tipoDesconto) {
    case 'PRECO_FIXO':
      return `R$ ${(offer.precoOferta / 100).toFixed(2)}`;
    case 'PERCENTUAL':
      return `${offer.percentualDesconto}% OFF`;
    case 'LEVE_X_PAGUE_Y':
      return `Leve ${offer.qtdLeve} Pague ${offer.qtdPague}`;
    case 'DESCONTO_SEGUNDO':
      return `${offer.percentualDesconto}% no 2º item`;
    default:
      return '—';
  }
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Componente do formulário de criação/edição ───────────────────────────────

interface OfferFormData {
  produtoId: string;
  nome: string;
  tipoDesconto: TipoDesconto;
  precoOferta: string;
  percentualDesconto: string;
  qtdLeve: string;
  qtdPague: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  usarHora: boolean;
  aplicacaoAutomatica: boolean;
}

const defaultForm: OfferFormData = {
  produtoId: '',
  nome: '',
  tipoDesconto: 'PERCENTUAL',
  precoOferta: '',
  percentualDesconto: '10',
  qtdLeve: '3',
  qtdPague: '2',
  dataInicio: '',
  dataFim: '',
  horaInicio: '08:00',
  horaFim: '22:00',
  usarHora: false,
  aplicacaoAutomatica: true,
};

// ─── Modal de Formulário ──────────────────────────────────────────────────────

interface OfferModalProps {
  products: Product[];
  editOffer?: Offer | null;
  onClose: () => void;
  onSaved: () => void;
}

function OfferModal({ products, editOffer, onClose, onSaved }: OfferModalProps) {
  const [form, setForm] = useState<OfferFormData>(() => {
    if (editOffer) {
      return {
        produtoId: String(editOffer.produtoId),
        nome: editOffer.nome || '',
        tipoDesconto: editOffer.tipoDesconto,
        precoOferta: editOffer.precoOferta ? (editOffer.precoOferta / 100).toFixed(2) : '',
        percentualDesconto: String(editOffer.percentualDesconto || 10),
        qtdLeve: String(editOffer.qtdLeve || 3),
        qtdPague: String(editOffer.qtdPague || 2),
        dataInicio: editOffer.dataInicio ? format(new Date(editOffer.dataInicio), "yyyy-MM-dd'T'HH:mm") : '',
        dataFim: editOffer.dataFim ? format(new Date(editOffer.dataFim), "yyyy-MM-dd'T'HH:mm") : '',
        horaInicio: editOffer.horaInicio || '08:00',
        horaFim: editOffer.horaFim || '22:00',
        usarHora: !!(editOffer.horaInicio || editOffer.horaFim),
        aplicacaoAutomatica: editOffer.aplicacaoAutomatica ?? true,
      };
    }
    return defaultForm;
  });

  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const selectedProduct = products.find(p => p.id === Number(form.produtoId));
  const filteredProducts = productSearch
    ? products.filter(p =>
        p.descricao.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.codigo.includes(productSearch) ||
        (p.codigoBarras || '').includes(productSearch)
      ).slice(0, 8)
    : [];

  const precoOriginal = selectedProduct?.precoVenda || 0;
  const precoOfertaNum = parseFloat(form.precoOferta.replace(',', '.')) * 100 || 0;

  // Preview do desconto
  const previewDesconto = useMemo(() => {
    if (!selectedProduct) return null;
    switch (form.tipoDesconto) {
      case 'PRECO_FIXO': {
        if (!precoOfertaNum) return null;
        const economia = precoOriginal - precoOfertaNum;
        const pct = ((economia / precoOriginal) * 100).toFixed(1);
        return { texto: `Economia de ${formatCurrency(economia)} (${pct}% OFF)`, cor: economia > 0 ? 'emerald' : 'red' };
      }
      case 'PERCENTUAL': {
        const pct = Number(form.percentualDesconto);
        if (!pct) return null;
        const desconto = Math.round(precoOriginal * (pct / 100));
        return { texto: `De ${formatCurrency(precoOriginal)} por ${formatCurrency(precoOriginal - desconto)}`, cor: 'blue' };
      }
      case 'LEVE_X_PAGUE_Y': {
        const leve = Number(form.qtdLeve);
        const pague = Number(form.qtdPague);
        if (!leve || !pague || leve <= pague) return null;
        const total = pague * precoOriginal;
        const sem = leve * precoOriginal;
        return { texto: `Leve ${leve} por ${formatCurrency(total)} (economize ${formatCurrency(sem - total)})`, cor: 'purple' };
      }
      case 'DESCONTO_SEGUNDO': {
        const pct = Number(form.percentualDesconto);
        if (!pct) return null;
        const desconto = Math.round(precoOriginal * (pct / 100));
        return { texto: `2º item: de ${formatCurrency(precoOriginal)} por ${formatCurrency(precoOriginal - desconto)}`, cor: 'orange' };
      }
    }
  }, [form, selectedProduct, precoOriginal, precoOfertaNum]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.produtoId || !form.dataInicio || !form.dataFim) {
      toast.warning('Preencha produto e período da promoção');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        produtoId: Number(form.produtoId),
        nome: form.nome || TIPOS[form.tipoDesconto].label,
        tipoDesconto: form.tipoDesconto,
        precoOferta: form.tipoDesconto === 'PRECO_FIXO' ? Math.round(parseFloat(form.precoOferta.replace(',', '.')) * 100) : 0,
        percentualDesconto: ['PERCENTUAL', 'DESCONTO_SEGUNDO'].includes(form.tipoDesconto) ? Number(form.percentualDesconto) : 0,
        qtdLeve: form.tipoDesconto === 'LEVE_X_PAGUE_Y' ? Number(form.qtdLeve) : 3,
        qtdPague: form.tipoDesconto === 'LEVE_X_PAGUE_Y' ? Number(form.qtdPague) : 2,
        dataInicio: new Date(form.dataInicio).toISOString(),
        dataFim: new Date(form.dataFim).toISOString(),
        horaInicio: form.usarHora ? form.horaInicio : null,
        horaFim: form.usarHora ? form.horaFim : null,
        aplicacaoAutomatica: form.aplicacaoAutomatica,
        ativo: true,
      };

      if (editOffer) {
        await api.put(`/offers/${editOffer.id}`, payload);
        toast.success('Promoção atualizada com sucesso!');
      } else {
        await api.post('/offers', payload);
        toast.success('Promoção criada com sucesso!');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar promoção');
    } finally {
      setSaving(false);
    }
  }

  const tipo = TIPOS[form.tipoDesconto];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{editOffer ? 'Editar Promoção' : 'Nova Promoção'}</h2>
              <p className="text-sm text-gray-500">Configure todos os detalhes da oferta</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome da promoção */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome da Promoção</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Promoção de Final de Semana, Oferta Relâmpago..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Produto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Produto <span className="text-red-500">*</span>
            </label>
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selectedProduct.descricao}</p>
                  <p className="text-xs text-gray-500">Cód: {selectedProduct.codigo} • Preço: {formatCurrency(selectedProduct.precoVenda)}</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, produtoId: '' }))} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar por nome, código ou código de barras..."
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                />
                {filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                    {filteredProducts.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => { setForm(f => ({ ...f, produtoId: String(p.id) })); setProductSearch(''); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-50 text-left transition-colors border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[70%]">{p.descricao}</span>
                        <span className="text-xs font-bold text-emerald-600 ml-2 shrink-0">{formatCurrency(p.precoVenda)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tipo de Desconto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Promoção <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TIPOS) as TipoDesconto[]).map(t => {
                const info = TIPOS[t];
                const active = form.tipoDesconto === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm(f => ({ ...f, tipoDesconto: t }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? `${info.bg} border-current ${info.color} shadow-sm`
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${active ? info.color : 'text-gray-400'}`}>{info.icon}</span>
                    <div>
                      <div className="font-semibold text-sm leading-tight">{info.label}</div>
                      <div className="text-xs opacity-70 mt-0.5 leading-tight">{info.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos condicionais por tipo */}
          <div className={`rounded-xl border-2 p-4 space-y-4 ${tipo.bg} ${tipo.color}`}>
            <div className="flex items-center gap-2 font-semibold text-sm">
              {tipo.icon}
              <span>Configuração: {tipo.label}</span>
            </div>

            {form.tipoDesconto === 'PRECO_FIXO' && (
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-75">Preço de Oferta (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold opacity-60">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.precoOferta}
                    onChange={e => setForm(f => ({ ...f, precoOferta: e.target.value }))}
                    placeholder="0,00"
                    className="w-full bg-white/80 border border-current/20 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-current/30 font-bold"
                  />
                </div>
                {selectedProduct && precoOfertaNum > 0 && (
                  <p className="text-xs mt-1 opacity-70">
                    Preço normal: {formatCurrency(precoOriginal)}
                  </p>
                )}
              </div>
            )}

            {(form.tipoDesconto === 'PERCENTUAL' || form.tipoDesconto === 'DESCONTO_SEGUNDO') && (
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-75">
                  {form.tipoDesconto === 'DESCONTO_SEGUNDO' ? 'Desconto no 2º Item (%)' : 'Percentual de Desconto (%)'} *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={form.percentualDesconto}
                    onChange={e => setForm(f => ({ ...f, percentualDesconto: e.target.value }))}
                    className="flex-1 accent-current h-2"
                  />
                  <div className="relative w-24 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={form.percentualDesconto}
                      onChange={e => setForm(f => ({ ...f, percentualDesconto: e.target.value }))}
                      className="w-full bg-white/80 border border-current/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none text-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold opacity-60">%</span>
                  </div>
                </div>
                {/* Quick presets */}
                <div className="flex gap-1.5 mt-2">
                  {[5, 10, 15, 20, 25, 30, 50].map(v => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setForm(f => ({ ...f, percentualDesconto: String(v) }))}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition-all ${
                        Number(form.percentualDesconto) === v
                          ? 'bg-current/20 border-current/30'
                          : 'bg-white/60 border-current/10 hover:bg-current/10'
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.tipoDesconto === 'LEVE_X_PAGUE_Y' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-75">Quantidade Leve *</label>
                  <input
                    type="number"
                    min="2"
                    max="99"
                    value={form.qtdLeve}
                    onChange={e => setForm(f => ({ ...f, qtdLeve: e.target.value }))}
                    className="w-full bg-white/80 border border-current/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none text-center text-2xl"
                  />
                  <p className="text-xs mt-1 opacity-60 text-center">unidades</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-75">Quantidade Pague *</label>
                  <input
                    type="number"
                    min="1"
                    max={Number(form.qtdLeve) - 1}
                    value={form.qtdPague}
                    onChange={e => setForm(f => ({ ...f, qtdPague: e.target.value }))}
                    className="w-full bg-white/80 border border-current/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none text-center text-2xl"
                  />
                  <p className="text-xs mt-1 opacity-60 text-center">unidades</p>
                </div>
                <div className="col-span-2 text-center text-sm font-bold opacity-80">
                  Leve {form.qtdLeve || '?'} e Pague apenas {form.qtdPague || '?'}
                </div>
              </div>
            )}

            {/* Preview de economia */}
            {previewDesconto && (
              <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{previewDesconto.texto}</span>
              </div>
            )}
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Período da Promoção <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Início</label>
                <input
                  type="datetime-local"
                  value={form.dataInicio}
                  onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fim</label>
                <input
                  type="datetime-local"
                  value={form.dataFim}
                  onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Horário (promoção relâmpago) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Promoção Relâmpago (Horário)
              </label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, usarHora: !f.usarHora }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.usarHora ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.usarHora ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {form.usarHora && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <label className="block text-xs text-amber-700 font-medium mb-1">Das</label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                    className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-700 font-medium mb-1">Até</label>
                  <input
                    type="time"
                    value={form.horaFim}
                    onChange={e => setForm(f => ({ ...f, horaFim: e.target.value }))}
                    className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                  />
                </div>
                <p className="col-span-2 text-xs text-amber-600">
                  ⚡ A promoção só será aplicada entre {form.horaInicio} e {form.horaFim} nos dias do período acima
                </p>
              </div>
            )}
          </div>

          {/* Aplicação automática */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Aplicar automaticamente no PDV</p>
              <p className="text-xs text-gray-500">O desconto será aplicado quando o produto for escaneado</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, aplicacaoAutomatica: !f.aplicacaoAutomatica }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.aplicacaoAutomatica ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.aplicacaoAutomatica ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Salvando...</span></>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /><span>{editOffer ? 'Atualizar Promoção' : 'Criar Promoção'}</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de oferta ───────────────────────────────────────────────────────────

interface OfferCardProps {
  offer: Offer;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function OfferCard({ offer, onEdit, onToggle, onDelete }: OfferCardProps) {
  const status = getStatus(offer);
  const statusStyle = getStatusStyle(status);
  const tipo = TIPOS[offer.tipoDesconto];
  const produtoNome = offer.produto?.descricao || `Produto #${offer.produtoId}`;
  const precoOriginal = offer.produto?.precoVenda || 0;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden ${offer.ativo ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
      {/* Stripe colorida no topo */}
      <div className={`h-1 w-full ${
        offer.tipoDesconto === 'PRECO_FIXO' ? 'bg-emerald-500' :
        offer.tipoDesconto === 'PERCENTUAL' ? 'bg-blue-500' :
        offer.tipoDesconto === 'LEVE_X_PAGUE_Y' ? 'bg-purple-500' :
        'bg-orange-500'
      }`} />

      <div className="p-4">
        {/* Header do card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${tipo.bg} ${tipo.color}`}>
              {tipo.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{offer.nome || tipo.label}</p>
              <p className="text-xs text-gray-500 truncate">{produtoNome}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${status === 'ativa' ? 'animate-pulse' : ''}`} />
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Desconto */}
        <div className={`rounded-xl p-3 mb-3 ${tipo.bg} border ${tipo.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">{tipo.label}</span>
            <span className="text-lg font-black">{formatDesconto(offer)}</span>
          </div>
          {precoOriginal > 0 && offer.tipoDesconto === 'PRECO_FIXO' && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs line-through opacity-50">{formatCurrency(precoOriginal)}</span>
              <span className="text-xs font-bold text-emerald-600">
                -{((precoOriginal - offer.precoOferta) / precoOriginal * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Período */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>
            {format(new Date(offer.dataInicio), 'dd/MM/yy HH:mm')} → {format(new Date(offer.dataFim), 'dd/MM/yy HH:mm')}
          </span>
        </div>
        {offer.horaInicio && offer.horaFim && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-3">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Relâmpago: {offer.horaInicio} – {offer.horaFim}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {offer.aplicacaoAutomatica ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Auto PDV</span></>
            ) : (
              <><AlertCircle className="w-3.5 h-3.5" /><span>Manual</span></>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggle}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                offer.ativo
                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                  : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
              title={offer.ativo ? 'Pausar' : 'Ativar'}
            >
              {offer.ativo ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GestaoOfertas() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOffer, setEditOffer] = useState<Offer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersRes, productsRes] = await Promise.all([
        api.get('/offers'),
        api.get('/produtos'),
      ]);
      setOffers(offersRes.data);
      setProducts(productsRes.data);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir esta promoção?')) return;
    try {
      await api.delete(`/offers/${id}`);
      toast.success('Promoção excluída');
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await api.patch(`/offers/${id}/toggle`);
      setOffers(prev => prev.map(o => o.id === id ? { ...o, ativo: res.data.ativo } : o));
      toast.success(res.data.ativo ? 'Promoção ativada' : 'Promoção pausada');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    const ativas = offers.filter(o => getStatus(o) === 'ativa').length;
    const agendadas = offers.filter(o => getStatus(o) === 'agendada').length;
    const expiradas = offers.filter(o => getStatus(o) === 'expirada').length;
    const pausadas = offers.filter(o => getStatus(o) === 'pausada').length;
    return { ativas, agendadas, expiradas, pausadas, total: offers.length };
  }, [offers]);

  // Filtros
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const status = getStatus(o);
      if (filterStatus !== 'todos' && status !== filterStatus) return false;
      if (filterTipo !== 'todos' && o.tipoDesconto !== filterTipo) return false;
      if (searchTerm) {
        const nome = (o.nome || '').toLowerCase();
        const produto = (o.produto?.descricao || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        if (!nome.includes(search) && !produto.includes(search)) return false;
      }
      return true;
    });
  }, [offers, filterStatus, filterTipo, searchTerm]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Motor de Promoções</h1>
            </div>
            <p className="text-gray-500 text-sm ml-13">
              Crie e gerencie ofertas com desconto por preço fixo, percentual, leve X pague Y e mais
            </p>
          </div>
          <button
            onClick={() => { setEditOffer(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Nova Promoção
          </button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Ativas agora', value: stats.ativas, icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-100', filter: 'ativa' },
            { label: 'Agendadas', value: stats.agendadas, icon: <Timer className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-100', filter: 'agendada' },
            { label: 'Expiradas', value: stats.expiradas, icon: <AlertCircle className="w-5 h-5" />, color: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-100', filter: 'expirada' },
            { label: 'Pausadas', value: stats.pausadas, icon: <PowerOff className="w-5 h-5" />, color: 'from-red-400 to-rose-500', shadow: 'shadow-red-100', filter: 'pausada' },
          ].map(stat => (
            <button
              key={stat.filter}
              onClick={() => setFilterStatus(filterStatus === stat.filter ? 'todos' : stat.filter)}
              className={`text-left p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg ${stat.shadow} hover:scale-[1.02] transition-all ${filterStatus === stat.filter ? 'ring-2 ring-offset-2 ring-current' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="opacity-90">{stat.icon}</span>
                <BarChart3 className="w-4 h-4 opacity-50" />
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-xs font-semibold opacity-80 mt-0.5">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar promoção ou produto..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white"
            >
              <option value="todos">Todos os tipos</option>
              {(Object.keys(TIPOS) as TipoDesconto[]).map(t => (
                <option key={t} value={t}>{TIPOS[t].label}</option>
              ))}
            </select>

            {(filterStatus !== 'todos' || filterTipo !== 'todos' || searchTerm) && (
              <button
                onClick={() => { setFilterStatus('todos'); setFilterTipo('todos'); setSearchTerm(''); }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-xl transition-all border border-violet-200"
              >
                <X className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Grid de ofertas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Nenhuma promoção encontrada</h3>
            <p className="text-gray-400 text-sm mb-6">
              {offers.length === 0 ? 'Crie sua primeira promoção para começar' : 'Tente ajustar os filtros'}
            </p>
            {offers.length === 0 && (
              <button
                onClick={() => { setEditOffer(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Criar Primeira Promoção
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() => { setEditOffer(offer); setShowModal(true); }}
                onToggle={() => handleToggle(offer.id)}
                onDelete={() => handleDelete(offer.id)}
              />
            ))}
          </div>
        )}

        {/* Legenda dos tipos */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Tipos de Promoção</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(TIPOS) as TipoDesconto[]).map(t => {
              const info = TIPOS[t];
              return (
                <div key={t} className={`flex items-start gap-2 p-2.5 rounded-xl border ${info.bg} ${info.color}`}>
                  <span className="mt-0.5 shrink-0">{info.icon}</span>
                  <div>
                    <div className="font-semibold text-xs">{info.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{info.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <OfferModal
          products={products}
          editOffer={editOffer}
          onClose={() => { setShowModal(false); setEditOffer(null); }}
          onSaved={loadData}
        />
      )}
    </DashboardLayout>
  );
}
