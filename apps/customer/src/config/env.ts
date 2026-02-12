// Environment configuration
export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  APP_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  REGISTER: '/auth/register',
  
  // Customer
  ME: '/customers/me',
  UPDATE_PROFILE: '/customers/me',
  ADDRESSES: '/customers/me/addresses',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT: (id: string) => `/products/${id}`,
  
  // Orders
  ORDERS: '/orders',
  ORDER: (id: string) => `/orders/${id}`,
  ORDER_TRACK: (id: string) => `/orders/${id}/track`,
  REORDER: (id: string) => `/orders/${id}/reorder`,
  
  // Wallet
  WALLET: '/wallet',
  WALLET_TOPUP: '/wallet/topup',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  
  // Referrals
  REFERRAL_CODE: '/referrals/my-code',
  REFERRAL_STATS: '/referrals/stats',
  
  // Payments
  PAYMENT_METHODS: '/payments/methods',
} as const;
