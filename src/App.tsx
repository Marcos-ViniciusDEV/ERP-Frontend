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
import Usuarios from "./pages/cadastros/Usuarios";
import Departamentos from "./pages/cadastros/Departamentos";
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
import RelatorioSangrias from "@/pages/relatorios/RelatorioSangrias";
import ResumoDiarioVendas from "@/pages/relatorios/ResumoDiarioVendas";
import RelacaoProdutos from "@/pages/relatorios/RelacaoProdutos";
import ResumoPorProduto from "@/pages/relatorios/ResumoPorProduto";
import ResumosMarcasVendas from "@/pages/relatorios/ResumosMarcasVendas";
import ResumoPorDocumento from "@/pages/relatorios/ResumoPorDocumento";
import ResumoPorDocumentoCancelamentos from "@/pages/relatorios/ResumoPorDocumentoCancelamentos";
import ResumoMovimento from "@/pages/relatorios/ResumoMovimento";
import MovimentoHierarquico from "@/pages/relatorios/MovimentoHierarquico";
import MesaDeMovimento from "@/pages/relatorios/MesaDeMovimento";
import ResumoLancamento from "@/pages/relatorios/ResumoLancamento";
import ResumoFaturamentos from "@/pages/relatorios/ResumoFaturamentos";
import RelacaoNotasContribuintes from "@/pages/relatorios/RelacaoNotasContribuintes";
import PosicaoEtiquetasDiario from "@/pages/relatorios/PosicaoEtiquetasDiario";
import ResumoMovimentoUnidades from "@/pages/relatorios/ResumoMovimentoUnidades";
import ResumoTipoMovimento from "@/pages/relatorios/ResumoTipoMovimento";
import RelatorioEmDesenvolvimento from "@/pages/relatorios/RelatorioEmDesenvolvimento";
import { Login } from "./pages/Login";

import ConferenciaMercadoria from "./pages/estoque/ConferenciaMercadoria";
import { useEffect } from "react";
import { setAuthToken } from "./_core/hooks/useAuth";
import GerenciarPDV from "./pages/pdv/GerenciarPDV";
import GestaoOfertas from "./pages/GestaoOfertas";
import GestaoMateriais from "./pages/estoque/GestaoMateriais";
import GestaoReceitas from "./pages/estoque/GestaoReceitas";
import LancamentoProducao from "./pages/estoque/LancamentoProducao";

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

      <Route path={"/"} component={Home} />
      {/* Cadastros */}
      <Route path={"/cadastros/clientes"} component={Clientes} />
      <Route path={"/cadastros/usuarios"} component={Usuarios} />
      <Route path="/cadastros/departamentos" component={Departamentos} />
      <Route path={"/estoque/produtos"} component={Produtos} />
      <Route path={"/compras/fornecedores"} component={Fornecedores} />
      <Route path={"/financeiro/pagar"} component={ContasPagar} />
      <Route path="/estoque/entrada" component={EntradaMercadoria} />
      <Route path="/estoque/conferencia" component={ConferenciaMercadoria} />
      <Route path="/estoque/materiais" component={GestaoMateriais} />
      <Route path="/estoque/receitas" component={GestaoReceitas} />
      <Route path="/estoque/producao" component={LancamentoProducao} />
      <Route path={"/estoque/baixas"} component={BaixasManuais} />
      <Route path={"/estoque/inventario"} component={Inventario} />
      <Route path={"/financeiro/receber"} component={ContasReceber} />
      <Route path={"/compras/pedidos"} component={PedidosCompra} />
      <Route path={"/vendas/consultar"} component={ConsultarVendas} />
      <Route path={"/vendas/ofertas"} component={GestaoOfertas} />
      <Route path={"/financeiro/caixa"} component={MovimentacaoCaixa} />
      <Route path={"/utilitarios/etiquetas"} component={Etiquetas} />
      <Route path="/relatorios/posicao-estoques" component={PosicaoEstoques} />
      <Route
        path="/relatorios/movimento-vendedores"
        component={MovimentoVendedores}
      />
      <Route
        path="/relatorios/sangrias"
        component={RelatorioSangrias}
      />
      <Route
        path="/relatorios/resumo-diario-vendas"
        component={ResumoDiarioVendas}
      />
      
      {/* Relatórios em Desenvolvimento */}
      <Route path="/relatorios/resumo-documento" component={ResumoPorDocumento} />
      <Route path="/relatorios/resumo-documento-cancelamentos" component={ResumoPorDocumentoCancelamentos} />
      <Route path="/relatorios/relacao-produtos" component={RelacaoProdutos} />
      <Route path="/relatorios/resumo-movimento" component={ResumoMovimento} />
      <Route path="/relatorios/movimento-unidades" component={ResumoMovimentoUnidades} />
      <Route path="/relatorios/tipo-movimento" component={ResumoTipoMovimento} />
      <Route path="/relatorios/marcas-vendas" component={ResumosMarcasVendas} />
      <Route path="/relatorios/movimento-hierarquico" component={MovimentoHierarquico} />
      <Route path="/relatorios/mesa-movimento" component={MesaDeMovimento} />
      <Route path="/relatorios/resumo-lancamento" component={ResumoLancamento} />
      <Route path="/relatorios/resumo-produto" component={ResumoPorProduto} />
      <Route path="/relatorios/resumo-faturamentos" component={ResumoFaturamentos} />
      <Route path="/relatorios/notas-contribuintes" component={RelacaoNotasContribuintes} />
      <Route path="/relatorios/etiquetas-diario" component={PosicaoEtiquetasDiario} />

      <Route path="/pdv/gerenciar" component={GerenciarPDV} />
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
