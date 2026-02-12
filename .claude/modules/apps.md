# Frontend Apps

## Overview
4 React + Vite apps sharing types via `@gaztime/shared`. Each app targets a different user role.

## Common Stack (all apps)
- React 18
- Vite (bundler + dev server)
- Tailwind CSS (styling)
- Zustand (state management)
- Vitest (testing)

## Admin Dashboard (`apps/admin`)

**Purpose**: Back-office management for operators

**Pages**:
| Page | File | Purpose |
|------|------|---------|
| Home | `HomePage.tsx` | Dashboard overview |
| Orders | `OrdersPage.tsx` | Order management |
| Customers | `CustomersPage.tsx` | Customer list/detail |
| Inventory | `InventoryPage.tsx` | Cylinder tracking |
| Fleet | `FleetPage.tsx` | Vehicles & drivers |
| Pods | `PodsPage.tsx` | POS location management |
| Finance | `FinancePage.tsx` | Revenue & payments |
| Reports | `ReportsPage.tsx` | Analytics |
| LiveMap | `LiveMapPage.tsx` | Real-time driver tracking |
| Settings | `SettingsPage.tsx` | System config |
| Login | `LoginPage.tsx` | Authentication |

**Store**: `stores/authStore.ts`

## Customer App (`apps/customer`)

**Purpose**: Customer-facing ordering app (PWA)

**Pages**:
| Page | File | Purpose |
|------|------|---------|
| Splash | `Splash.tsx` | App loading screen |
| Home | `Home.tsx` | Product browsing |
| OrderProduct | `OrderProduct.tsx` | Place an order |
| Orders | `Orders.tsx` | Order history |
| OrderTracking | `OrderTracking.tsx` | Live delivery tracking |
| Profile | `Profile.tsx` | Account settings |
| Wallet | `Wallet.tsx` | Balance & top-up |
| Referrals | `Referrals.tsx` | Refer-a-friend |
| Safety | `Safety.tsx` | Gas safety tips |
| Onboarding | `Onboarding.tsx` | First-time setup |

**Store**: `store/useStore.ts`

## Driver App (`apps/driver`)

**Purpose**: Driver delivery management

**Screens**:
| Screen | File | Purpose |
|--------|------|---------|
| Dashboard | `Dashboard.tsx` | Active deliveries |
| Login | `Login.tsx` | Driver auth |
| Navigation | `Navigation.tsx` | Turn-by-turn directions |
| DeliveryCompletion | `DeliveryCompletion.tsx` | Proof of delivery |
| OrderNotification | `OrderNotification.tsx` | New order alerts |
| StockManagement | `StockManagement.tsx` | Vehicle cylinder count |
| SafetyChecklist | `SafetyChecklist.tsx` | Pre-trip safety check |
| Earnings | `Earnings.tsx` | Driver earnings |

**Store**: `store/useStore.ts`

## Pod POS (`apps/pod`)

**Purpose**: Point-of-delivery terminal for physical stores

**Pages**:
| Page | File | Purpose |
|------|------|---------|
| Login | `LoginPage.tsx` | Operator auth |
| POS | `POSPage.tsx` | Point of sale |
| CustomerRegistration | `CustomerRegistrationPage.tsx` | Walk-in customer signup |
| CustomerOrders | `CustomerOrdersPage.tsx` | Customer order lookup |
| StockManagement | `StockManagementPage.tsx` | Pod inventory |
| ShiftManagement | `ShiftManagementPage.tsx` | Shift open/close |
| DailyReports | `DailyReportsPage.tsx` | End-of-day reports |
| SaleConfirmation | `SaleConfirmationPage.tsx` | Sale receipt |

**Store**: `store/usePodStore.ts`
