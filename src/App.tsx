/**
 * App - Aplicação Principal do Trakto ERP
 *
 * Componente raiz que configura roteamento e providers globais.
 * Define todas as rotas do sistema e aplica tema/configurações globais.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Produtos from "./pages/estoque/Produtos";
import ProdutosSemVenda from "./pages/estoque/ProdutosSemVenda";
import Clientes from "./pages/cadastros/Clientes";
import Funcionarios from "./pages/cadastros/Funcionarios";
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
import PosicaoEstoques from "./pages/relatorios/PosicaoEstoques";
import MovimentoVendedores from "./pages/relatorios/MovimentoVendedores";
import RelatorioSangrias from "./pages/relatorios/RelatorioSangrias";
import ResumoDiarioVendas from "./pages/relatorios/ResumoDiarioVendas";
import RelacaoProdutos from "./pages/relatorios/RelacaoProdutos";
import ResumoPorProduto from "./pages/relatorios/ResumoPorProduto";
import ResumosMarcasVendas from "./pages/relatorios/ResumosMarcasVendas";
import ResumoPorDocumento from "./pages/relatorios/ResumoPorDocumento";
import ResumoPorDocumentoCancelamentos from "./pages/relatorios/ResumoPorDocumentoCancelamentos";
import ResumoMovimento from "./pages/relatorios/ResumoMovimento";
import MovimentoHierarquico from "./pages/relatorios/MovimentoHierarquico";
import MesaDeMovimento from "./pages/relatorios/MesaDeMovimento";
import ResumoLancamento from "./pages/relatorios/ResumoLancamento";
import ResumoFaturamentos from "./pages/relatorios/ResumoFaturamentos";
import RelacaoNotasContribuintes from "./pages/relatorios/RelacaoNotasContribuintes";
import PosicaoEtiquetasDiario from "./pages/relatorios/PosicaoEtiquetasDiario";
import ResumoMovimentoUnidades from "./pages/relatorios/ResumoMovimentoUnidades";
import ResumoTipoMovimento from "./pages/relatorios/ResumoTipoMovimento";

import { Login } from "./pages/Login";
import { LandingPage } from "./pages/LandingPage";
import { Onboarding } from "./pages/Onboarding";
import { Profile } from "./pages/Profile";

import ConferenciaMercadoria from "./pages/estoque/ConferenciaMercadoria";
import { useEffect } from "react";
import { setAuthToken, useAuth } from "./_core/hooks/useAuth";
import { hasPermission } from "./_core/utils/permissions";
import GerenciarPDV from "./pages/pdv/GerenciarPDV";
import PdvOnline from "./pages/pdv/PdvOnline";
import GestaoOfertas from "./pages/GestaoOfertas";
import Producao from "./pages/estoque/Producao";
import GestaoDevolucoes from "./pages/vendas/GestaoDevolucoes";
import DashboardMetas from "./pages/relatorios/DashboardMetas";
import CurvaABC from "./pages/relatorios/CurvaABC";
import SupermercadoFeatures from "./pages/SupermercadoFeatures";
import AuthPage from "./pages/AuthPage";
import AdminSaasDashboard from "./pages/admin/AdminSaasDashboard";
import GestaoEmpresas from "./pages/admin/GestaoEmpresas";
import GestaoPlanos from "./pages/admin/GestaoPlanos";
import GestaoAssinaturas from "./pages/admin/GestaoAssinaturas";
import GestaoPDVs from "./pages/admin/GestaoPDVs";
import GestaoLicencas from "./pages/admin/GestaoLicencas";
import AdminLogin from "./pages/admin/AdminLogin";
import Bloqueado from "./pages/Bloqueado";
import CentralSuporte from "./pages/suporte/CentralSuporte";
import GestaoSuporte from "./pages/admin/GestaoSuporte";
import GestaoTutoriais from "./pages/admin/GestaoTutoriais";
import ConfiguracoesFiscais from "./pages/fiscal/ConfiguracoesFiscais";
import GerenciadorNotasFiscais from "./pages/fiscal/GerenciadorNotasFiscais";

/**
 * Componente que encapsula a lógica de proteção de rotas com RBAC
 */
function PermissionRoute({
  path,
  component: Component,
  permission,
}: {
  path: string;
  component: React.ComponentType<any>;
  permission?: string;
}) {
  return (
    <Route path={path}>
      {(params) => {
        const { user, loading } = useAuth();
        if (loading) return null;
        if (!user) return <Redirect to="/login" />;
        
        // Validação da permissão do usuário logado
        if (permission && !hasPermission(user, permission)) {
          return <Redirect to="/dashboard" />;
        }
        
        return <Component {...params} />;
      }}
    </Route>
  );
}

function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  return (
    <Route path={path}>
      {(params) => {
        const { user, loading } = useAuth();
        if (loading) return null;
        if (!user) return <Redirect to="/admin/login" />;
        if (user.role !== "trakto_admin") return <Redirect to="/dashboard" />;
        return <Component {...params} />;
      }}
    </Route>
  );
}

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

  return (
    <Switch>
      {/* Rotas Públicas */}
      <Route path={"/"} component={LandingPage} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={AuthPage} />
      <Route path={"/auth"} component={AuthPage} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/bloqueado"} component={Bloqueado} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin"}><Redirect to="/admin/saas" /></Route>

      {/* Rotas Protegidas (exigem autenticação) */}
      <Route path={"/dashboard"} component={Home} />
      <Route path={"/profile"} component={Profile} />

      {/* Cadastros */}
      <PermissionRoute path={"/cadastros/clientes"} component={Clientes} permission="cadastros_clientes" />
      <PermissionRoute path={"/cadastros/usuarios"} component={Usuarios} permission="cadastros_usuarios" />
      <PermissionRoute path={"/cadastros/funcionarios"} component={Funcionarios} permission="cadastros_usuarios" />
      <PermissionRoute path="/cadastros/departamentos" component={Departamentos} permission="cadastros_departamentos" />
      <PermissionRoute path={"/estoque/produtos"} component={Produtos} permission="estoque_produtos" />
      <PermissionRoute path={"/estoque/produtos-sem-venda"} component={ProdutosSemVenda} permission="relatorios_ver" />
      <PermissionRoute path={"/compras/fornecedores"} component={Fornecedores} permission="compras_fornecedores" />
      <PermissionRoute path={"/financeiro/pagar"} component={ContasPagar} permission="financeiro_pagar" />
      <PermissionRoute path="/estoque/entrada" component={EntradaMercadoria} permission="estoque_entrada" />
      <PermissionRoute path="/estoque/conferencia" component={ConferenciaMercadoria} permission="estoque_conferencia" />
      <PermissionRoute path={"/estoque/producao"} component={Producao} permission="estoque_producao" />
      <PermissionRoute path={"/estoque/baixas"} component={BaixasManuais} permission="estoque_baixas" />
      <PermissionRoute path={"/estoque/inventario"} component={Inventario} permission="estoque_inventario" />
      <PermissionRoute path={"/financeiro/receber"} component={ContasReceber} permission="financeiro_receber" />
      <PermissionRoute path={"/compras/pedidos"} component={PedidosCompra} permission="compras_pedidos" />

      <PermissionRoute path={"/vendas/consultar"} component={ConsultarVendas} permission="vendas_consultar" />
      <PermissionRoute path={"/vendas/ofertas"} component={GestaoOfertas} permission="vendas_ofertas" />
      <PermissionRoute path={"/vendas/devolucoes"} component={GestaoDevolucoes} permission="vendas_devolucoes" />
      <PermissionRoute path={"/vendas/nfe"} component={GerenciadorNotasFiscais} permission="vendas_consultar" />
      <PermissionRoute path={"/financeiro/caixa"} component={MovimentacaoCaixa} permission="financeiro_caixa" />
      <PermissionRoute path={"/fiscal/configuracoes"} component={ConfiguracoesFiscais} permission="cadastros_usuarios" />
      <PermissionRoute path={"/utilitarios/etiquetas"} component={Etiquetas} permission="utilitarios_etiquetas" />
      
      {/* Relatórios */}
      <PermissionRoute path="/relatorios/posicao-estoques" component={PosicaoEstoques} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/movimento-vendedores" component={MovimentoVendedores} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/sangrias" component={RelatorioSangrias} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-diario-vendas" component={ResumoDiarioVendas} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-documento" component={ResumoPorDocumento} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-documento-cancelamentos" component={ResumoPorDocumentoCancelamentos} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/relacao-produtos" component={RelacaoProdutos} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-movimento" component={ResumoMovimento} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/movimento-unidades" component={ResumoMovimentoUnidades} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/tipo-movimento" component={ResumoTipoMovimento} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/marcas-vendas" component={ResumosMarcasVendas} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/movimento-hierarquico" component={MovimentoHierarquico} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/mesa-movimento" component={MesaDeMovimento} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-lancamento" component={ResumoLancamento} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-produto" component={ResumoPorProduto} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/resumo-faturamentos" component={ResumoFaturamentos} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/notas-contribuintes" component={RelacaoNotasContribuintes} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/etiquetas-diario" component={PosicaoEtiquetasDiario} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/metas" component={DashboardMetas} permission="relatorios_ver" />
      <PermissionRoute path="/relatorios/curva-abc" component={CurvaABC} permission="relatorios_ver" />
      
      <Route path="/solucoes/supermercado" component={SupermercadoFeatures} />
      <PermissionRoute path="/pdv/gerenciar" component={GerenciarPDV} permission="pdv_gerenciar" />
      <PermissionRoute path="/pdv/online" component={PdvOnline} permission="pdv_online" />
      <PermissionRoute path="/suporte/central" component={CentralSuporte} />
      <AdminRoute path="/admin/saas" component={AdminSaasDashboard} />
      <AdminRoute path="/admin/empresas" component={GestaoEmpresas} />
      <AdminRoute path="/admin/planos" component={GestaoPlanos} />
      <AdminRoute path="/admin/assinaturas" component={GestaoAssinaturas} />
      <AdminRoute path="/admin/pdvs" component={GestaoPDVs} />
      <AdminRoute path="/admin/licencas" component={GestaoLicencas} />
      <AdminRoute path="/admin/suporte" component={GestaoSuporte} />
      <AdminRoute path="/admin/tutoriais" component={GestaoTutoriais} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
