# Frontend - ERP Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-19.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)
![Tailwind](https://img.shields.io/badge/tailwind-4.1-38bdf8.svg)

Modern web interface for complete ERP system with inventory, sales, purchases, and financial management.

---

## 📑 Table of Contents

- [Installation](#-installation)
- [Features](#-features)
- [Technologies](#-technologies)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running

### Steps

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

Access at: `http://localhost:8080`

---

## ✨ Features

### 📦 Inventory Management
- **Products**: Complete CRUD with barcode generation
- **Stock Control**: Real-time inventory tracking
- **Kardex**: Detailed movement history
- **Inventory Counting**: Physical count reconciliation
- **Departments**: Product categorization

### 💰 Sales Management
- **Sales Dashboard**: Real-time metrics and charts
- **Order Management**: Create and track sales
- **Customer Management**: Complete customer database
- **Payment Tracking**: Multiple payment methods
- **Sales Reports**: Detailed analytics

### 🛒 Purchase Management
- **Purchase Orders**: Create and manage orders
- **Supplier Management**: Supplier database
- **NFe Integration**: Invoice verification
- **Automatic Stock Updates**: On order receipt

### 💵 Financial Control
- **Accounts Receivable**: Track customer payments
- **Accounts Payable**: Manage supplier payments
- **Cash Flow**: Real-time financial overview
- **Reports**: Detailed financial analytics

### 🏪 PDV Integration
- **Real-time Sync**: Live updates from PDV
- **WebSocket**: Instant notifications
- **Sales Consolidation**: Centralized view
- **Multi-PDV Support**: Manage multiple points of sale

### 🎨 UI/UX
- **Modern Design**: Clean and intuitive interface
- **Dark Mode**: Theme switching support
- **Responsive**: Mobile-friendly design
- **Accessibility**: WCAG compliant
- **Components**: Radix UI + Tailwind CSS

---

## 🛠 Technologies

### Core
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wouter** - Lightweight routing

### UI Components
- **Radix UI** - Accessible components
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Charts and graphs

### State & Data
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client

### Utilities
- **date-fns** - Date manipulation
- **clsx** - Conditional classes
- **sonner** - Toast notifications
- **jsbarcode** - Barcode generation

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Radix + Tailwind)
│   │   └── ...           # Feature components
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Produtos.tsx
│   │   ├── Vendas.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   │   ├── api.ts       # API client
│   │   └── utils.ts     # Helper functions
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

---

## 🔐 Environment Variables

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Optional
VITE_WS_URL=ws://localhost:3000
```

---

## 📜 Scripts

```bash
npm run dev      # Start development server (port 8080)
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🎨 UI Components

### Base Components (Radix UI)
- Accordion, Alert Dialog, Avatar
- Checkbox, Dialog, Dropdown Menu
- Label, Popover, Progress
- Radio Group, Select, Slider
- Switch, Tabs, Tooltip
- And more...

### Custom Components
- DataTable - Advanced tables with sorting/filtering
- Charts - Sales and financial charts
- Forms - Validated form components
- Modals - Reusable modal dialogs
- Navigation - Sidebar and header

---

## 🌐 API Integration

The frontend communicates with the backend API using:
- **Axios** for HTTP requests
- **TanStack Query** for caching and state management
- **WebSocket** for real-time updates

### Example API Call

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function ProductsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/api/produtos').then(res => res.data)
  });

  // ...
}
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy Options
- **Vercel** - Recommended for Vite apps
- **Netlify** - Easy deployment
- **AWS S3 + CloudFront** - Scalable hosting
- **Docker** - Containerized deployment

---

## 📝 License

 Author: Marcos Vinicius
 Last Updated: November 2025

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.
