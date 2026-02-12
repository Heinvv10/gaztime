export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  addresses: Address[];
  walletBalance: number;
  referralCode: string;
  language: Language;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  text: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sizeKg: number;
  type: 'cylinder_full' | 'refill' | 'exchange';
  price: number;
  imageUrl: string;
  inStock: boolean;
}

export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  driver?: Driver;
  createdAt: string;
  deliveredAt?: string;
  rating?: number;
  estimatedDeliveryTime?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'assigned'
  | 'in_transit'
  | 'arriving'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'wallet' | 'voucher' | 'eft' | 'mobile_money';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  rating: number;
  vehicle: {
    registration: string;
    make: string;
    model: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'top_up' | 'debit' | 'refund' | 'referral_credit' | 'promo_credit';
  amount: number;
  description: string;
  reference?: string;
  createdAt: string;
}

export interface ReferralStats {
  code: string;
  invited: number;
  joined: number;
  earned: number;
}

export type Language = 'en' | 'zu' | 'st' | 'nso' | 'xh';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  image: string;
}
