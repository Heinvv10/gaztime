# Gaz Time Pod POS

Tablet-optimized Point of Sale application for Gaz Time pod/kiosk operators handling walk-in LPG sales.

## 🚀 Quick Start

```bash
# Install dependencies (from monorepo root)
cd /home/hein/clawd/gaztime/app
pnpm install

# Start development server
cd apps/pod
pnpm dev

# Run tests
pnpm test
```

**Dev Server:** http://localhost:3005  
**Demo PIN:** 1234

## 📱 Features

### 1. **Login** (`/`)
- Large tablet-friendly PIN entry
- Visual feedback with dot indicators
- Error handling for incorrect PINs

### 2. **POS Main Screen** (`/pos`)
- **Quick-sell tiles:** 9kg (R350), 3kg (R150), 1kg (R80), 48kg (R1,200)
- Real-time stock level indicators
- Customer lookup by phone number
- Payment method selection (Cash, Mobile Money, Voucher, Wallet)
- Shopping cart with running total
- One-tap checkout when payment selected

### 3. **Sale Confirmation** (`/sale-confirmation`)
- Digital receipt preview
- SMS receipt option
- Print receipt mock
- Cylinder serial QR code scanner
- Auto-redirect after 5 seconds

### 4. **Customer Registration** (`/customer-registration`)
- Register new walk-in customers
- Capture name, phone, address, landmark
- Generate loyalty QR code
- Optional Fibre Time account linking

### 5. **Stock Management** (`/stock`)
- Visual stock gauges by cylinder size
- Low stock alerts (< 5 units)
- Receive stock from depot flow
- QR scanner for incoming cylinders
- Empty cylinder return logging

### 6. **Daily Reports** (`/reports`)
- Today's revenue and sales count
- Units sold breakdown
- Payment method analysis
- Sales by product
- Cash reconciliation tool
- Customer footfall tracking

### 7. **Customer Orders** (`/orders`)
- Place delivery orders for walk-ins
- Schedule future deliveries
- Handle complaints and returns
- Safety warnings for gas leaks

### 8. **Shift Management** (`/shift`)
- Clock in/out functionality
- Live shift duration tracking
- Handover checklist (stock counted, cash reconciled, workspace cleaned, issues reported)
- Shift notes for next operator

## 🎨 Design

- **Colors:** Teal (#2BBFB3), Yellow (#F7C948)
- **Theme:** Light (optimized for indoor bright lighting)
- **Touch targets:** Minimum 60px, 80px for primary actions
- **Animations:** Success pulse, error shake (CSS-based)

## 🧪 Testing

**30 tests** covering:
- LoginPage (5 tests)
- POSPage (8 tests)
- usePodStore (9 tests)
- CustomerRegistration (3 tests)
- ShiftManagement (5 tests)

```bash
pnpm test        # Run tests
pnpm test:ui     # Run with UI
```

## 🛠️ Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (custom teal/yellow theme)
- **React Router v6** (protected routes)
- **Zustand** (state management)
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **Vitest** + **React Testing Library** (TDD)

## 📦 Mock Data

**Location:** Gaz Time Pod - Town Centre, Burgersfort  
**Operator:** Nomsa Mabasa (PIN: 1234)  
**Customers:** Thabo Malema (0823456789), Nomsa Dlamini (0712345678)  
**Stock:** Mixed levels of 1kg, 3kg, 9kg, 48kg cylinders  
**Orders:** 15-20 realistic transaction history

## 🏗️ Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/             # Route pages (8 screens)
│   ├── LoginPage.tsx
│   ├── POSPage.tsx
│   ├── SaleConfirmationPage.tsx
│   ├── CustomerRegistrationPage.tsx
│   ├── StockManagementPage.tsx
│   ├── DailyReportsPage.tsx
│   ├── CustomerOrdersPage.tsx
│   └── ShiftManagementPage.tsx
├── store/             # Zustand store
│   └── usePodStore.ts
├── lib/               # Utilities and mock data
│   └── mockData.ts
├── test/              # Test files
└── App.tsx            # Router setup
```

## 🔄 State Management (Zustand)

Key state:
- `isAuthenticated`, `operator`, `shiftStartTime`
- `products`, `stock`, `customers`, `orders`
- `cart`, `selectedCustomer`, `paymentMethod`

Key actions:
- `login()`, `logout()`
- `addToCart()`, `removeFromCart()`, `setPaymentMethod()`
- `completeSale()` (creates order, updates stock, clears cart)
- `receiveStock()`, `updateStock()`
- `addCustomer()`, `findCustomerByPhone()`
- `startShift()`, `endShift()`

## 🎯 Key Requirements Met

✅ Tablet-optimized (landscape 1024px+ primary, portrait compatible)  
✅ HUGE touch targets (operators may have wet/dirty hands)  
✅ High contrast, clear typography  
✅ Quick-sell ONE TAP to start sale  
✅ Cash drawer mock integration  
✅ Prominent stock level indicators  
✅ Success/error feedback animations  
✅ TDD with 30 passing tests  
✅ Runs on localhost:3005 (3004 in use)  
✅ Builds and starts successfully

## 🚨 Important Notes

- Port 3004 was occupied (likely AnythingLLM), so app runs on **port 3005**
- better-sqlite3 dependency compilation was skipped (not needed for pod app)
- Uses pnpm workspace setup (requires `pnpm-workspace.yaml`)
- All routes protected except login (redirects to `/` if not authenticated)

## 📝 Development Commands

```bash
pnpm dev         # Start dev server (port 3005)
pnpm build       # Build for production
pnpm preview     # Preview production build
pnpm test        # Run tests
pnpm lint        # Lint code
```

---

**Built with ❤️ for Gaz Time**  
Operator-friendly. Tablet-optimized. TDD-first.
