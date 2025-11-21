# frontend

Frontend para o sistema ERP

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-ISC-green.svg) ![Deploy Status](https://img.shields.io/badge/deploy-pending-yellow.svg)

## Sumário

- [Guia de Instalação](#guia-de-instalação)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Tecnologias](#tecnologias)

## Guia de Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>

# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## Rotas da Aplicação

| Rota                  | Descrição                     |
| --------------------- | ----------------------------- |
| `/login`              | Página de Login               |
| `/register`           | Página de Registro de Usuário |
| `/`                   | Dashboard Principal (Home)    |
| `/cadastros/clientes` | Gestão de Clientes            |
| `/404`                | Página não encontrada         |

## Tecnologias

### Dependencies

- `@hookform/resolvers`
- `@radix-ui/react-*` (Vários componentes UI)
- `@tailwindcss/postcss`
- `@tanstack/react-query`
- `axios`
- `class-variance-authority`
- `clsx`
- `cmdk`
- `date-fns`
- `embla-carousel-react`
- `framer-motion`
- `input-otp`
- `lucide-react`
- `next-themes`
- `react`
- `react-day-picker`
- `react-dom`
- `react-hook-form`
- `react-resizable-panels`
- `recharts`
- `sonner`
- `streamdown`
- `tailwind-merge`
- `tailwindcss-animate`
- `vaul`
- `wouter`
- `zod`

### DevDependencies

- `@types/google.maps`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `autoprefixer`
- `postcss`
- `tailwindcss`
- `typescript`
- `vite`
