import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePdvOnlineStore } from "./pdvOnlineStore";
import { toast } from "sonner";
import "./pdv-online.css";

// Interface for API product
interface Produto {
  id: number;
  descricao: string;
  codigoBarras?: string;
  precoVenda: number;
}

export default function PdvOnline() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { items, addItem, removeItem, setDiscount, clear, getNetTotal, getTotal, getDiscount } = usePdvOnlineStore();
  
  // State
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Produto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Produto[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authAction, setAuthAction] = useState<() => void>(() => {});
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // Load products
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/produtos");
        setProducts(res.data);
      } catch (e) {
        toast.error("Erro ao carregar produtos");
      }
    }
    load();
  }, []);

  // Filter products
  useEffect(() => {
    if (search) {
      if (/^\d+[xX]$/.test(search)) {
        setFilteredProducts([]);
        return;
      }
      const s = search.toLowerCase();
      const filtered = products.filter(p => 
        p.descricao?.toLowerCase().includes(s) || 
        p.codigoBarras?.includes(search) || 
        p.id.toString() === search
      );
      setFilteredProducts(filtered.slice(0, 10));
    } else {
      setFilteredProducts([]);
    }
  }, [search, products]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside a modal input (we will handle modal shortcuts separately)
      if (document.querySelector('.modal-bg')) return;
      
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F12") {
        e.preventDefault();
        if (items.length > 0) setShowPayment(true);
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (items.length > 0) handleDiscountRequest();
      }
      if (e.key === "F7") {
        e.preventDefault();
        if (items.length > 0) handleCancelRequest();
      }
      if (e.key === "Delete") {
        e.preventDefault();
        if (items.length > 0) {
          const idx = items.length - 1;
          requireAuth(() => removeItem(idx));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items]);

  const handleSelectProduct = (p: Produto) => {
    addItem({ ...p, quantity: multiplier });
    setSearch("");
    setFilteredProducts([]);
    setMultiplier(1);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const match = search.match(/^(\d+)[xX]$/);
      if (match) {
        const qty = parseInt(match[1]);
        if (qty > 0) {
          requireAuth(() => {
            setMultiplier(qty);
            setSearch("");
          });
          return;
        }
      }
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      } else {
        const exact = products.find(p => p.codigoBarras === search || p.id.toString() === search);
        if (exact) handleSelectProduct(exact);
        else if (!/^\d+[xX]$/.test(search)) toast.error("Produto não encontrado");
      }
    }
  };

  const requireAuth = (action: () => void) => {
    setAuthAction(() => action);
    setAuthPassword("");
    setShowAuth(true);
  };

  const handleAuthSubmit = async () => {
    try {
      const email = user?.email;
      if (!email) throw new Error("Sem email");
      await api.post("/auth/login", { email, senha: authPassword });
      setShowAuth(false);
      authAction();
    } catch (e) {
      toast.error("Senha inválida ou sem permissão");
    }
  };

  const handleDiscountRequest = () => {
    requireAuth(() => {
      setDiscountInput("");
      setShowDiscount(true);
    });
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      setDiscount(Math.round(val * 100));
      setShowDiscount(false);
    }
  };

  const handleCancelRequest = () => {
    requireAuth(() => {
      clear();
      toast.success("Venda cancelada");
    });
  };

  const formatMoney = (v: number) => `R$ ${(v/100).toFixed(2).replace('.', ',')}`;

  return (
    <div className="pdv-online">
      {/* Header */}
      <div className="pdv-hdr">
        <h1>CAIXA LIVRE (ONLINE)</h1>
        <div className="hdr-right">
          <div className="op-info">
            <span className="op-name">{user?.nome || user?.name || "Operador"}</span>
            <span className="op-role">Operador de Caixa</span>
          </div>
          <button className="btn-exit" onClick={() => setLocation("/dashboard")}>Sair</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pdv-body">
        {/* Left Side */}
        <div className="pdv-left">
          {/* Busca */}
          <div className="search-box">
            <input 
              ref={searchInputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={multiplier > 1 ? `${multiplier}x (Bipe o produto)` : "Buscar produto (F2)..."}
              autoFocus
            />
            {filteredProducts.length > 0 && (
              <div className="search-results">
                {filteredProducts.map(p => (
                  <div key={p.id} className="search-item" onClick={() => handleSelectProduct(p)}>
                    <span>{p.descricao}</span>
                    <span className="s-price">{formatMoney(p.precoVenda)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carrinho */}
          <div className="cart">
            <div className="cart-hdr"><h2>🛒 Itens da Venda ({items.length})</h2></div>
            <div className="cart-body">
              {items.length === 0 ? (
                <div className="cart-empty"><div className="icon">🛍️</div>Carrinho vazio</div>
              ) : (
                <table>
                  <thead><tr><th>#</th><th>Produto</th><th>Qtd</th><th>Unit</th><th>Total</th></tr></thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{it.name}<br/><small style={{color: 'var(--pdv-text2)'}}>{it.barcode}</small></td>
                        <td>{it.quantity}</td>
                        <td>{formatMoney(it.price)}</td>
                        <td>{formatMoney(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {getDiscount() > 0 && (
              <div className="cart-footer">
                <div style={{display:'flex', justifyContent:'space-between', color:'var(--pdv-text2)'}}>
                  <span>Subtotal</span><span>{formatMoney(getTotal())}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', color:'var(--pdv-danger)'}}>
                  <span>Desconto</span><span>-{formatMoney(getDiscount())}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="pdv-right">
          <div className="icard">
            <span className="lbl">Valor Total</span>
            <span className="val big">{formatMoney(getNetTotal())}</span>
          </div>

          <div className="icard" style={{flex: 1}}>
            <span className="lbl">Ações Rápidas</span>
            <div className="actions">
              <button className="act-btn primary" onClick={() => items.length && setShowPayment(true)}>
                <span className="key">F12</span><span>Finalizar Venda</span>
              </button>
              <button className="act-btn" onClick={handleDiscountRequest}>
                <span className="key">F9</span><span>Desconto</span>
              </button>
              <button className="act-btn" onClick={handleCancelRequest}>
                <span className="key">F7</span><span>Cancelar Cupom</span>
              </button>
              <button className="act-btn" onClick={() => { if(items.length) requireAuth(() => removeItem(items.length-1)) }}>
                <span className="key">DEL</span><span>Remover Último Item</span>
              </button>
            </div>
          </div>

          <div className="icard">
            <span className="lbl">Info do Caixa</span>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'var(--pdv-text2)'}}>Status</span>
              <span style={{color:'var(--pdv-success)', fontWeight:600}}>● Online</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop: 8}}>
              <span style={{color:'var(--pdv-text2)'}}>Data</span>
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAuth && (
        <div className="modal-bg">
          <div className="modal-box">
            <h2>Autorização Requerida</h2>
            <p style={{marginBottom: 16, color: 'var(--pdv-text2)'}}>Digite a senha do seu usuário para autorizar:</p>
            <input 
              type="password" 
              value={authPassword} 
              onChange={e => setAuthPassword(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
              autoFocus 
              placeholder="Senha"
              style={{marginBottom: 16}}
            />
            <div style={{display:'flex', gap:8}}>
              <button className="btn-s" onClick={() => setShowAuth(false)}>Cancelar</button>
              <button className="btn-p" onClick={handleAuthSubmit}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showDiscount && (
        <div className="modal-bg">
          <div className="modal-box">
            <h2>Aplicar Desconto</h2>
            <input 
              type="number" 
              value={discountInput} 
              onChange={e => setDiscountInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleApplyDiscount()}
              autoFocus 
              placeholder="Valor do desconto em R$"
              style={{marginBottom: 16}}
            />
            <div style={{display:'flex', gap:8}}>
              <button className="btn-s" onClick={() => setShowDiscount(false)}>Cancelar</button>
              <button className="btn-p" onClick={handleApplyDiscount}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); clear(); }} />
      )}
    </div>
  );
}

// Payment Modal Sub-Component
function PaymentModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { items, getNetTotal, getDiscount } = usePdvOnlineStore();
  const [payments, setPayments] = useState<{method:string, amount:number}[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("dinheiro");
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, getNetTotal() - totalPaid);
  const change = Math.max(0, totalPaid - getNetTotal());

  useEffect(() => {
    if (remaining > 0) setInputVal((remaining/100).toFixed(2));
  }, [remaining]);

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'F12' && remaining <= 0) handleFinalize();
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [remaining, payments]);

  const addPayment = () => {
    const val = Math.round(parseFloat(inputVal.replace(',','.')) * 100);
    if (!isNaN(val) && val > 0) {
      if (selectedMethod !== "dinheiro" && val > remaining) {
        toast.error("Só é permitido troco em dinheiro");
        return;
      }
      setPayments([...payments, { method: selectedMethod, amount: val }]);
      setInputVal("");
      inputRef.current?.focus();
    }
  };

  const handleFinalize = async () => {
    if (remaining > 0) return toast.error("Ainda há valor pendente");
    try {
      const payload = {
        formaPagamento: payments[0].method,
        desconto: getDiscount(),
        itens: items.map(i => ({
          produtoId: i.id,
          quantidade: i.quantity,
          precoUnitario: i.price,
          desconto: 0
        }))
      };
      await api.post("/vendas", payload);
      toast.success("Venda finalizada com sucesso!");
      
      // Print Coupon (simplified)
      const w = window.open("", "_blank", "width=400,height=600");
      if(w) {
        w.document.write(`
          <html><body style="font-family: monospace; text-align: center;">
            <h2>MERCADO EXEMPLO</h2>
            <hr/>
            <div style="text-align: left;">
              ${items.map(i => `<div>${i.quantity}x ${i.name} - R$ ${(i.price*i.quantity/100).toFixed(2)}</div>`).join('')}
            </div>
            <hr/>
            <h3>TOTAL: R$ ${(getNetTotal()/100).toFixed(2)}</h3>
            <h4>TROCO: R$ ${(change/100).toFixed(2)}</h4>
            <hr/>
            <p>Obrigado pela preferência!</p>
            <script>window.print();</script>
          </body></html>
        `);
        w.document.close();
      }
      onSuccess();
    } catch (e) {
      toast.error("Erro ao finalizar venda");
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal-box wide">
        <div style={{flex: 1}}>
          <h2>Pagamento</h2>
          <div style={{background: 'var(--pdv-bg2)', padding: 16, borderRadius: 8, marginBottom: 16}}>
            <div style={{fontSize: 24, fontWeight: 'bold', display:'flex', justifyContent:'space-between'}}>
              <span>Total:</span><span>R$ {(getNetTotal()/100).toFixed(2)}</span>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {["dinheiro", "cartao", "pix"].map(m => (
              <button 
                key={m} 
                className={`pay-method ${selectedMethod === m ? 'active' : ''}`}
                onClick={() => { setSelectedMethod(m); inputRef.current?.focus(); }}
              >
                {m.toUpperCase()} {selectedMethod === m && <span style={{marginLeft:'auto', fontSize:12}}>Selecionado</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex: 1, display:'flex', flexDirection:'column'}}>
          <div style={{background: 'var(--pdv-bg2)', padding: 16, borderRadius: 8}}>
            <label style={{display:'block', marginBottom: 8, color:'var(--pdv-text2)'}}>Valor (R$)</label>
            <input 
              ref={inputRef}
              type="number" 
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPayment()}
              autoFocus
              style={{fontSize: 24, textAlign: 'right'}}
            />
          </div>
          
          <div style={{flex: 1, marginTop: 16}}>
            {payments.map((p, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding: 8, borderBottom: '1px solid var(--pdv-border)'}}>
                <span>{p.method.toUpperCase()}</span>
                <span>R$ {(p.amount/100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop: 16, borderTop: '1px solid var(--pdv-border)', paddingTop: 16}}>
            {remaining > 0 ? (
              <div style={{display:'flex', justifyContent:'space-between', fontSize:20, color:'var(--pdv-danger)'}}>
                <span>Falta:</span><span>R$ {(remaining/100).toFixed(2)}</span>
              </div>
            ) : (
              <div style={{display:'flex', justifyContent:'space-between', fontSize:20, color:'var(--pdv-success)'}}>
                <span>Troco:</span><span>R$ {(change/100).toFixed(2)}</span>
              </div>
            )}
            <div style={{display:'flex', gap: 8, marginTop: 16}}>
              <button className="btn-s" onClick={onClose}>Cancelar (ESC)</button>
              <button className="btn-p" onClick={handleFinalize} disabled={remaining > 0}>Finalizar (F12)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
