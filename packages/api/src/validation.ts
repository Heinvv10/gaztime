// ============================================================================
// Input Validation Schemas
// Zod schemas for validating API request bodies
// ============================================================================

import { z } from 'zod';

// ---- Order Validation ----

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid().optional(), // Optional for walk-ins
  channel: z.enum(['app', 'ussd', 'whatsapp', 'pos', 'phone']),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'At least one item is required'),
  deliveryAddress: z.object({
    label: z.string().optional(),
    text: z.string().min(1),
    landmark: z.string().optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    isDefault: z.boolean().optional(),
  }).optional(),
  podId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'wallet', 'mobile_money', 'voucher', 'eft', 'credit', 'snapscan']),
  notes: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'assigned', 'in_transit', 'delivered', 'cancelled']),
  driverId: z.string().uuid().optional(),
  deliveryProof: z.object({
    type: z.enum(['photo', 'signature', 'otp']),
    url: z.string().url().optional(),
    otpCode: z.string().optional(),
    timestamp: z.string().datetime(),
  }).optional(),
});

export const AssignDriverSchema = z.object({
  driverId: z.string().uuid(),
});

// ---- Customer Validation ----

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional(),
  address: z.object({
    label: z.string().optional(),
    text: z.string().min(1),
    landmark: z.string().optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
    isDefault: z.boolean().optional(),
  }),
  languagePreference: z.enum(['en', 'zu', 'sep', 'sot', 'xh']).optional(),
  referredBy: z.string().optional(),
});

// ---- Driver Validation ----

export const UpdateDriverLocationSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

// ---- Product Validation ----

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  sizeKg: z.number().positive('Size must be a positive number'),
  type: z.enum(['cylinder_full', 'refill', 'exchange', 'accessory']),
  description: z.string().optional(),
  price: z.number().nonnegative('Price must be non-negative'),
  icon: z.string().optional(),
  active: z.boolean().optional().default(true),
});

// ---- Type exports for convenience ----

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AssignDriverInput = z.infer<typeof AssignDriverSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateDriverLocationInput = z.infer<typeof UpdateDriverLocationSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
