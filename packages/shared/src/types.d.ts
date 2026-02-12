export type OrderStatus = 'created' | 'confirmed' | 'assigned' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
export type OrderChannel = 'app' | 'ussd' | 'whatsapp' | 'pos' | 'phone';
export type PaymentMethod = 'cash' | 'wallet' | 'mobile_money' | 'voucher' | 'eft' | 'credit' | 'snapscan';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type CylinderStatus = 'new' | 'filled' | 'in_transit' | 'with_customer' | 'empty' | 'returned' | 'condemned';
export type CylinderLocationType = 'depot' | 'pod' | 'vehicle' | 'customer';
export type DriverStatus = 'online' | 'offline' | 'on_delivery' | 'on_break';
export type CustomerSegment = 'new' | 'active' | 'at_risk' | 'churned';
export type CustomerStatus = 'active' | 'suspended' | 'blacklisted';
export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type WalletTransactionType = 'top_up' | 'debit' | 'refund' | 'referral_credit' | 'promo_credit';
export type ProductType = 'cylinder_full' | 'refill' | 'exchange' | 'accessory';
export type DeliveryProofType = 'photo' | 'signature' | 'otp';
export type DeliveryDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type DeliveryWindow = 'morning' | 'afternoon' | 'evening';
export type Language = 'en' | 'zu' | 'sep' | 'sot' | 'xh';
export interface GeoLocation {
    lat: number;
    lng: number;
}
export interface Address {
    id: string;
    label: string;
    text: string;
    landmark?: string;
    location?: GeoLocation;
    isDefault: boolean;
}
export interface Customer {
    id: string;
    phone: string;
    name: string;
    addresses: Address[];
    walletBalance: number;
    fibertimeAccountId?: string;
    referralCode: string;
    referredBy?: string;
    segment: CustomerSegment;
    languagePreference: Language;
    status: CustomerStatus;
    createdAt: string;
    updatedAt: string;
}
export interface Product {
    id: string;
    name: string;
    description: string;
    sku: string;
    sizeKg: number;
    type: ProductType;
    price: number;
    icon: string;
    active: boolean;
}
export interface OrderItem {
    productId: string;
    product?: Product;
    quantity: number;
    unitPrice: number;
    total: number;
}
export interface DeliveryProof {
    type: DeliveryProofType;
    url?: string;
    otpCode?: string;
    timestamp: string;
}
export interface Order {
    id: string;
    reference: string;
    customerId: string;
    customer?: Customer;
    channel: OrderChannel;
    status: OrderStatus;
    items: OrderItem[];
    deliveryAddress: Address;
    deliveryFee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    driverId?: string;
    driver?: Driver;
    podId?: string;
    pod?: Pod;
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    deliveryProof?: DeliveryProof;
    rating?: number;
    notes?: string;
    cancelledReason?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Cylinder {
    id: string;
    serialNumber: string;
    sizeKg: number;
    status: CylinderStatus;
    locationType: CylinderLocationType;
    locationId: string;
    fillCount: number;
    lastFilledAt?: string;
    lastInspectedAt?: string;
    nextInspectionDue?: string;
    manufacturedAt?: string;
    condemnedAt?: string;
    createdAt: string;
}
export interface CylinderMovement {
    id: string;
    cylinderId: string;
    fromLocationType: CylinderLocationType;
    fromLocationId: string;
    toLocationType: CylinderLocationType;
    toLocationId: string;
    actorId: string;
    timestamp: string;
}
export interface Driver {
    id: string;
    name: string;
    phone: string;
    photo?: string;
    licenseNumber: string;
    licenseExpiry: string;
    lpgsaCertNumber?: string;
    certExpiry?: string;
    vehicleId?: string;
    vehicle?: Vehicle;
    status: DriverStatus;
    currentLocation?: GeoLocation;
    locationUpdatedAt?: string;
    ratingAvg: number;
    totalDeliveries: number;
    todayDeliveries: number;
    todayEarnings: number;
    hiredAt: string;
    active: boolean;
}
export interface Vehicle {
    id: string;
    registration: string;
    make: string;
    model: string;
    capacityCylinders: number;
    currentStock: VehicleStock[];
    insuranceExpiry: string;
    serviceDueDate: string;
    gpsDeviceId?: string;
    active: boolean;
}
export interface VehicleStock {
    cylinderId: string;
    sizeKg: number;
}
export interface Pod {
    id: string;
    name: string;
    location: Address;
    operatorId?: string;
    operatorName?: string;
    stock: PodStock[];
    operatingHours: {
        open: string;
        close: string;
    };
    fibertimePopId?: string;
    active: boolean;
}
export interface PodStock {
    productId: string;
    product?: Product;
    quantity: number;
}
export interface Depot {
    id: string;
    name: string;
    location: Address;
    bulkStorageCapacityTonnes: number;
    currentStockTonnes: number;
    cylinderStock: DepotCylinderStock[];
    active: boolean;
}
export interface DepotCylinderStock {
    sizeKg: number;
    filledCount: number;
    emptyCount: number;
}
export interface Wallet {
    id: string;
    customerId: string;
    balance: number;
    createdAt: string;
}
export interface WalletTransaction {
    id: string;
    walletId: string;
    type: WalletTransactionType;
    amount: number;
    reference?: string;
    description: string;
    createdAt: string;
}
export interface Subscription {
    id: string;
    customerId: string;
    customer?: Customer;
    productId: string;
    product?: Product;
    frequency: SubscriptionFrequency;
    deliveryDay: DeliveryDay;
    deliveryWindow: DeliveryWindow;
    paymentMethod: PaymentMethod;
    status: SubscriptionStatus;
    nextDeliveryDate: string;
    createdAt: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface CreateOrderRequest {
    customerId: string;
    channel: OrderChannel;
    items: {
        productId: string;
        quantity: number;
    }[];
    deliveryAddress: Address;
    paymentMethod: PaymentMethod;
    notes?: string;
}
export interface RegisterCustomerRequest {
    phone: string;
    name: string;
    address: Omit<Address, 'id'>;
    languagePreference?: Language;
    referredBy?: string;
}
export interface UpdateCustomerRequest {
    name?: string;
    addresses?: Address[];
    languagePreference?: Language;
    status?: CustomerStatus;
    segment?: CustomerSegment;
}
export interface DebitWalletRequest {
    customerId: string;
    amount: number;
    description: string;
}
export interface UpdateDriverLocationRequest {
    driverId: string;
    location: GeoLocation;
}
export interface CompleteDeliveryRequest {
    orderId: string;
    proof: DeliveryProof;
    cylinderSerialDelivered?: string;
    cylinderSerialReturned?: string;
    cashCollected?: number;
}
export interface TopUpWalletRequest {
    customerId: string;
    amount: number;
    method: 'eft' | 'voucher' | 'snapscan';
    voucherCode?: string;
}
export interface CreateCylinderRequest {
    serialNumber: string;
    sizeKg: number;
    manufacturedAt: string;
}
export interface MoveCylinderRequest {
    cylinderId: string;
    toLocationType: CylinderLocationType;
    toLocationId: string;
    actorId: string;
}
export interface StockLevel {
    productId: string;
    product?: Product;
    quantity: number;
    locationId: string;
    locationType: 'depot' | 'pod' | 'vehicle';
}
export interface LowStockAlert {
    locationId: string;
    locationName: string;
    productId: string;
    productName: string;
    currentStock: number;
    minimumStock: number;
}
export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    driverId?: string;
    deliveryProof?: DeliveryProof;
}
export interface ListOrdersQuery {
    status?: OrderStatus;
    customerId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
export interface DashboardStats {
    ordersToday: number;
    revenueToday: number;
    avgDeliveryTime: number;
    activeDrivers: number;
    avgRating: number;
    activeCustomers: number;
    pendingOrders: number;
    lowStockPods: number;
}
export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}
export interface DeliveryPerformance {
    avgTime: number;
    onTime: number;
    totalDeliveries: number;
    topDriver: string;
}
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare function canTransition(from: OrderStatus, to: OrderStatus): boolean;
export type WithTimestamps<T> = T & {
    createdAt: string;
    updatedAt: string;
};
export declare const DELIVERY_RADIUS_KM = 5;
export declare const DELIVERY_TIMEOUT_MINUTES = 3;
export declare const MAX_ACTIVE_DELIVERIES = 3;
export declare const REFERRAL_CREDIT_AMOUNT = 20;
export declare const DEFAULT_DELIVERY_FEE = 10;
export declare const FREE_DELIVERY_THRESHOLD = 200;
//# sourceMappingURL=types.d.ts.map