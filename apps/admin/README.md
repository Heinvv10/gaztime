# Gaz Time Admin Dashboard

Professional admin dashboard for managing Gaz Time LPG delivery operations in Burgersfort.

## 🚀 Features

- **Dashboard (Home)** - Real-time KPIs, charts, live operations map, recent orders, and alerts
- **Live Operations Map** - Full-screen map with driver tracking, pod locations, and active delivery routes
- **Orders Management** - Comprehensive order tracking with filtering, search, and detail views
- **Customer Management** - Customer database with segmentation, order history, and analytics
- **Inventory Management** - Stock levels, cylinder registry, and location-based tracking
- **Fleet Management** - Driver and vehicle management with performance metrics
- **Pods Management** - Retail kiosk overview with sales and stock levels
- **Finance** - Revenue tracking, breakdown by product/channel/payment method
- **Reports** - Configurable reports with data visualization and export capabilities
- **Settings** - System configuration, user management, and preferences

## 🎨 Design

- **Brand Colors:**
  - Primary Teal: `#2BBFB3`
  - Accent Yellow: `#F7C948`
  - Dark Navy: `#1a1a2e`
  - Sidebar Dark: `#0f172a`

- **Modern SaaS UI** - Clean, professional design inspired by Linear, Vercel, and Stripe
- **Dark Sidebar** - Professional navigation with brand colors
- **Responsive** - Mobile-first design that works on all screen sizes

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Recharts** - Data visualization
- **Leaflet** - Interactive maps
- **TanStack Table** - Data tables (ready to integrate)
- **Zustand** - State management
- **Vitest** - Unit testing
- **@testing-library/react** - Component testing

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Generate test coverage
npm run test:coverage

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 🔐 Login Credentials

**Demo Admin Account:**
- Email: `admin@gaztime.co.za`
- Password: `admin123`

## 🗺️ Mock Data

The dashboard uses realistic mock data for the Burgersfort area:
- South African names and phone numbers
- Real Burgersfort coordinates and landmarks
- Realistic sales figures and operational data
- 50 orders, 100 customers, 10 drivers, 12 vehicles, 3 pods, 200 cylinders

## 🧪 Testing

The project follows Test-Driven Development (TDD):
- Component tests for UI elements
- Utility function tests
- Integration tests for pages
- E2E tests ready to implement

Run tests:
```bash
npm test
```

## 🚀 Deployment

The dashboard connects to the API at `http://localhost:3333/api`.

To deploy:
1. Update API URL in `vite.config.ts`
2. Build: `npm run build`
3. Deploy the `dist/` folder to your hosting provider

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── ui/              # Reusable UI components
├── pages/               # Page components (one per route)
├── lib/
│   ├── utils.ts         # Utility functions
│   └── mock-data.ts     # Mock data for development
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── __tests__/           # Test files
├── App.tsx              # Main app component with routing
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## 🎯 Next Steps

1. **Backend Integration** - Connect to real API endpoints
2. **Real-time Updates** - Implement WebSocket for live data
3. **Advanced Filtering** - Add date range pickers, advanced search
4. **Export Functionality** - Implement PDF/CSV export
5. **User Management** - Full CRUD for admin users
6. **Audit Logs** - Track all admin actions
7. **Mobile App** - PWA capabilities for mobile access

## 📝 License

Copyright © 2026 Gaz Time. All rights reserved.
