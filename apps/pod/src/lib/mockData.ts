import type { Product, Customer, Order, PodStock } from '@gaztime/shared';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '9kg LPG Cylinder',
    description: 'Standard 9kg cylinder',
    sku: 'CYL-9KG',
    sizeKg: 9,
    type: 'cylinder_full',
    price: 350,
    icon: 'flame',
    active: true,
  },
  {
    id: 'p2',
    name: '3kg LPG Cylinder',
    description: 'Compact 3kg cylinder',
    sku: 'CYL-3KG',
    sizeKg: 3,
    type: 'cylinder_full',
    price: 150,
    icon: 'flame',
    active: true,
  },
  {
    id: 'p3',
    name: '1kg LPG Cylinder',
    description: 'Portable 1kg cylinder',
    sku: 'CYL-1KG',
    sizeKg: 1,
    type: 'cylinder_full',
    price: 80,
    icon: 'flame',
    active: true,
  },
  {
    id: 'p4',
    name: '48kg LPG Cylinder',
    description: 'Commercial 48kg cylinder',
    sku: 'CYL-48KG',
    sizeKg: 48,
    type: 'cylinder_full',
    price: 1200,
    icon: 'flame',
    active: true,
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    phone: '0823456789',
    name: 'Thabo Malema',
    addresses: [
      {
        id: 'a1',
        label: 'Home',
        text: '12 Main Street, South Africa',
        isDefault: true,
      },
    ],
    walletBalance: 250,
    referralCode: 'THABO123',
    segment: 'active',
    languagePreference: 'en',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    phone: '0712345678',
    name: 'Nomsa Dlamini',
    addresses: [
      {
        id: 'a2',
        label: 'Home',
        text: '45 Church Road, South Africa',
        isDefault: true,
      },
    ],
    walletBalance: 0,
    referralCode: 'NOMSA456',
    segment: 'active',
    languagePreference: 'en',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    reference: 'GT-1001',
    customerId: 'c1',
    channel: 'pos',
    status: 'completed',
    items: [
      {
        productId: 'p1',
        quantity: 1,
        unitPrice: 350,
        total: 350,
      },
    ],
    deliveryAddress: MOCK_CUSTOMERS[0].addresses[0],
    deliveryFee: 0,
    totalAmount: 350,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'o2',
    reference: 'GT-1002',
    customerId: 'c2',
    channel: 'pos',
    status: 'completed',
    items: [
      {
        productId: 'p2',
        quantity: 2,
        unitPrice: 150,
        total: 300,
      },
    ],
    deliveryAddress: MOCK_CUSTOMERS[1].addresses[0],
    deliveryFee: 0,
    totalAmount: 300,
    paymentMethod: 'mobile_money',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const MOCK_POD_STOCK: PodStock[] = [
  {
    productId: 'p1',
    product: MOCK_PRODUCTS[0],
    quantity: 12,
  },
  {
    productId: 'p2',
    product: MOCK_PRODUCTS[1],
    quantity: 8,
  },
  {
    productId: 'p3',
    product: MOCK_PRODUCTS[2],
    quantity: 5,
  },
  {
    productId: 'p4',
    product: MOCK_PRODUCTS[3],
    quantity: 3,
  },
];

export const MOCK_OPERATOR = {
  id: 'op1',
  name: 'Nomsa Mabasa',
  pin: '123456',
};

export const MOCK_POD = {
  id: 'pod1',
  name: 'Gaz Time Pod - Town Centre',
  location: 'South Africa',
};
