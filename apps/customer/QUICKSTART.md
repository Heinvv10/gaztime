# 🚀 Gaz Time Customer App - Quick Start

## View the App NOW

The app is **already running** at:
👉 **http://localhost:3002/**

Open your browser and check it out!

## What You'll See

1. **Splash Screen** (2 seconds) - Animated flame logo
2. **Onboarding** (3 slides) - Swipe through or skip
3. **Phone Login** - Enter any phone number
4. **OTP** - Enter any 6-digit code
5. **Profile Setup** - Add name and address
6. **Home Screen** - Beautiful main screen with products

## Quick Commands

```bash
# View the app
open http://localhost:3002/

# Stop the dev server
npm run dev --workspace=@gaztime/customer

# Run tests
cd /home/hein/clawd/gaztime/app/apps/customer
npm test

# Build for production
npm run build

# Check test coverage
npm run test:coverage
```

## Navigation

The app has a **bottom navigation bar**:
- 🏠 **Home** - Products, wallet, reorder
- 📦 **Orders** - Order history and tracking
- 💳 **Wallet** - Balance and transactions
- 👤 **Profile** - Settings and info

## Test Data (Mock)

The app uses mock data so you can test everything:

**User**: Thandi Mkhize
**Phone**: +27 72 123 4567
**Wallet**: R145.50
**Orders**: 3 (1 active, 2 completed)

## Features to Test

1. ✅ **Place an order** - Home → Click product → Configure → Place order
2. ✅ **Track delivery** - Orders → Click active order → See animated map
3. ✅ **View wallet** - Wallet tab → See transactions → Try top-up modal
4. ✅ **Referrals** - Profile → Referrals → See QR code and share
5. ✅ **Safety info** - Profile → Safety → Read tips
6. ✅ **Order history** - Orders tab → Filter and reorder

## Files to Check

- **README.md** - Full documentation
- **COMPLETION_SUMMARY.md** - What's been built
- **src/pages/** - All screen components
- **src/components/ui/** - Reusable UI components

## Customization

To change API endpoint:
1. Edit `.env` file
2. Change `VITE_API_URL=http://localhost:3333/api`
3. Restart dev server

To change brand colors:
1. Edit `tailwind.config.ts`
2. Modify the `colors` section

## Need Help?

- Check **README.md** for detailed docs
- Run `npm test` to see example tests
- All components are in `src/pages/` and `src/components/`

## Deploy to Production

```bash
# Build
npm run build

# Preview build locally
npm run preview

# Deploy to Netlify/Vercel
netlify deploy --prod --dir=dist
# or
vercel --prod
```

---

🔥 **Enjoy your beautiful new PWA!** 🔥
