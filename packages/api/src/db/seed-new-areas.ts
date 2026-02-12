// Seed data for Walmer Township (Gqeberha) and Khayamandi (Stellenbosch)
import { config } from 'dotenv';
config();

import { db } from './index.js';
import { customers, drivers, pods, depots, orders } from './schema.js';
import { sql } from 'drizzle-orm';

async function seedNewAreas() {
  console.log('🌱 Seeding Walmer Township & Khayamandi...\n');

  // Get product IDs from existing data
  const prods = await db.execute(sql`SELECT id, name, sku FROM products ORDER BY size_kg`);
  const prodMap: Record<string, string> = {};
  for (const p of prods.rows) {
    prodMap[p.sku as string] = p.id as string;
  }
  console.log('  📦 Products found:', Object.keys(prodMap));

  // =============================================
  // WALMER TOWNSHIP, GQEBERHA (Port Elizabeth)
  // Center: -33.976, 25.600
  // =============================================
  console.log('\n  🏘️  Seeding WALMER TOWNSHIP, Gqeberha...');

  // Pods
  await db.insert(pods).values([
    {
      id: 'pod-walmer-1',
      name: 'Pod 4 - Walmer Main',
      location: { address: 'Ngcakani Street, Walmer Township, Gqeberha', lat: -33.9755, lng: 25.5985 },
      stock: [
        { product_id: prodMap['LPG-9KG'], quantity: 25 },
        { product_id: prodMap['LPG-3KG'], quantity: 15 },
        { product_id: prodMap['LPG-1KG'], quantity: 30 },
      ],
      operating_hours: { open: '07:00', close: '19:00' },
      active: true,
    },
    {
      id: 'pod-walmer-2',
      name: 'Pod 5 - Walmer Extension',
      location: { address: 'Makhanda Road, Walmer Township Ext, Gqeberha', lat: -33.9782, lng: 25.6025 },
      stock: [
        { product_id: prodMap['LPG-9KG'], quantity: 20 },
        { product_id: prodMap['LPG-1KG'], quantity: 25 },
      ],
      operating_hours: { open: '07:00', close: '19:00' },
      active: true,
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 2 pods created');

  // Drivers
  await db.insert(drivers).values([
    {
      id: 'drv-walmer-1',
      user_id: 'usr-walmer-drv-1',
      name: 'Siyabonga Mthembu',
      phone: '+27731234567',
      license_number: 'LIC-WLM-001',
      license_expiry: new Date('2027-06-30'),
      lpgsa_cert_number: 'LPGSA-WLM-001',
      cert_expiry: new Date('2027-03-15'),
      status: 'online',
      current_location: { lat: -33.9760, lng: 25.5990 },
      rating_avg: 4.6,
      total_deliveries: 87,
      hired_at: new Date('2025-08-01'),
    },
    {
      id: 'drv-walmer-2',
      user_id: 'usr-walmer-drv-2',
      name: 'Andile Nqweniso',
      phone: '+27739876543',
      license_number: 'LIC-WLM-002',
      license_expiry: new Date('2027-09-15'),
      lpgsa_cert_number: 'LPGSA-WLM-002',
      cert_expiry: new Date('2027-05-20'),
      status: 'offline',
      current_location: { lat: -33.9770, lng: 25.6010 },
      rating_avg: 4.4,
      total_deliveries: 63,
      hired_at: new Date('2025-10-15'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 2 drivers created');

  // Customers
  await db.insert(customers).values([
    {
      id: 'cust-walmer-1',
      name: 'Noxolo Mfengu',
      phone: '+27784321098',
      addresses: [{ lat: -33.9748, lng: 25.5972, text: '14 Ngcakani Street, Walmer Township, Gqeberha', landmark: 'Near the community hall', is_default: true }],
      wallet_balance: 50,
      referral_code: 'REF-WALMER01',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-01-15'),
    },
    {
      id: 'cust-walmer-2',
      name: 'Luyanda Dyani',
      phone: '+27826543210',
      addresses: [{ lat: -33.9762, lng: 25.6001, text: '37 Makhanda Road, Walmer Township, Gqeberha', landmark: 'Opposite the spaza shop', is_default: true }],
      wallet_balance: 0,
      referral_code: 'REF-WALMER02',
      segment: 'new',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-02-01'),
    },
    {
      id: 'cust-walmer-3',
      name: 'Akhona September',
      phone: '+27711112233',
      addresses: [{ lat: -33.9775, lng: 25.6030, text: '22 Extension Road, Walmer Ext, Gqeberha', landmark: 'Near the creche', is_default: true }],
      wallet_balance: 120,
      referral_code: 'REF-WALMER03',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-01-20'),
    },
    {
      id: 'cust-walmer-4',
      name: 'Zukisa Plaatjie',
      phone: '+27834445566',
      addresses: [{ lat: -33.9740, lng: 25.5965, text: '8 Qeqe Street, Walmer Township, Gqeberha', landmark: 'Next to the school', is_default: true }],
      wallet_balance: 200,
      referral_code: 'REF-WALMER04',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2025-12-10'),
    },
    {
      id: 'cust-walmer-5',
      name: 'Asanda Mahlathi',
      phone: '+27727778899',
      addresses: [{ lat: -33.9788, lng: 25.6042, text: '51 Mgobhozi Street, Walmer Township, Gqeberha', landmark: 'Near the taxi rank', is_default: true }],
      wallet_balance: 0,
      referral_code: 'REF-WALMER05',
      segment: 'new',
      language_preference: 'en',
      status: 'active',
      created_at: new Date('2026-02-10'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 5 customers created');

  // Depot
  await db.insert(depots).values({
    id: 'depot-walmer',
    name: 'Walmer Distribution Hub',
    location: { address: 'Industrial Road, Walmer, Gqeberha, 6070', lat: -33.9710, lng: 25.5920 },
    bulk_storage_capacity_tonnes: 60,
    current_stock_tonnes: 42,
    cylinder_stock: [
      { size: 9, filled_count: 80, empty_count: 20 },
      { size: 19, filled_count: 40, empty_count: 10 },
      { size: 48, filled_count: 15, empty_count: 5 },
    ],
    active: true,
  }).onConflictDoNothing();
  console.log('    ✅ 1 depot created');

  // Orders
  await db.insert(orders).values([
    {
      id: 'ord-walmer-1', reference: 'GT-2001', customer_id: 'cust-walmer-1',
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'app', status: 'delivered',
      delivery_address: { lat: -33.9748, lng: 25.5972, text: '14 Ngcakani Street, Walmer Township, Gqeberha' },
      driver_id: 'drv-walmer-1', created_at: new Date('2026-02-12T09:30:00Z'),
    },
    {
      id: 'ord-walmer-2', reference: 'GT-2002', customer_id: 'cust-walmer-4',
      items: [{ product_id: prodMap['LPG-1KG'], quantity: 2, unit_price: 35 }],
      total_amount: 70, payment_method: 'cash', channel: 'app', status: 'delivered',
      delivery_address: { lat: -33.9740, lng: 25.5965, text: '8 Qeqe Street, Walmer Township, Gqeberha' },
      driver_id: 'drv-walmer-1', created_at: new Date('2026-02-12T10:15:00Z'),
    },
    {
      id: 'ord-walmer-3', reference: 'GT-2003', customer_id: 'cust-walmer-3',
      items: [{ product_id: prodMap['LPG-19KG'], quantity: 1, unit_price: 650 }],
      total_amount: 650, payment_method: 'wallet', channel: 'app', status: 'in_transit',
      delivery_address: { lat: -33.9775, lng: 25.6030, text: '22 Extension Road, Walmer Ext, Gqeberha' },
      driver_id: 'drv-walmer-2', created_at: new Date('2026-02-12T14:00:00Z'),
    },
    {
      id: 'ord-walmer-4', reference: 'GT-2004', customer_id: null,
      items: [{ product_id: prodMap['LPG-3KG'], quantity: 1, unit_price: 99 }],
      total_amount: 99, payment_method: 'cash', channel: 'pod', status: 'completed',
      delivery_address: null, pod_id: 'pod-walmer-1', created_at: new Date('2026-02-12T11:20:00Z'),
    },
    {
      id: 'ord-walmer-5', reference: 'GT-2005', customer_id: 'cust-walmer-2',
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'app', status: 'created',
      delivery_address: { lat: -33.9762, lng: 25.6001, text: '37 Makhanda Road, Walmer Township, Gqeberha' },
      created_at: new Date('2026-02-12T15:45:00Z'),
    },
    {
      id: 'ord-walmer-6', reference: 'GT-2006', customer_id: null,
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'pod', status: 'completed',
      delivery_address: null, pod_id: 'pod-walmer-2', created_at: new Date('2026-02-12T12:00:00Z'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 6 orders created');

  // =============================================
  // KHAYAMANDI, STELLENBOSCH
  // Center: -33.926, 18.859
  // =============================================
  console.log('\n  🏘️  Seeding KHAYAMANDI, Stellenbosch...');

  // Pods
  await db.insert(pods).values([
    {
      id: 'pod-khaya-1',
      name: 'Pod 6 - Khayamandi Central',
      location: { address: 'Masithandane Street, Khayamandi, Stellenbosch', lat: -33.9252, lng: 18.8580 },
      stock: [
        { product_id: prodMap['LPG-9KG'], quantity: 22 },
        { product_id: prodMap['LPG-3KG'], quantity: 12 },
        { product_id: prodMap['LPG-1KG'], quantity: 20 },
      ],
      operating_hours: { open: '07:00', close: '18:00' },
      active: true,
    },
    {
      id: 'pod-khaya-2',
      name: 'Pod 7 - Khayamandi Extension',
      location: { address: 'Zone M, Khayamandi, Stellenbosch', lat: -33.9278, lng: 18.8610 },
      stock: [
        { product_id: prodMap['LPG-9KG'], quantity: 18 },
        { product_id: prodMap['LPG-1KG'], quantity: 15 },
      ],
      operating_hours: { open: '07:30', close: '18:00' },
      active: true,
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 2 pods created');

  // Drivers
  await db.insert(drivers).values([
    {
      id: 'drv-khaya-1',
      user_id: 'usr-khaya-drv-1',
      name: 'Themba Jacobs',
      phone: '+27741239876',
      license_number: 'LIC-KHY-001',
      license_expiry: new Date('2027-08-31'),
      lpgsa_cert_number: 'LPGSA-KHY-001',
      cert_expiry: new Date('2027-04-10'),
      status: 'online',
      current_location: { lat: -33.9260, lng: 18.8590 },
      rating_avg: 4.7,
      total_deliveries: 112,
      hired_at: new Date('2025-06-01'),
    },
    {
      id: 'drv-khaya-2',
      user_id: 'usr-khaya-drv-2',
      name: 'Luthando Mei',
      phone: '+27749871234',
      license_number: 'LIC-KHY-002',
      license_expiry: new Date('2027-11-30'),
      lpgsa_cert_number: 'LPGSA-KHY-002',
      cert_expiry: new Date('2027-07-25'),
      status: 'offline',
      current_location: { lat: -33.9275, lng: 18.8605 },
      rating_avg: 4.5,
      total_deliveries: 45,
      hired_at: new Date('2025-11-01'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 2 drivers created');

  // Customers
  await db.insert(customers).values([
    {
      id: 'cust-khaya-1',
      name: 'Mandisa Mkhize',
      phone: '+27786667788',
      addresses: [{ lat: -33.9248, lng: 18.8575, text: '12 Masithandane Street, Khayamandi, Stellenbosch', landmark: 'Near the community centre', is_default: true }],
      wallet_balance: 80,
      referral_code: 'REF-KHAYA01',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-01-10'),
    },
    {
      id: 'cust-khaya-2',
      name: 'Siphosethu Ngxola',
      phone: '+27823334455',
      addresses: [{ lat: -33.9265, lng: 18.8592, text: 'Zone F, House 45, Khayamandi, Stellenbosch', landmark: 'Behind the church', is_default: true }],
      wallet_balance: 0,
      referral_code: 'REF-KHAYA02',
      segment: 'new',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-02-05'),
    },
    {
      id: 'cust-khaya-3',
      name: 'Nosipho Dlomo',
      phone: '+27715556677',
      addresses: [{ lat: -33.9280, lng: 18.8615, text: 'Zone M, Stand 23, Khayamandi, Stellenbosch', landmark: 'Near the tuck shop on the corner', is_default: true }],
      wallet_balance: 150,
      referral_code: 'REF-KHAYA03',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2025-11-20'),
    },
    {
      id: 'cust-khaya-4',
      name: 'Ayanda Feni',
      phone: '+27838889900',
      addresses: [{ lat: -33.9255, lng: 18.8568, text: '18 Manyano Street, Khayamandi, Stellenbosch', landmark: 'Opposite the school', is_default: true }],
      wallet_balance: 30,
      referral_code: 'REF-KHAYA04',
      segment: 'active',
      language_preference: 'xh',
      status: 'active',
      created_at: new Date('2026-01-25'),
    },
    {
      id: 'cust-khaya-5',
      name: 'Bulelani Jafta',
      phone: '+27724441122',
      addresses: [{ lat: -33.9270, lng: 18.8600, text: 'Zone K, House 67, Khayamandi, Stellenbosch', landmark: 'Next to the shebeen', is_default: true }],
      wallet_balance: 0,
      referral_code: 'REF-KHAYA05',
      segment: 'new',
      language_preference: 'af',
      status: 'active',
      created_at: new Date('2026-02-08'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 5 customers created');

  // Depot
  await db.insert(depots).values({
    id: 'depot-khaya',
    name: 'Stellenbosch Distribution Hub',
    location: { address: 'Devon Valley Road, Stellenbosch, 7600', lat: -33.9320, lng: 18.8520 },
    bulk_storage_capacity_tonnes: 40,
    current_stock_tonnes: 28,
    cylinder_stock: [
      { size: 9, filled_count: 60, empty_count: 15 },
      { size: 19, filled_count: 30, empty_count: 8 },
      { size: 48, filled_count: 10, empty_count: 3 },
    ],
    active: true,
  }).onConflictDoNothing();
  console.log('    ✅ 1 depot created');

  // Orders
  await db.insert(orders).values([
    {
      id: 'ord-khaya-1', reference: 'GT-3001', customer_id: 'cust-khaya-1',
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'app', status: 'delivered',
      delivery_address: { lat: -33.9248, lng: 18.8575, text: '12 Masithandane Street, Khayamandi, Stellenbosch' },
      driver_id: 'drv-khaya-1', created_at: new Date('2026-02-12T08:45:00Z'),
    },
    {
      id: 'ord-khaya-2', reference: 'GT-3002', customer_id: 'cust-khaya-3',
      items: [{ product_id: prodMap['LPG-19KG'], quantity: 1, unit_price: 650 }],
      total_amount: 650, payment_method: 'wallet', channel: 'app', status: 'delivered',
      delivery_address: { lat: -33.9280, lng: 18.8615, text: 'Zone M, Stand 23, Khayamandi, Stellenbosch' },
      driver_id: 'drv-khaya-1', created_at: new Date('2026-02-12T10:00:00Z'),
    },
    {
      id: 'ord-khaya-3', reference: 'GT-3003', customer_id: 'cust-khaya-4',
      items: [{ product_id: prodMap['LPG-1KG'], quantity: 2, unit_price: 35 }],
      total_amount: 70, payment_method: 'cash', channel: 'app', status: 'in_transit',
      delivery_address: { lat: -33.9255, lng: 18.8568, text: '18 Manyano Street, Khayamandi, Stellenbosch' },
      driver_id: 'drv-khaya-2', created_at: new Date('2026-02-12T14:30:00Z'),
    },
    {
      id: 'ord-khaya-4', reference: 'GT-3004', customer_id: null,
      items: [{ product_id: prodMap['LPG-3KG'], quantity: 1, unit_price: 99 }],
      total_amount: 99, payment_method: 'cash', channel: 'pod', status: 'completed',
      delivery_address: null, pod_id: 'pod-khaya-1', created_at: new Date('2026-02-12T09:15:00Z'),
    },
    {
      id: 'ord-khaya-5', reference: 'GT-3005', customer_id: 'cust-khaya-2',
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'whatsapp', status: 'created',
      delivery_address: { lat: -33.9265, lng: 18.8592, text: 'Zone F, House 45, Khayamandi, Stellenbosch' },
      created_at: new Date('2026-02-12T15:00:00Z'),
    },
    {
      id: 'ord-khaya-6', reference: 'GT-3006', customer_id: null,
      items: [{ product_id: prodMap['LPG-9KG'], quantity: 1, unit_price: 315 }],
      total_amount: 315, payment_method: 'cash', channel: 'pod', status: 'completed',
      delivery_address: null, pod_id: 'pod-khaya-2', created_at: new Date('2026-02-12T13:30:00Z'),
    },
  ]).onConflictDoNothing();
  console.log('    ✅ 6 orders created');

  // =============================================
  // Clean up old Burgersfort references
  // =============================================
  console.log('\n  🧹 Cleaning up old location names...');
  
  await db.execute(sql`
    UPDATE depots SET name = 'Limpopo Main Depot', 
    location = '{"address": "Industrial Area, Limpopo, 1150", "lat": -24.6792, "lng": 30.3247}'::jsonb 
    WHERE name LIKE '%Burgersfort%' OR name LIKE '%South Africa Main%'
  `);
  
  await db.execute(sql`
    UPDATE pods SET location = jsonb_set(location, '{address}', '"Mandela Street, Extension 5, Limpopo"') 
    WHERE name = 'Pod 1 - Extension 5'
  `);
  await db.execute(sql`
    UPDATE pods SET location = jsonb_set(location, '{address}', '"Church Street, Extension 7, Limpopo"') 
    WHERE name = 'Pod 2 - Extension 7'
  `);
  await db.execute(sql`
    UPDATE pods SET location = jsonb_set(location, '{address}', '"Main Road, Town Centre, Limpopo"') 
    WHERE name = 'Pod 3 - Main Road'
  `);
  console.log('    ✅ Updated old Burgersfort references to Limpopo');

  // Summary
  console.log('\n📊 SEED SUMMARY:');
  const counts = await db.execute(sql`
    SELECT 
      (SELECT count(*) FROM pods) as pods,
      (SELECT count(*) FROM drivers) as drivers,
      (SELECT count(*) FROM customers) as customers,
      (SELECT count(*) FROM orders) as orders,
      (SELECT count(*) FROM depots) as depots
  `);
  console.log('   ', counts.rows[0]);
  console.log('\n✅ Done!');
  process.exit(0);
}

seedNewAreas().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
