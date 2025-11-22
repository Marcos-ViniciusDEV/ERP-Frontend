/**
 * App - Aplicação Principal do ERP Minimalista
 *
 * Componente raiz que configura roteamento e providers globais.
 * Define todas as rotas do sistema e aplica tema/configurações globais.
 *
 * Estrutura:
 * - ErrorBoundary: Captura erros React
 * - ThemeProvider: Gerenciamento de tema
 * - TooltipProvider: Tooltips globais
 * - Toaster: Notificações toast
 * - Router: Roteamento de páginas
 *
 * Rotas Públicas:
 * - /login - Página de login
 * - /register - Registro de usuário
 *
 * Rotas Protegidas:
 * - / - Dashboard
 * - /estoque/* - Gestão de estoque
 * - /vendas/* - Gestão de vendas
 * - /compras/* - Gestão de compras
 * - /financeiro/* - Gestão financeira
 * - /relatorios/* - Relatórios
 * - /utilitarios/* - Utilitários
 *
 * @component
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Produtos from "./pages/estoque/Produtos";
import Clientes from "./pages/cadastros/Clientes";
import Fornecedores from "./pages/compras/Fornecedores";
import ContasPagar from "./pages/financeiro/ContasPagar";
import EntradaMercadoria from "@/pages/estoque/EntradaMercadoria";
import BaixasManuais from "./pages/estoque/BaixasManuais";
import Inventario from "./pages/estoque/Inventario";
import ContasReceber from "./pages/financeiro/ContasReceber";
import PedidosCompra from "./pages/compras/PedidosCompra";
import ConsultarVendas from "./pages/vendas/ConsultarVendas";
import MovimentacaoCaixa from "./pages/vendas/MovimentacaoCaixa";
import Etiquetas from "./pages/Etiquetas";
import PosicaoEstoques from "@/pages/relatorios/PosicaoEstoques";
import MovimentoVendedores from "@/pages/relatorios/MovimentoVendedores";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import ConferenciaMercadoria from "./pages/estoque/ConferenciaMercadoria";
import { useEffect } from "react";
import { setAuthToken } from "./_core/hooks/useAuth";

/**
 * Componente de Roteamento
 * Define todas as rotas da aplicação
 */
function Router() {
  // Capturar token do OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setAuthToken(token);
      // Limpar URL
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/"} component={Home} />
      <Route path={"/estoque/produtos"} component={Produtos} />
      <Route path={"/cadastros/clientes"} component={Clientes} />
      <Route path={"/compras/fornecedores"} component={Fornecedores} />
      <Route path={"/financeiro/pagar"} component={ContasPagar} />
      <Route path="/estoque/entrada" component={EntradaMercadoria} />
      <Route path="/estoque/conferencia" component={ConferenciaMercadoria} />
      <Route path={"/estoque/baixas"} component={BaixasManuais} />
      <Route path={"/estoque/inventario"} component={Inventario} />
      <Route path={"/financeiro/receber"} component={ContasReceber} />
      <Route path={"/compras/pedidos"} component={PedidosCompra} />
      <Route path={"/vendas/consultar"} component={ConsultarVendas} />
      <Route path={"/financeiro/caixa"} component={MovimentacaoCaixa} />
      <Route path={"/utilitarios/etiquetas"} component={Etiquetas} />
      <Route path="/relatorios/posicao-estoques" component={PosicaoEstoques} />
      <Route
        path="/relatorios/movimento-vendedores"
        component={MovimentoVendedores}
      />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
