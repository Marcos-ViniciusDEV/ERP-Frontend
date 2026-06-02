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
  estoque?: number;
  controlaEstoque?: boolean;
}

interface Cliente {
  id: number;
  nome: string;
  cpfCnpj?: string | null;
  razaoSocial?: string | null;
}

export default function PdvOnline() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { items, addItem, removeItem, setDiscount, clear, getNetTotal, getTotal, getDiscount } = usePdvOnlineStore();
  
  // State
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Produto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
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
        const [produtosRes, clientesRes] = await Promise.all([
          api.get("/produtos"),
          api.get("/clientes"),
        ]);
        setProducts(produtosRes.data);
        setClientes(clientesRes.data);
      } catch (e) {
        toast.error("Erro ao carregar dados do PDV");
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
        if (items.length > 0) handleOpenPayment();
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

  const handleOpenPayment = () => {
    if (!items.length) return;
    setShowPayment(true);
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
        else if (!/^\d+[xX]$/.test(search)) toast.error("Produto nÃ£o encontrado");
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
      toast.error("Senha invÃ¡lida ou sem permissÃ£o");
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
            <div className="cart-hdr"><h2>ðŸ›’ Itens da Venda ({items.length})</h2></div>
            <div className="cart-body">
              {items.length === 0 ? (
                <div className="cart-empty"><div className="icon">ðŸ›ï¸</div>Carrinho vazio</div>
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
            <span className="lbl">AÃ§Ãµes RÃ¡pidas</span>
            <div className="actions">
              <button className="act-btn primary" onClick={handleOpenPayment}>
                <span className="key">F12</span><span>Finalizar Venda</span>
              </button>
              <button className="act-btn" onClick={handleDiscountRequest}>
                <span className="key">F9</span><span>Desconto</span>
              </button>
              <button className="act-btn" onClick={handleCancelRequest}>
                <span className="key">F7</span><span>Cancelar Cupom</span>
              </button>
              <button className="act-btn" onClick={() => { if(items.length) requireAuth(() => removeItem(items.length-1)) }}>
                <span className="key">DEL</span><span>Remover Ãšltimo Item</span>
              </button>
            </div>
          </div>

          <div className="icard">
            <span className="lbl">Info do Caixa</span>
            <div style={{marginBottom: 10}}>
              <span className="lbl" style={{display: 'block', marginBottom: 6}}>Cliente</span>
              <select
                value={clienteId}
                onChange={(event) => setClienteId(event.target.value)}
                style={{width: '100%'}}
              >
                <option value="">Consumidor nao identificado</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.razaoSocial || cliente.nome}{cliente.cpfCnpj ? ` - ${cliente.cpfCnpj}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'var(--pdv-text2)'}}>Status</span>
              <span style={{color:'var(--pdv-success)', fontWeight:600}}>â— Online</span>
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
            <h2>AutorizaÃ§Ã£o Requerida</h2>
            <p style={{marginBottom: 16, color: 'var(--pdv-text2)'}}>Digite a senha do seu usuÃ¡rio para autorizar:</p>
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
        <PaymentModal clienteId={clienteId} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); clear(); setClienteId(""); }} />
      )}
    </div>
  );
}

const ONLINE_PAYMENT_METHODS = [
  { id: "dinheiro", label: "DINHEIRO", shortcut: "F1" },
  { id: "debito", label: "DEBITO", shortcut: "F2" },
  { id: "credito", label: "CREDITO", shortcut: "F3" },
  { id: "pix", label: "PIX", shortcut: "F4" },
];

const getOnlinePaymentLabel = (method: string) =>
  ONLINE_PAYMENT_METHODS.find((item) => item.id === method)?.label || method.toUpperCase();

// Payment Modal Sub-Component
function PaymentModal({ clienteId, onClose, onSuccess }: { clienteId: string, onClose: () => void, onSuccess: () => void }) {
  const { items, getNetTotal, getDiscount, getTotal } = usePdvOnlineStore();
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
      const shortcutMethod = ONLINE_PAYMENT_METHODS.find((method) => method.shortcut === e.key.toUpperCase());
      if (shortcutMethod) {
        e.preventDefault();
        setSelectedMethod(shortcutMethod.id);
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 0);
        return;
      }

      if (e.key === 'Escape') onClose();
      if (e.key === 'F12' && remaining <= 0) handleFinalize();
    };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
  }, [remaining, payments, selectedMethod]);

  const addPayment = () => {
    const val = Math.round(parseFloat(inputVal.replace(',','.')) * 100);
    if (!isNaN(val) && val > 0) {
      if (selectedMethod !== "dinheiro" && val > remaining) {
        toast.error("SÃ³ Ã© permitido troco em dinheiro");
        return;
      }
      setPayments([...payments, { method: selectedMethod, amount: val }]);
      setInputVal("");
      inputRef.current?.focus();
    }
  };

  const handleFinalize = async () => {
    if (payments.length === 0) return toast.error("Adicione uma forma de pagamento");
    if (remaining > 0) return toast.error("Ainda hÃ¡ valor pendente");
    try {
      const payload = {
        clienteId: clienteId ? Number(clienteId) : undefined,
        formaPagamento: payments[0].method,
        desconto: getDiscount(),
        itens: items.map(i => ({
          produtoId: i.id,
          quantidade: i.quantity,
          precoUnitario: i.price,
          desconto: 0
        }))
      };
      const res = await api.post("/vendas", payload);
      const sale = res.data;
      toast.success("Venda finalizada com sucesso!");
      
      // Print Coupon (matching desktop PDV style and structure)
      const width = 400;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const w = window.open("", "_blank", `width=${width},height=${height},top=${top},left=${left}`);
      
      if(w) {
        const html = `
          <html>
            <head>
              <title>Cupom Fiscal</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { vertical-align: top; padding: 2px 0; }
              </style>
            </head>
            <body>
              <div class="text-center bold">MERCADO EXEMPLO LTDA</div>
              <div class="text-center">CNPJ: 12.345.678/0001-90</div>
              
              <div class="divider"></div>
              
              <div class="text-center bold">CUPOM FISCAL ELETRÃ”NICO</div>
              <div class="text-center">CCF: ${sale.ccf || "000000"} COO: ${sale.coo || "000000"}</div>
              
              <div class="divider"></div>
              
              <table>
                ${items.map((item, index) => `
                  <tr>
                    <td colspan="4">${(index + 1).toString().padStart(3, "0")} ${item.id} ${item.name}</td>
                  </tr>
                  <tr>
                    <td>${item.quantity} UN</td>
                    <td class="text-right">${(item.price / 100).toFixed(2)}</td>
                    <td class="text-right">${(item.price * item.quantity / 100).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </table>
              
              <div class="divider"></div>
              
              <div class="text-right">SUBTOTAL R$ ${(getTotal() / 100).toFixed(2)}</div>
              ${getDiscount() > 0 ? `<div class="text-right">DESCONTO R$ -${(getDiscount() / 100).toFixed(2)}</div>` : ''}
              <div class="text-right bold">TOTAL R$ ${(getNetTotal() / 100).toFixed(2)}</div>
              
              <div class="divider"></div>
              
              ${payments.map(p => {
                const methodLabel = getOnlinePaymentLabel(p.method);
                return `
                  <div class="text-right">
                    ${methodLabel} R$ ${(p.amount / 100).toFixed(2)}
                  </div>
                `;
              }).join("")}
              
              <div class="text-right">TROCO R$ ${(change / 100).toFixed(2)}</div>
              
              <div class="divider"></div>
              <div class="text-center">OBRIGADO PELA PREFERÃŠNCIA!</div>
              <script>window.print();</script>
            </body>
          </html>
        `;
        w.document.write(html);
        w.document.close();
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Erro ao finalizar venda");
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
            {ONLINE_PAYMENT_METHODS.map((method) => (
              <button 
                key={method.id}
                className={`pay-method ${selectedMethod === method.id ? 'active' : ''}`}
                onClick={() => { setSelectedMethod(method.id); inputRef.current?.focus(); }}
              >
                <span>{method.shortcut}</span>
                <span style={{ marginLeft: 8 }}>{method.label}</span>
                {selectedMethod === method.id && <span style={{marginLeft:'auto', fontSize:12}}>Selecionado</span>}
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
                <span>{getOnlinePaymentLabel(p.method)}</span>
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

