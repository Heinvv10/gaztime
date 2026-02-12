// ============================================================================
// Database Seed Data
// Realistic test data for South Africa operations
// ============================================================================

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config();

import { randomUUID } from 'crypto';
import { db } from './index.js';
import {
  products,
  customers,
  drivers,
  vehicles,
  pods,
  depots,
  cylinders,
  orders,
} from './schema.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // ----------------------------------------------------------------------------
  // Products (LPG cylinder sizes)
  // ----------------------------------------------------------------------------
  console.log('  📦 Creating products...');

  const productData = [
    {
      id: randomUUID(),
      name: '1kg LPG Daily',
      sku: 'LPG-1KG',
      size_kg: 1,
      type: 'cylinder_full',
      prices: [{ price: 35, effective_from: new Date('2024-01-01'), effective_to: null }],
      active: true,
    },
    {
      id: randomUUID(),
      name: '3kg LPG Refill',
      sku: 'LPG-3KG',
      size_kg: 3,
      type: 'refill',
      prices: [{ price: 99, effective_from: new Date('2024-01-01'), effective_to: null }],
      active: true,
    },
    {
      id: randomUUID(),
      name: '9kg LPG Cylinder',
      sku: 'LPG-9KG',
      size_kg: 9,
      type: 'cylinder_full',
      prices: [{ price: 315, effective_from: new Date('2024-01-01'), effective_to: null }],
      active: true,
    },
    {
      id: randomUUID(),
      name: '19kg LPG Cylinder',
      sku: 'LPG-19KG',
      size_kg: 19,
      type: 'cylinder_full',
      prices: [{ price: 650, effective_from: new Date('2024-01-01'), effective_to: null }],
      active: true,
    },
    {
      id: randomUUID(),
      name: '48kg Commercial Cylinder',
      sku: 'LPG-48KG',
      size_kg: 48,
      type: 'cylinder_full',
      prices: [{ price: 1500, effective_from: new Date('2024-01-01'), effective_to: null }],
      active: true,
    },
  ];

  await db.insert(products).values(productData);
  console.log(`    ✅ Created ${productData.length} products`);

  // ----------------------------------------------------------------------------
  // Depot (Main distribution center)
  // ----------------------------------------------------------------------------
  console.log('  🏭 Creating depot...');

  const depotData = {
    id: randomUUID(),
    name: 'South Africa Main Depot',
    location: {
      address: 'Industrial Area, South Africa, 1150',
      lat: -24.6792,
      lng: 30.3247,
    },
    bulk_storage_capacity_tonnes: 100,
    current_stock_tonnes: 75,
    cylinder_stock: [
      { size: 9, filled_count: 150, empty_count: 50 },
      { size: 19, filled_count: 80, empty_count: 20 },
      { size: 48, filled_count: 30, empty_count: 10 },
    ],
    active: true,
  };

  await db.insert(depots).values(depotData);
  console.log('    ✅ Created main depot');

  // ----------------------------------------------------------------------------
  // Pods (Retail kiosks)
  // ----------------------------------------------------------------------------
  console.log('  🏪 Creating pods...');

  const podData = [
    {
      id: randomUUID(),
      name: 'Pod 1 - Extension 5',
      location: {
        address: 'Mandela Street, Extension 5, South Africa',
        lat: -24.6792,
        lng: 30.3247,
      },
      operator_id: null,
      stock: [
        { product_id: productData[2].id, quantity: 20 }, // 9kg
        { product_id: productData[1].id, quantity: 15 }, // 3kg
      ],
      operating_hours: { open: '08:00', close: '18:00' },
      fibertime_pop_id: null,
      active: true,
    },
    {
      id: randomUUID(),
      name: 'Pod 2 - Extension 7',
      location: {
        address: 'Church Street, Extension 7, South Africa',
        lat: -24.685,
        lng: 30.335,
      },
      operator_id: null,
      stock: [
        { product_id: productData[2].id, quantity: 18 },
        { product_id: productData[3].id, quantity: 10 },
      ],
      operating_hours: { open: '08:00', close: '18:00' },
      fibertime_pop_id: null,
      active: true,
    },
    {
      id: randomUUID(),
      name: 'Pod 3 - Main Road',
      location: {
        address: 'Main Road, South Africa Town Center',
        lat: -24.6750,
        lng: 30.3200,
      },
      operator_id: null,
      stock: [
        { product_id: productData[2].id, quantity: 25 },
        { product_id: productData[1].id, quantity: 20 },
        { product_id: productData[0].id, quantity: 30 }, // 1kg
      ],
      operating_hours: { open: '07:00', close: '19:00' },
      fibertime_pop_id: null,
      active: true,
    },
  ];

  await db.insert(pods).values(podData);
  console.log(`    ✅ Created ${podData.length} pods`);

  // ----------------------------------------------------------------------------
  // Vehicles
  // ----------------------------------------------------------------------------
  console.log('  🚛 Creating vehicles...');

  const vehicleData = [
    {
      id: randomUUID(),
      registration: 'GP-123-ABC',
      make: 'Toyota',
      model: 'Hilux',
      capacity_cylinders: 20,
      current_stock: [],
      insurance_expiry: new Date('2026-12-31'),
      service_due_date: new Date('2025-06-30'),
      gps_device_id: 'GPS-001',
      active: true,
    },
    {
      id: randomUUID(),
      registration: 'GP-456-DEF',
      make: 'Isuzu',
      model: 'KB 250',
      capacity_cylinders: 25,
      current_stock: [],
      insurance_expiry: new Date('2026-12-31'),
      service_due_date: new Date('2025-07-15'),
      gps_device_id: 'GPS-002',
      active: true,
    },
  ];

  await db.insert(vehicles).values(vehicleData);
  console.log(`    ✅ Created ${vehicleData.length} vehicles`);

  // ----------------------------------------------------------------------------
  // Drivers
  // ----------------------------------------------------------------------------
  console.log('  👨‍✈️ Creating drivers...');

  const driverData = [
    {
      id: randomUUID(),
      user_id: randomUUID(),
      name: 'Thabo Mokoena',
      phone: '+27781234567',
      license_number: 'LIC123456789',
      license_expiry: new Date('2026-12-31'),
      lpgsa_cert_number: 'LPGSA-001',
      cert_expiry: new Date('2026-12-31'),
      vehicle_id: vehicleData[0].id,
      status: 'online',
      current_location: {
        lat: -24.6792,
        lng: 30.3247,
        updated_at: new Date(),
      },
      rating_avg: 4.8,
      total_deliveries: 247,
      hired_at: new Date('2024-01-01'),
      active: true,
    },
    {
      id: randomUUID(),
      user_id: randomUUID(),
      name: 'Sipho Ndlovu',
      phone: '+27782345678',
      license_number: 'LIC987654321',
      license_expiry: new Date('2026-12-31'),
      lpgsa_cert_number: 'LPGSA-002',
      cert_expiry: new Date('2026-12-31'),
      vehicle_id: vehicleData[1].id,
      status: 'online',
      current_location: {
        lat: -24.685,
        lng: 30.335,
        updated_at: new Date(),
      },
      rating_avg: 4.6,
      total_deliveries: 189,
      hired_at: new Date('2024-02-01'),
      active: true,
    },
  ];

  await db.insert(drivers).values(driverData);
  console.log(`    ✅ Created ${driverData.length} drivers`);

  // ----------------------------------------------------------------------------
  // Customers
  // ----------------------------------------------------------------------------
  console.log('  👥 Creating customers...');

  const customerData = [
    {
      id: randomUUID(),
      phone: '+27783456789',
      name: 'Nomsa Khumalo',
      addresses: [
        {
          text: '47 Mandela Street, Extension 5, South Africa',
          landmark: 'Near the blue tuck shop',
          lat: -24.6792,
          lng: 30.3247,
          is_default: true,
        },
      ],
      wallet_balance: 150.0,
      fibertime_account_id: null,
      referral_code: `REF-${randomUUID().slice(0, 8).toUpperCase()}`,
      referred_by: null,
      segment: 'active',
      language_preference: 'en',
      status: 'active',
      created_at: new Date('2024-01-15'),
    },
    {
      id: randomUUID(),
      phone: '+27784567890',
      name: 'Bongani Sithole',
      addresses: [
        {
          text: '123 Church Street, Extension 7, South Africa',
          landmark: 'Opposite the school',
          lat: -24.685,
          lng: 30.335,
          is_default: true,
        },
      ],
      wallet_balance: 0,
      fibertime_account_id: null,
      referral_code: `REF-${randomUUID().slice(0, 8).toUpperCase()}`,
      referred_by: null,
      segment: 'active',
      language_preference: 'zu',
      status: 'active',
      created_at: new Date('2024-02-01'),
    },
    {
      id: randomUUID(),
      phone: '+27785678901',
      name: 'Lerato Dlamini',
      addresses: [
        {
          text: '56 Main Road, South Africa',
          lat: -24.6750,
          lng: 30.3200,
          is_default: true,
        },
      ],
      wallet_balance: 500.0,
      fibertime_account_id: null,
      referral_code: `REF-${randomUUID().slice(0, 8).toUpperCase()}`,
      referred_by: null,
      segment: 'active',
      language_preference: 'en',
      status: 'active',
      created_at: new Date('2024-01-20'),
    },
  ];

  await db.insert(customers).values(customerData);
  console.log(`    ✅ Created ${customerData.length} customers`);

  // ----------------------------------------------------------------------------
  // Sample Orders
  // ----------------------------------------------------------------------------
  console.log('  📋 Creating sample orders...');

  const orderData = [
    {
      id: randomUUID(),
      reference: 'GT-1001',
      customer_id: customerData[0].id,
      channel: 'app',
      status: 'completed',
      items: [{ product_id: productData[2].id, quantity: 1, unit_price: 315, total: 315 }],
      delivery_address: customerData[0].addresses[0],
      delivery_fee: 0,
      total_amount: 315,
      payment_method: 'cash',
      payment_status: 'paid',
      driver_id: driverData[0].id,
      pod_id: null,
      assigned_at: new Date('2024-02-10T08:30:00'),
      picked_up_at: new Date('2024-02-10T08:45:00'),
      delivered_at: new Date('2024-02-10T09:10:00'),
      delivery_proof: {
        type: 'photo',
        url: 'https://example.com/proof1.jpg',
      },
      rating: 5,
      notes: null,
      created_at: new Date('2024-02-10T08:15:00'),
      cancelled_reason: null,
    },
    {
      id: randomUUID(),
      reference: 'GT-1002',
      customer_id: customerData[1].id,
      channel: 'whatsapp',
      status: 'in_transit',
      items: [{ product_id: productData[2].id, quantity: 2, unit_price: 315, total: 630 }],
      delivery_address: customerData[1].addresses[0],
      delivery_fee: 0,
      total_amount: 630,
      payment_method: 'cash',
      payment_status: 'pending',
      driver_id: driverData[1].id,
      pod_id: null,
      assigned_at: new Date(),
      picked_up_at: new Date(),
      delivered_at: null,
      delivery_proof: null,
      rating: null,
      notes: null,
      created_at: new Date(),
      cancelled_reason: null,
    },
    {
      id: randomUUID(),
      reference: 'GT-1003',
      customer_id: customerData[2].id,
      channel: 'app',
      status: 'created',
      items: [{ product_id: productData[1].id, quantity: 3, unit_price: 99, total: 297 }],
      delivery_address: customerData[2].addresses[0],
      delivery_fee: 0,
      total_amount: 297,
      payment_method: 'wallet',
      payment_status: 'pending',
      driver_id: null,
      pod_id: null,
      assigned_at: null,
      picked_up_at: null,
      delivered_at: null,
      delivery_proof: null,
      rating: null,
      notes: null,
      created_at: new Date(),
      cancelled_reason: null,
    },
  ];

  await db.insert(orders).values(orderData);
  console.log(`    ✅ Created ${orderData.length} sample orders`);

  // ----------------------------------------------------------------------------
  // Cylinders
  // ----------------------------------------------------------------------------
  console.log('  🛢️  Creating cylinders...');

  const cylinderData = [];
  for (let i = 1; i <= 50; i++) {
    cylinderData.push({
      id: randomUUID(),
      serial_number: `CYL-9KG-${String(i).padStart(4, '0')}`,
      size_kg: 9,
      status: 'filled',
      location_type: 'depot',
      location_id: depotData.id,
      fill_count: Math.floor(Math.random() * 20),
      last_filled_at: new Date(),
      last_inspected_at: new Date('2024-01-01'),
      next_inspection_due: new Date('2025-01-01'),
      manufactured_at: new Date('2023-01-01'),
      condemned_at: null,
      movements: [],
    });
  }

  await db.insert(cylinders).values(cylinderData);
  console.log(`    ✅ Created ${cylinderData.length} cylinders`);

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - ${productData.length} products`);
  console.log(`  - 1 depot`);
  console.log(`  - ${podData.length} pods`);
  console.log(`  - ${vehicleData.length} vehicles`);
  console.log(`  - ${driverData.length} drivers`);
  console.log(`  - ${customerData.length} customers`);
  console.log(`  - ${orderData.length} orders`);
  console.log(`  - ${cylinderData.length} cylinders`);
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log('');
      console.log('🎉 Database seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seed };
