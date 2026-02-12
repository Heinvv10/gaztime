# Gaz Time Driver App 🚚

A dark-themed, mobile-optimized driver app for gas cylinder delivery drivers.

## ✅ Status: COMPLETE & RUNNING

- **URL:** http://localhost:3003
- **Tests:** 22 passing ✓
- **Dark Theme:** ✓
- **All 8 Screens:** ✓

## 🎨 Brand

- **Teal:** `#2BBFB3`
- **Yellow:** `#F7C948`
- **Dark Theme:** Optimized for outdoor use (less glare)

## 📱 Screens

### 1. Login
- Phone + PIN authentication
- Biometric option
- Auto-login support
- Demo credentials: `0765432109` / `1234`

### 2. Dashboard/Home
- Online/Offline toggle
- Delivery queue (5-8 pending orders)
- Today's earnings & stats
- Vehicle stock count
- Safety checklist alert

### 3. Order Notification
- Order details view
- Customer contact (Call/WhatsApp)
- Delivery address with landmarks
- Payment information
- Accept/Reject actions
- 3-minute timer

### 4. Navigation & Delivery
- Mock GPS map view
- Turn-by-turn directions (landmark-based)
- ETA & distance display
- Quick call/WhatsApp buttons
- "I've Arrived" action

### 5. Delivery Completion
- Cylinder QR code scanning
- Multiple proof methods:
  - OTP (6-digit)
  - Signature capture
  - Photo capture
- Payment collection (Cash/Digital)
- Swap tracking

### 6. Stock Management
- Current vehicle inventory
- Load stock (QR scanning)
- Return empties
- End-of-day reconciliation
- Stock breakdown (9kg/19kg)

### 7. Safety Checklist
- Daily vehicle inspection (5 items)
- Cylinder inspection (5 items)
- Incident report form
- SOS emergency button
- Emergency contacts

### 8. Earnings & History
- Daily/Weekly/Monthly views
- Earnings breakdown
- Performance metrics
- Delivery history
- Weekly trend chart

## 🛠 Tech Stack

- **React 18** + TypeScript
- **Vite** (blazing fast dev)
- **Tailwind CSS** (dark theme)
- **Zustand** (state management)
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **React Router v6** (navigation)
- **Vitest** + React Testing Library (TDD)

## 🚀 Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run driver app
cd apps/driver
pnpm dev

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui
```

## 🧪 Tests

**22 passing tests** including:

- Store/state management (11 tests)
- Login flow (4 tests)
- Dashboard functionality (5 tests)
- App routing (2 tests)

```bash
pnpm test:run  # Run once
pnpm test      # Watch mode
```

## 📦 Mock Data

**Driver:** Thabo Mokoena (Burgersfort area)

**Orders:** 5-8 pending deliveries with:
- Mix of statuses (assigned, confirmed)
- Burgersfort addresses with landmarks
- Different payment methods
- Various cylinder sizes (9kg, 19kg)

**Vehicle Stock:** 6 cylinders (4×9kg, 2×19kg)

## 🎯 Key Features

### Dark Theme
- Easier to read outdoors/in vehicle
- Reduced eye strain
- Less battery drain (OLED screens)

### Large Touch Targets
- Minimum 44px touch areas
- Driver-friendly (works with gloves)
- Easy one-handed operation

### Offline-First
- Sync status indicators
- Local state management
- Last sync timestamp

### Bottom Navigation
- 4 main sections (Home, Stock, Safety, Earnings)
- Always accessible
- Clear visual hierarchy

### Status Bar
- Online/Offline indicator
- Vehicle stock count
- Today's earnings

## 🔐 Demo Credentials

- **Phone:** `0765432109`
- **PIN:** `1234`
- **Driver:** Thabo Mokoena

## 📱 Responsive Design

- Works on 320px+ screens
- Mobile-first approach
- Touch-optimized UI
- No horizontal scroll

## 🚨 Safety Features

- Daily safety checklist
- Vehicle inspection (5 items)
- Cylinder inspection (5 items)
- SOS emergency button
- Incident reporting
- Emergency contacts

## 📊 Performance Tracking

- Real-time earnings
- Delivery count
- Average rating
- On-time percentage
- Delivery time metrics

## 🗺 Navigation Features

- Mock GPS map
- Turn-by-turn directions
- Landmark-based navigation (Burgersfort area)
- Distance & ETA
- Quick customer contact

## 💰 Payment Collection

- Cash collection
- Digital payment confirmation
- Amount verification
- Payment status tracking

## 📦 Stock Management

- QR code scanning
- Real-time inventory
- Load/unload tracking
- End-of-day reconciliation
- Size-based organization (9kg/19kg)

## 🔄 Order Lifecycle

1. **Order Notification** → Accept/Reject
2. **Navigation** → Drive to customer
3. **Delivery** → Scan cylinder, collect proof
4. **Completion** → Collect payment, confirm
5. **History** → View & rate

## 🎨 UI/UX Highlights

- Smooth animations (Framer Motion)
- Clear visual feedback
- Status badges
- Progress indicators
- Loading states
- Error handling
- Haptic-style interactions

## 📝 Notes

- Built as web app for demo purposes
- Will be wrapped in React Native for production
- All features fully functional
- Mock data for Burgersfort area
- Offline indicators (sync simulation)

---

**Status:** ✅ Ready for demo  
**Port:** 3003  
**Tests:** 22/22 passing  
**Theme:** Dark (outdoor optimized)
