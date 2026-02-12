import { Product, User, Order, WalletTransaction, OnboardingStep } from '@/types';

export const mockUser: User = {
  id: 'user-123',
  phone: '+27721234567',
  name: 'Thandi Mkhize',
  addresses: [
    {
      id: 'addr-1',
      label: 'Home',
      text: '47 Mandela Street, Ext 5, South Africa',
      landmark: 'Near the blue tuck shop on 3rd street',
      lat: -24.6833,
      lng: 30.3167,
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Work',
      text: '12 Church Street, South Africa',
      landmark: 'Next to the clinic',
      lat: -24.6850,
      lng: 30.3180,
      isDefault: false,
    },
  ],
  walletBalance: 145.50,
  referralCode: 'THANDI2024',
  language: 'en',
  createdAt: '2024-01-15T10:00:00Z',
};

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: '9kg LPG Cylinder',
    description: 'Full 9kg gas cylinder - perfect for family cooking',
    sizeKg: 9,
    type: 'cylinder_full',
    price: 315,
    imageUrl: '/assets/cylinder-9kg.png',
    inStock: true,
  },
  {
    id: 'prod-2',
    name: '3kg LPG Refill',
    description: 'Portable 3kg cylinder - ideal for small households',
    sizeKg: 3,
    type: 'refill',
    price: 99,
    imageUrl: '/assets/cylinder-3kg.png',
    inStock: true,
  },
  {
    id: 'prod-3',
    name: '1kg Daily Gas',
    description: 'Small 1kg cylinder for daily use',
    sizeKg: 1,
    type: 'cylinder_full',
    price: 35,
    imageUrl: '/assets/cylinder-1kg.png',
    inStock: true,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    reference: 'GT-4521',
    status: 'in_transit',
    items: [
      {
        productId: 'prod-1',
        productName: '9kg LPG Cylinder',
        quantity: 1,
        unitPrice: 315,
        total: 315,
      },
    ],
    totalAmount: 330,
    deliveryFee: 15,
    deliveryAddress: mockUser.addresses[0],
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    driver: {
      id: 'driver-1',
      name: 'Thabo Dlamini',
      phone: '+27823456789',
      photoUrl: '/assets/driver-avatar.png',
      rating: 4.8,
      vehicle: {
        registration: 'CA 123 456',
        make: 'Toyota',
        model: 'Hilux',
      },
      currentLocation: {
        lat: -24.6840,
        lng: 30.3170,
      },
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'order-2',
    reference: 'GT-4502',
    status: 'delivered',
    items: [
      {
        productId: 'prod-2',
        productName: '3kg LPG Refill',
        quantity: 2,
        unitPrice: 99,
        total: 198,
      },
    ],
    totalAmount: 213,
    deliveryFee: 15,
    deliveryAddress: mockUser.addresses[0],
    paymentMethod: 'wallet',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    rating: 5,
  },
  {
    id: 'order-3',
    reference: 'GT-4489',
    status: 'delivered',
    items: [
      {
        productId: 'prod-1',
        productName: '9kg LPG Cylinder',
        quantity: 1,
        unitPrice: 315,
        total: 315,
      },
    ],
    totalAmount: 330,
    deliveryFee: 15,
    deliveryAddress: mockUser.addresses[0],
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 28 * 60 * 1000).toISOString(),
    rating: 4,
  },
];

export const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'top_up',
    amount: 200,
    description: 'EFT Top-up',
    reference: 'EFT-12345',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-2',
    type: 'debit',
    amount: -198,
    description: 'Order GT-4502',
    reference: 'order-2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-3',
    type: 'referral_credit',
    amount: 20,
    description: 'Referral bonus - Sipho joined',
    reference: 'ref-sipho',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tx-4',
    type: 'promo_credit',
    amount: 50,
    description: 'Welcome bonus',
    reference: 'promo-welcome',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Clean Energy, Delivered',
    description: 'Say goodbye to heavy cylinders. We bring LPG gas right to your door.',
    image: '🔥',
  },
  {
    id: 'step-2',
    title: 'Fast & Reliable',
    description: 'Order now, delivered in 30 minutes. Track your delivery in real-time.',
    image: '🚛',
  },
  {
    id: 'step-3',
    title: 'Affordable & Safe',
    description: 'Pay-as-you-go pricing. Safe, certified cylinders. 24/7 support.',
    image: '💰',
  },
];
