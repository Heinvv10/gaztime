// ============================================================
// GAZ TIME — Shared Type Definitions
// Based on PRD Section 10: Data Model
// ============================================================
// ---- Order State Machine Transitions ----
export const ORDER_TRANSITIONS = {
    created: ['confirmed', 'cancelled'],
    confirmed: ['assigned', 'cancelled'],
    assigned: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
};
export function canTransition(from, to) {
    return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
// ---- Constants ----
export const DELIVERY_RADIUS_KM = 5;
export const DELIVERY_TIMEOUT_MINUTES = 3;
export const MAX_ACTIVE_DELIVERIES = 3;
export const REFERRAL_CREDIT_AMOUNT = 20;
export const DEFAULT_DELIVERY_FEE = 10;
export const FREE_DELIVERY_THRESHOLD = 200;
