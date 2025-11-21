import { useRightPanel } from "@/contexts/RightPanelContext";

export interface MenuItem {
  label: string;
  items?: SubMenuItem[];
  action?: () => void;
}

export interface SubMenuItem {
  label: string;
  path?: string;
  action?: () => void;
  items?: SubMenuItem[];
  separator?: boolean;
}

export function useMenuItems() {
  const { openPanel } = useRightPanel();

  const menuItems: MenuItem[] = [
    {
      label: "Cadastros",
      items: [
        { label: "Clientes", path: "/cadastros/clientes" },
        { label: "Produtos", path: "/estoque/produtos" },
        { label: "Fornecedores", path: "/compras/fornecedores" },
        { label: "Estoques", path: "/estoque/consulta" },
      ],
    },
    {
      label: "Movimentos",
      items: [
        { label: "Vendas", path: "/vendas/consultar" },
        { label: "Entrada de Mercadoria", path: "/estoque/entrada" },
        { label: "Baixas Manuais", path: "/estoque/baixas" },
        { label: "Movimentação de Caixa", path: "/financeiro/caixa" },
        { label: "Pedidos de Compra", path: "/compras/pedidos" },
      ],
    },
    {
      label: "Módulos",
      items: [
        { label: "Inventário", path: "/estoque/inventario" },
        { label: "Contas a Receber", path: "/financeiro/receber" },
        { label: "Contas a Pagar", path: "/financeiro/pagar" },
        { label: "Pedidos de Compra", path: "/compras/pedidos" },
      ],
    },
    {
      label: "Automação",
      items: [
        {
          label: "Importar NFe",
          action: () => openPanel(),
        },
        { label: "Backup Automático", path: "/automacao/backup" },
        {
          label: "Backup e Restauração",
          path: "/automacao/backup-restauracao",
        },
      ],
    },
    {
      label: "Relatórios",
      items: [
        {
          label: "Relatórios de Documentos",
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
        { label: "Relação De Produtos", path: "/relatorios/relacao-produtos" },
        {
          label: "Resumos De Movimento",
          items: [
            {
              label: "Resumo de Movimento",
              path: "/relatorios/resumo-movimento",
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
        { label: "Resumos Marcas Vendas", path: "/relatorios/marcas-vendas" },
        { label: "Posição Dos Estoques", path: "/relatorios/posicao-estoques" },
        {
          label: "Movimento Hierárquico",
          path: "/relatorios/movimento-hierarquico",
        },
        { label: "Mesa De Movimento", path: "/relatorios/mesa-movimento" },
        {
          label: "Resumo De Lançamento",
          path: "/relatorios/resumo-lancamento",
        },
        {
          label: "Resumo Diário Vendas",
          path: "/relatorios/resumo-diario-vendas",
        },
        {
          label: "Resumo Por Produto",
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
        },
        {
          label: "Relação Dos Notas de Contribuintes",
          path: "/relatorios/notas-contribuintes",
        },
        {
          label: "Posição dos Etiquetas Diário",
          path: "/relatorios/etiquetas-diario",
        },
      ],
    },
    {
      label: "Configurações",
      items: [
        { label: "Parâmetros do Sistema", path: "/configuracoes/parametros" },
        { label: "Calculadora", path: "/configuracoes/calculadora" },
        {
          label: "Relatórios Personalizados",
          path: "/configuracoes/relatorios",
        },
        { label: "Usuários e Permissões", path: "/configuracoes/usuarios" },
      ],
    },
    {
      label: "Utilitários",
      items: [
        { label: "Etiquetas", path: "/utilitarios/etiquetas" },
        { label: "Importação de Dados", path: "/utilitarios/importacao" },
      ],
    },
    {
      label: "Específicos",
      items: [{ label: "Integrações", path: "/especificos/integracoes" }],
    },
  ];

  return menuItems;
}
