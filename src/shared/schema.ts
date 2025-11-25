export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string;
  role: "user" | "admin";
  createdAt: string | Date;
  updatedAt: string | Date;
  lastSignedIn: string | Date;
}

export interface Produto {
  id: number;
  codigo: string;
  codigoBarras: string | null;
  descricao: string;
  marca: string | null;
  departamentoId: number | null;
  unidade: string;
  precoVenda: number;
  precoPdv: number;
  precoVenda2: number;
  precoAtacado: number;
  precoCusto: number;
  custoMedio: number;
  custoContabil: number;
  custoOperacional: number;
  custoFiscal: number;
  margemLucro: number;
  margemLucro2: number;
  margemLucro3: number;
  estoque: number;
  estoqueLoja: number;
  estoqueDeposito: number;
  estoqueTroca: number;
  estoqueMinimo: number;
  dataUltimaCompra: string | Date | null;
  quantidadeUltimaCompra: number;
  dataPrimeiraVenda: string | Date | null;
  ativo: boolean;
  controlaEstoque: boolean;
  permiteDesconto: boolean;
  localizacao: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Venda {
  id: number;
  numeroVenda: string;
  dataVenda: string | Date;
  valorTotal: number;
  valorDesconto: number;
  valorLiquido: number;
  formaPagamento: string | null;
  status: "CONCLUIDA" | "CANCELADA";
  operadorId: number | null;
  observacao: string | null;
  createdAt: string | Date;
}

export interface Cliente {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Fornecedor {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ContaPagar {
  id: number;
  descricao: string;
  fornecedorId: number | null;
  valor: number;
  dataVencimento: string | Date;
  dataPagamento: string | Date | null;
  status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";
  observacao: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ContaReceber {
  id: number;
  descricao: string;
  clienteId: number | null;
  valor: number;
  dataVencimento: string | Date;
  dataRecebimento: string | Date | null;
  status: "PENDENTE" | "RECEBIDO" | "ATRASADO" | "CANCELADO";
  observacao: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Add other types as needed
export type InsertUser = Partial<User>;
export type InsertProduto = Partial<Produto>;
export type InsertVenda = Partial<Venda>;
export type InsertCliente = Partial<Cliente>;
export type InsertFornecedor = Partial<Fornecedor>;
export type InsertContaPagar = Partial<ContaPagar>;
export type InsertContaReceber = Partial<ContaReceber>;
