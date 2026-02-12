import type {
  Order,
  Customer,
  Driver,
  Vehicle,
  Pod,
  Cylinder,
  DashboardStats,
  ChartData,
  Alert,
  StockLevel,
  RevenueBreakdown,
} from '@/types'

// South Africa area coordinates (center)
const DEFAULT_CENTER = { lat: -24.8833, lng: 30.3167 }

// Helper to generate random coordinates near South Africa
const randomNearby = (offset = 0.05) => ({
  lat: DEFAULT_CENTER.lat + (Math.random() - 0.5) * offset,
  lng: DEFAULT_CENTER.lng + (Math.random() - 0.5) * offset,
})

// South African names
const firstNames = [
  'Thabo',
  'Sipho',
  'Nomsa',
  'Precious',
  'Lerato',
  'Mpho',
  'Zanele',
  'Tebogo',
  'Kgotso',
  'Naledi',
  'Bongani',
  'Themba',
  'Lindiwe',
  'Mandla',
  'Noluthando',
]
const lastNames = [
  'Malema',
  'Ndlovu',
  'Mthembu',
  'Khumalo',
  'Dlamini',
  'Mokoena',
  'Mokgadi',
  'Mashaba',
  'Nkosi',
  'Radebe',
]

const randomName = () =>
  `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
    lastNames[Math.floor(Math.random() * lastNames.length)]
  }`

// South Africa area landmarks and addresses
const addresses = [
  '47 Mandela Street, Ext 5, South Africa',
  'Near Spar, Main Road, South Africa',
  '12 Mokopane Street, Ext 2, South Africa',
  'Behind the clinic, Ext 7, South Africa',
  'Next to blue tuck shop, 3rd Street, Ext 4',
  '89 Kruger Avenue, Town Centre, South Africa',
  'Near taxi rank, Extension 6, South Africa',
  '23 Church Street, South Africa',
  'Opposite library, Main Road, South Africa',
  'Next to school, Ext 3, South Africa',
  '15 Market Street, Town, South Africa',
  'Near mosque, Ext 8, South Africa',
]

const getRandomDate = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date.toISOString()
}

// Mock Orders
export const mockOrders: Order[] = Array.from({ length: 50 }, (_, i) => {
  const statuses: Order['status'][] = [
    'created',
    'confirmed',
    'assigned',
    'in_transit',
    'delivered',
    'completed',
  ]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const channels: Order['channel'][] = ['app', 'ussd', 'whatsapp', 'pos', 'phone']
  const channel = channels[Math.floor(Math.random() * channels.length)]
  const paymentMethods: ('cash' | 'wallet' | 'mobile_money' | 'voucher')[] = [
    'cash',
    'wallet',
    'mobile_money',
    'voucher',
  ]
  const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

  const products = [
    { name: '9kg LPG Cylinder', price: 315 },
    { name: '3kg LPG Refill', price: 99 },
    { name: '1kg LPG Daily', price: 35 },
    { name: '19kg LPG Cylinder', price: 620 },
  ]
  const product = products[Math.floor(Math.random() * products.length)]

  return {
    id: `order-${1000 + i}`,
    reference: `GT-${4500 + i}`,
    customer: {
      id: `customer-${Math.floor(Math.random() * 200)}`,
      name: randomName(),
      phone: `072 ${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')} ${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`,
    },
    channel,
    status,
    items: [
      {
        product: product.name,
        quantity: 1,
        unit_price: product.price,
        total: product.price,
      },
    ],
    delivery_address: addresses[Math.floor(Math.random() * addresses.length)],
    delivery_fee: 0,
    total_amount: product.price,
    payment_method: payment,
    payment_status: status === 'completed' ? 'paid' : 'pending',
    driver:
      status !== 'created' && status !== 'confirmed'
        ? {
            id: `driver-${Math.floor(Math.random() * 10) + 1}`,
            name: randomName(),
          }
        : undefined,
    created_at: getRandomDate(7),
    assigned_at: status !== 'created' ? getRandomDate(7) : undefined,
    delivered_at: status === 'delivered' || status === 'completed' ? getRandomDate(1) : undefined,
    rating: status === 'completed' ? Math.floor(Math.random() * 2) + 4 : undefined,
  }
})

// Mock Customers
export const mockCustomers: Customer[] = Array.from({ length: 100 }, (_, i) => ({
  id: `customer-${i}`,
  name: randomName(),
  phone: `072 ${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')} ${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`,
  address: addresses[Math.floor(Math.random() * addresses.length)],
  wallet_balance: Math.floor(Math.random() * 500),
  segment: ['new', 'active', 'at_risk', 'churned'][
    Math.floor(Math.random() * 4)
  ] as Customer['segment'],
  total_orders: Math.floor(Math.random() * 50),
  lifetime_value: Math.floor(Math.random() * 10000),
  created_at: getRandomDate(365),
  last_order_at: Math.random() > 0.2 ? getRandomDate(30) : undefined,
}))

// Mock Drivers
export const mockDrivers: Driver[] = Array.from({ length: 10 }, (_, i) => ({
  id: `driver-${i + 1}`,
  name: randomName(),
  phone: `072 ${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')} ${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`,
  status: ['online', 'offline', 'on_delivery'][
    Math.floor(Math.random() * 3)
  ] as Driver['status'],
  current_location: randomNearby(),
  deliveries_today: Math.floor(Math.random() * 20),
  rating: 4 + Math.random(),
  total_deliveries: Math.floor(Math.random() * 500) + 50,
  vehicle: {
    id: `vehicle-${i + 1}`,
    registration: `${['LMP', 'GP', 'NW'][Math.floor(Math.random() * 3)]} ${Math.floor(
      Math.random() * 900 + 100
    )} ${['AB', 'BC', 'CD', 'DE'][Math.floor(Math.random() * 4)]}`,
  },
}))

// Mock Vehicles
export const mockVehicles: Vehicle[] = Array.from({ length: 12 }, (_, i) => ({
  id: `vehicle-${i + 1}`,
  registration: `${['LMP', 'GP', 'NW'][Math.floor(Math.random() * 3)]} ${Math.floor(
    Math.random() * 900 + 100
  )} ${['AB', 'BC', 'CD', 'DE'][Math.floor(Math.random() * 4)]}`,
  make: ['Toyota', 'Nissan', 'Isuzu', 'Mitsubishi'][Math.floor(Math.random() * 4)],
  model: ['Hilux', 'NP200', 'KB', 'Canter'][Math.floor(Math.random() * 4)],
  assigned_driver:
    i < 10
      ? {
          id: `driver-${i + 1}`,
          name: mockDrivers[i]?.name || randomName(),
        }
      : undefined,
  stock_count: Math.floor(Math.random() * 20),
  service_due: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  insurance_expiry: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
  active: true,
}))

// Mock Pods
export const mockPods: Pod[] = [
  {
    id: 'pod-1',
    name: 'Pod 1 - Town Centre',
    location: {
      address: 'Main Road, Town Centre, South Africa',
      lat: -24.8833,
      lng: 30.3167,
    },
    operator: {
      id: 'operator-1',
      name: randomName(),
    },
    stock: [
      { product: '9kg Cylinder', quantity: 45 },
      { product: '3kg Cylinder', quantity: 30 },
      { product: '1kg Cylinder', quantity: 20 },
    ],
    sales_today: 12000,
    active: true,
  },
  {
    id: 'pod-2',
    name: 'Pod 2 - Extension 5',
    location: {
      address: 'Extension 5, South Africa',
      lat: -24.8900,
      lng: 30.3200,
    },
    operator: {
      id: 'operator-2',
      name: randomName(),
    },
    stock: [
      { product: '9kg Cylinder', quantity: 12 },
      { product: '3kg Cylinder', quantity: 8 },
      { product: '1kg Cylinder', quantity: 5 },
    ],
    sales_today: 8500,
    active: true,
  },
  {
    id: 'pod-3',
    name: 'Pod 3 - Extension 7',
    location: {
      address: 'Extension 7, South Africa',
      lat: -24.8750,
      lng: 30.3100,
    },
    operator: {
      id: 'operator-3',
      name: randomName(),
    },
    stock: [
      { product: '9kg Cylinder', quantity: 28 },
      { product: '3kg Cylinder', quantity: 22 },
      { product: '1kg Cylinder', quantity: 15 },
    ],
    sales_today: 10200,
    active: true,
  },
]

// Mock Cylinders
export const mockCylinders: Cylinder[] = Array.from({ length: 200 }, (_, i) => {
  const sizes = [1, 3, 9, 19]
  const size = sizes[Math.floor(Math.random() * sizes.length)]
  const statuses: Cylinder['status'][] = [
    'filled',
    'in_transit',
    'with_customer',
    'empty',
    'returned',
  ]
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const locationTypes: Cylinder['location_type'][] = ['depot', 'pod', 'vehicle', 'customer']
  const locationType = locationTypes[Math.floor(Math.random() * locationTypes.length)]

  return {
    id: `cylinder-${i + 1}`,
    serial_number: `CYL-${size}KG-${(1000 + i).toString()}`,
    size_kg: size,
    status,
    location_type: locationType,
    location_name:
      locationType === 'depot'
        ? 'Main Depot'
        : locationType === 'pod'
        ? `Pod ${Math.floor(Math.random() * 3) + 1}`
        : locationType === 'vehicle'
        ? `Vehicle ${Math.floor(Math.random() * 10) + 1}`
        : randomName(),
    fill_count: Math.floor(Math.random() * 50),
    last_filled_at: getRandomDate(30),
    last_inspected_at: getRandomDate(90),
    next_inspection_due: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }
})

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  orders_today: 127,
  revenue_today: 38450,
  avg_delivery_time: 23,
  active_drivers: 8,
  customer_rating: 4.6,
  orders_trend: 12,
  revenue_trend: 18,
}

// Mock Chart Data
export const mockChartData: ChartData[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (6 - i))
  return {
    date: date.toISOString().split('T')[0],
    orders: Math.floor(Math.random() * 50) + 80,
    revenue: Math.floor(Math.random() * 15000) + 25000,
  }
})

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'low_stock',
    severity: 'warning',
    message: 'Pod 2 - Extension 5 running low on 9kg cylinders (12 remaining)',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    type: 'late_delivery',
    severity: 'critical',
    message: 'Order GT-4523 delayed by 15 minutes (customer waiting)',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-3',
    type: 'incident',
    severity: 'info',
    message: 'Driver Thabo Malema reported minor traffic delay on Main Road',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
]

// Mock Stock Levels
export const mockStockLevels: StockLevel[] = [
  {
    location: 'Main Depot',
    location_type: 'depot',
    product: '9kg Cylinder',
    quantity: 450,
    capacity: 800,
    threshold: 200,
  },
  {
    location: 'Main Depot',
    location_type: 'depot',
    product: '3kg Cylinder',
    quantity: 280,
    capacity: 500,
    threshold: 150,
  },
  {
    location: 'Pod 1 - Town Centre',
    location_type: 'pod',
    product: '9kg Cylinder',
    quantity: 45,
    capacity: 60,
    threshold: 20,
  },
  {
    location: 'Pod 2 - Extension 5',
    location_type: 'pod',
    product: '9kg Cylinder',
    quantity: 12,
    capacity: 60,
    threshold: 20,
  },
  {
    location: 'Pod 3 - Extension 7',
    location_type: 'pod',
    product: '9kg Cylinder',
    quantity: 28,
    capacity: 60,
    threshold: 20,
  },
]

// Mock Revenue Breakdown
export const mockRevenueByProduct: RevenueBreakdown[] = [
  { category: '9kg Cylinder', value: 22050, percentage: 57 },
  { category: '3kg Refill', value: 9900, percentage: 26 },
  { category: '1kg Daily', value: 4550, percentage: 12 },
  { category: '19kg Cylinder', value: 1950, percentage: 5 },
]

export const mockRevenueByChannel: RevenueBreakdown[] = [
  { category: 'WhatsApp', value: 13460, percentage: 35 },
  { category: 'USSD', value: 11535, percentage: 30 },
  { category: 'App', value: 9615, percentage: 25 },
  { category: 'Walk-in', value: 3840, percentage: 10 },
]

export const mockRevenueByPayment: RevenueBreakdown[] = [
  { category: 'Cash', value: 21960, percentage: 57 },
  { category: 'Mobile Money', value: 8845, percentage: 23 },
  { category: 'Wallet', value: 5765, percentage: 15 },
  { category: 'Voucher', value: 1880, percentage: 5 },
]
