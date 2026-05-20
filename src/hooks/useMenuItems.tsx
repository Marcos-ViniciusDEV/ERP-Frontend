import { useRightPanel } from "@/contexts/RightPanelContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission } from "@/_core/utils/permissions";

export interface MenuItem {
  label: string;
  items?: SubMenuItem[];
  action?: () => void;
  path?: string;
  permission?: string;
}

export interface SubMenuItem {
  label: string;
  path?: string;
  action?: () => void;
  items?: SubMenuItem[];
  separator?: boolean;
  permission?: string;
}

export function useMenuItems() {
  const { openPanel } = useRightPanel();
  const { user } = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: "/",
    },
    {
      label: "Cadastros",
      items: [
        { label: "Clientes", path: "/cadastros/clientes", permission: "cadastros_clientes" },
        { label: "Departamentos", path: "/cadastros/departamentos", permission: "cadastros_departamentos" },
        { label: "Produtos", path: "/estoque/produtos", permission: "estoque_produtos" },
        { label: "Fornecedores", path: "/compras/fornecedores", permission: "compras_fornecedores" },
        { label: "Usuários", path: "/cadastros/usuarios", permission: "cadastros_usuarios" },
      ],
    },
    {
      label: "Movimentos",
      items: [
        { label: "Vendas", path: "/vendas/consultar", permission: "vendas_consultar" },
        { label: "Entrada de Mercadoria", path: "/estoque/entrada", permission: "estoque_entrada" },
        { label: "Conferência de Mercadoria", path: "/estoque/conferencia", permission: "estoque_conferencia" },
        { label: "Baixas Manuais", path: "/estoque/baixas", permission: "estoque_baixas" },
        { label: "Movimentação de Caixa", path: "/financeiro/caixa", permission: "financeiro_caixa" },
        { label: "Pedidos de Compra", path: "/compras/pedidos", permission: "compras_pedidos" },
      ],
    },
    {
      label: "Módulos",
      items: [
        { label: "Produção", path: "/estoque/producao", permission: "estoque_producao" },
        { label: "Inventário", path: "/estoque/inventario", permission: "estoque_inventario" },
        { label: "Contas a Receber", path: "/financeiro/receber", permission: "financeiro_receber" },
        { label: "Contas a Pagar", path: "/financeiro/pagar", permission: "financeiro_pagar" },
      ],
    },
    {
      label: "Automação",
      items: [
        {
          label: "Importar NFe",
          action: () => openPanel(),
          permission: "estoque_entrada",
        },
        { label: "Backup Automático", path: "/automacao/backup", permission: "cadastros_usuarios" },
        {
          label: "Backup e Restauração",
          path: "/automacao/backup-restauracao",
          permission: "cadastros_usuarios",
        },
      ],
    },
    {
      label: "Relatórios",
      items: [
        {
          label: "Relatórios de Documentos",
          permission: "relatorios_ver",
          items: [
            {
              label: "Resumo Por Documento",
              path: "/relatorios/resumo-documento",
            },
            {
              label: "Resumo Por Documento / Cancelamentos",
              path: "/relatorios/resumo-documento-cancelamentos",
            },
          ],
        },
        { label: "Relação De Produtos", path: "/relatorios/relacao-produtos", permission: "relatorios_ver" },
        {
          label: "Resumos De Movimento",
          permission: "relatorios_ver",
          items: [
            {
              label: "Resumo de Movimento",
              path: "/relatorios/resumo-movemento", // fix minor typo
            },
            {
              label: "Resumos De Movimento/Unidades",
              path: "/relatorios/movimento-unidades",
            },
            {
              label: "Resumos De Tipo Movimento",
              path: "/relatorios/tipo-movimento",
            },
          ],
        },
        { label: "Resumos Marcas Vendas", path: "/relatorios/marcas-vendas", permission: "relatorios_ver" },
        { label: "Posição Dos Estoques", path: "/relatorios/posicao-estoques", permission: "relatorios_ver" },
        {
          label: "Movimento Hierárquico",
          path: "/relatorios/movimento-hierarquico",
          permission: "relatorios_ver",
        },
        { label: "Mesa De Movimento", path: "/relatorios/mesa-movimento", permission: "relatorios_ver" },
        {
          label: "Resumo De Lançamento",
          path: "/relatorios/resumo-lancamento",
          permission: "relatorios_ver",
        },
        {
          label: "Resumo Por Produto",
          permission: "relatorios_ver",
          items: [
            { label: "Resumo Por Produto", path: "/relatorios/resumo-produto" },
            {
              label: "Resumo Faturamentos",
              path: "/relatorios/resumo-faturamentos",
            },
          ],
        },
        {
          label: "Movimento Vendedores",
          path: "/relatorios/movimento-vendedores",
          permission: "relatorios_ver",
        },
        {
          label: "Relação Dos Notas de Contribuintes",
          path: "/relatorios/notas-contribuintes",
          permission: "relatorios_ver",
        },
        {
          label: "Posição dos Etiquetas Diário",
          path: "/relatorios/etiquetas-diario",
          permission: "relatorios_ver",
        },
        {
          label: "Relatórios PDV",
          permission: "relatorios_ver",
          items: [
            { label: "Vendas Tempo Real", path: "/relatorios/resumo-diario-vendas" },
            { label: "Relatório de Sangrias", path: "/relatorios/sangrias" },
          ]
        }
      ],
    },
    {
      label: "Configurações",
      items: [
        { label: "Parâmetros do Sistema", path: "/configuracoes/parametros", permission: "cadastros_usuarios" },
        { label: "Calculadora", path: "/configuracoes/calculadora" },
        {
          label: "Relatórios Personalizados",
          path: "/configuracoes/relatorios",
          permission: "relatorios_ver",
        },
        { label: "Usuários e Permissões", path: "/cadastros/usuarios", permission: "cadastros_usuarios" },
      ],
    },
    {
      label: "Utilitários",
      items: [
        { label: "Etiquetas", path: "/utilitarios/etiquetas", permission: "utilitarios_etiquetas" },
        { label: "Importação de Dados", path: "/utilitarios/importacao", permission: "cadastros_usuarios" },
      ],
    },
    {
      label: "PDV",
      items: [
        { label: "Gerenciar PDV", path: "/pdv/gerenciar", permission: "pdv_gerenciar" },
        { label: "PDV Online", path: "/pdv/online", permission: "pdv_online" },
      ],
    },
  ];

  // Função recursiva para filtrar menus e submenus
  const filterItems = (itemsList: any[]): any[] => {
    return itemsList
      .map(item => {
        const newItem = { ...item };
        if (newItem.items) {
          newItem.items = filterItems(newItem.items);
        }
        return newItem;
      })
      .filter(item => {
        // Se tem permissão cadastrada, valida
        if (item.permission && !hasPermission(user, item.permission)) {
          return false;
        }
        // Se é uma categoria que possui itens, mas todos os subitens foram filtrados, remove a categoria
        if (item.items && item.items.length === 0) {
          return false;
        }
        return true;
      });
  };

  return filterItems(menuItems);
}
