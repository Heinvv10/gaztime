export type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type PaymentMethod = 'cash' | 'wallet' | 'mobile_money' | 'voucher' | 'eft' | 'credit'

export type OrderChannel = 'app' | 'ussd' | 'whatsapp' | 'pos' | 'phone'

export type DriverStatus = 'online' | 'offline' | 'on_delivery' | 'on_break'

export type CustomerSegment = 'new' | 'active' | 'at_risk' | 'churned'

export type CylinderStatus =
  | 'new'
  | 'filled'
  | 'in_transit'
  | 'with_customer'
  | 'empty'
  | 'returned'
  | 'condemned'

export interface Order {
  id: string
  reference: string
  customer: {
    id: string
    name: string
    phone: string
  }
  channel: OrderChannel
  status: OrderStatus
  items: {
    product: string
    quantity: number
    unit_price: number
    total: number
  }[]
  delivery_address: string
  delivery_fee: number
  total_amount: number
  payment_method: PaymentMethod
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  driver?: {
    id: string
    name: string
  }
  pod?: {
    id: string
    name: string
  }
  created_at: string
  assigned_at?: string
  delivered_at?: string
  rating?: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  wallet_balance: number
  segment: CustomerSegment
  total_orders: number
  lifetime_value: number
  created_at: string
  last_order_at?: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  status: DriverStatus
  current_location: {
    lat: number
    lng: number
  }
  deliveries_today: number
  rating: number
  total_deliveries: number
  vehicle: {
    id: string
    registration: string
  }
}

export interface Vehicle {
  id: string
  registration: string
  make: string
  model: string
  assigned_driver?: {
    id: string
    name: string
  }
  stock_count: number
  service_due: string
  insurance_expiry: string
  active: boolean
}

export interface Pod {
  id: string
  name: string
  location: {
    address: string
    lat: number
    lng: number
  }
  operator: {
    id: string
    name: string
  }
  stock: {
    product: string
    quantity: number
  }[]
  sales_today: number
  active: boolean
}

export interface Cylinder {
  id: string
  serial_number: string
  size_kg: number
  status: CylinderStatus
  location_type: 'depot' | 'pod' | 'vehicle' | 'customer'
  location_name: string
  fill_count: number
  last_filled_at: string
  last_inspected_at: string
  next_inspection_due: string
}

export interface DashboardStats {
  orders_today: number
  revenue_today: number
  avg_delivery_time: number
  active_drivers: number
  customer_rating: number
  orders_trend: number
  revenue_trend: number
}

export interface ChartData {
  date: string
  orders: number
  revenue: number
}

export interface Alert {
  id: string
  type: 'low_stock' | 'late_delivery' | 'incident' | 'system'
  severity: 'info' | 'warning' | 'critical'
  message: string
  created_at: string
  acknowledged: boolean
}

export interface StockLevel {
  location: string
  location_type: 'depot' | 'pod' | 'vehicle'
  product: string
  quantity: number
  capacity: number
  threshold: number
}

export interface RevenueBreakdown {
  category: string
  value: number
  percentage: number
}
