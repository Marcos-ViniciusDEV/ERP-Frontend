import { create } from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  barcode: string;
  quantity: number;
}

interface PdvOnlineState {
  items: CartItem[];
  discount: number;
  addItem: (product: any) => void;
  removeItem: (index: number) => void;
  setDiscount: (v: number) => void;
  clear: () => void;
  getTotal: () => number;
  getDiscount: () => number;
  getNetTotal: () => number;
}

export const usePdvOnlineStore = create<PdvOnlineState>()((set, get) => ({
  items: [],
  discount: 0,
  addItem: (product) => {
    const items = get().items;
    const qty = product.quantity || 1;
    const idx = items.findIndex((i) => i.id === product.id);
    if (idx >= 0) {
      const n = [...items];
      n[idx].quantity += qty;
      set({ items: n });
    } else {
      set({ items: [...items, { id: product.id, name: product.name || product.descricao, price: product.price || product.precoVenda, barcode: product.barcode || product.codigoBarras || '', quantity: qty }] });
    }
  },
  removeItem: (index: number) => set((s: PdvOnlineState) => ({ items: s.items.filter((_: any, i: number) => i !== index) })),
  setDiscount: (v: number) => set({ discount: v }),
  clear: () => set({ items: [], discount: 0 }),
  getTotal: () => get().items.reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0),
  getDiscount: () => get().discount,
  getNetTotal: () => Math.max(0, get().getTotal() - get().getDiscount()),
}));
