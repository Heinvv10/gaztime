# Gaz Time Customer App 🔥

The flagship customer-facing Progressive Web App (PWA) for Gaz Time - LPG delivery in South African townships.

## 🎨 Design Principles

- **Mobile-first**: Optimized for 320px+ screens
- **Touch-friendly**: 48px minimum touch targets
- **Outdoor readable**: High contrast for sunlight visibility
- **Township-appropriate**: Culturally relevant imagery and language
- **Offline-capable**: Service worker caching and offline support
- **Fast**: Loading skeletons, optimistic updates, <3s load time

## 🎨 Brand Colors

```css
Primary Teal:  #2BBFB3
Accent Yellow: #F7C948
Dark Navy:     #1a1a2e
White:         #ffffff
Light Gray:    #f8f9fa
```

## 🚀 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling (utility-first)
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **vite-plugin-pwa** - Progressive Web App support

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/        # Layout components (BottomNav, Header)
│   └── ui/            # Reusable UI components (Button, Card)
├── pages/             # Page components (screens)
│   ├── auth/          # Authentication pages
│   ├── Home.tsx
│   ├── Orders.tsx
│   ├── Wallet.tsx
│   └── ...
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── mocks/             # Mock data for development
├── config/            # App configuration
├── test/              # Test setup and utilities
├── App.tsx            # Main app component with routing
├── main.tsx           # Entry point
└── index.css          # Global styles

```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Start Dev Server

```bash
npm run dev
```

App will be available at http://localhost:3000

### Run Tests

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📱 Features

### ✅ Implemented

1. **Splash & Onboarding** - Branded splash screen with 3-slide onboarding
2. **Authentication**
   - Phone number input
   - OTP verification
   - Profile setup (name + address with landmark)
3. **Home Screen**
   - Greeting with user name
   - Wallet balance card (teal gradient)
   - Product grid (1kg, 3kg, 9kg cylinders)
   - Reorder last order button
   - Promo banners
   - Safety tip card
4. **Order Flow**
   - Product detail page
   - Quantity selector
   - Delivery address selection
   - Payment method selection (Cash, Wallet, Voucher)
   - Order summary
   - Animated "Place Order" button
5. **Order Tracking**
   - Mock map with animated route
   - Driver info card with photo, rating, vehicle details
   - Call/WhatsApp driver buttons
   - ETA countdown
   - Order status timeline (5 stages)
   - Order details
6. **Orders History**
   - List of all orders with filters (All, Active, Completed)
   - Status badges
   - Reorder button
   - Expandable details
7. **Wallet**
   - Balance display (large, prominent)
   - Transaction list with icons
   - Top-up modal (EFT, Voucher, SnapScan)
   - Send gas / Redeem code quick actions
8. **Profile**
   - User info card
   - Menu sections (Account, Preferences, More)
   - Language selector link
   - Notification preferences link
   - Payment methods link
   - Safety info link
   - Help & Support link
   - Logout button
9. **Referrals**
   - Referral code (large, copyable)
   - QR code for sharing
   - Share via WhatsApp button
   - Referral stats (invited, joined, earned)
   - "How it works" explanation
10. **Safety Information**
    - Emergency "Report Gas Leak" button
    - 6 illustrated safety tips
    - Step-by-step connection guide
    - Emergency contact numbers
    - Warning messages

### 🎨 UI/UX Highlights

- **Animations**: Framer Motion for smooth transitions, micro-interactions
- **Gradients**: Teal-to-teal-dark gradients on cards
- **Loading states**: Skeletons instead of spinners
- **Touch feedback**: Scale animations on button press
- **Bottom navigation**: Fixed nav with animated active indicator
- **Offline detection**: Banner when connection lost
- **Empty states**: Friendly messages with CTAs
- **Status badges**: Color-coded order statuses
- **Haptic feedback**: Visual scale/opacity changes on interactions

## 🧪 Testing Strategy (TDD)

We follow Test-Driven Development:

1. **Write tests first** - Define expected behavior
2. **Implement components** - Make tests pass
3. **Refactor** - Clean up code while keeping tests green

Example test structure:

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## 🔌 API Integration

The app is structured to easily swap mock data for real API calls.

Mock data is in `/src/mocks/data.ts`. To connect to the real API:

1. Set `VITE_API_URL` in `.env`
2. Implement API client in `/src/api/client.ts`
3. Replace mock data calls in store/pages with API calls

Example:

```typescript
// Before (mock)
const products = mockProducts;

// After (real API)
const { data: products } = await api.get('/products');
```

## 📦 State Management

Using **Zustand** for simple, performant state management:

```typescript
import { useStore } from '@/store/useStore';

function MyComponent() {
  const { user, orders, addOrder } = useStore();
  
  // Access state and actions
}
```

State is persisted to localStorage for:
- Authentication token
- User profile
- Onboarding completion flag

## 🌐 PWA Features

- **Installable**: Add to home screen (iOS/Android)
- **Offline caching**: Service worker caches assets and API responses
- **Background sync**: Queues actions when offline, syncs when online
- **Push notifications**: (Ready for backend integration)
- **App-like feel**: No browser chrome when installed

## 🎯 Performance

- **Lazy loading**: Code splitting by route
- **Image optimization**: WebP with fallbacks
- **Preconnect**: DNS prefetch for API
- **Tree shaking**: Removes unused code
- **Gzip/Brotli**: Compressed assets

Target metrics:
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >90

## 🌍 Internationalization (i18n)

Structure is ready for multi-language support:

- English (EN)
- Zulu (ZU)
- Sepedi (SEP)
- Sotho (SOT)
- Xhosa (XH)

Implement with `react-i18next` when needed.

## 🚢 Deployment

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to Vercel

```bash
npm run build
vercel --prod
```

### Deploy to custom server

```bash
npm run build
# Upload dist/ folder to your server
# Serve with nginx/Apache/Caddy
```

## 🤝 Contributing

1. Follow the established component structure
2. Write tests before implementing features
3. Use TypeScript strictly (no `any` types)
4. Follow Tailwind utility-first approach
5. Keep components small and focused
6. Document complex logic

## 📝 TODO

- [ ] Add language switcher functionality
- [ ] Implement real-time order tracking (WebSocket)
- [ ] Add push notification handling
- [ ] Implement image upload for delivery proof
- [ ] Add biometric authentication
- [ ] Implement subscription management
- [ ] Add dark/light theme toggle (currently dark only)
- [ ] Implement advanced filters on orders page
- [ ] Add transaction receipt download

## 📄 License

Proprietary - Gaz Time / Velocity Fibre

---

Built with ❤️ by the Gaz Time team 🔥
