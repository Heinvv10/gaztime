#!/usr/bin/env node
// ============================================================================
// Gaztime API Stress Test / Load Test
// Comprehensive load testing with realistic traffic patterns
// ============================================================================

const API_URL = 'http://localhost:3333/api';
const WARMUP_DURATION = 5000; // 5 seconds warmup

// Performance tracking
const metrics = {
  requests: [],
  errors: [],
  startTime: null,
  endTime: null,
};

// Test data storage
const testData = {
  customers: [],
  products: [],
  pods: [],
  drivers: [],
  orders: [],
};

// Utility: Sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility: HTTP Request with metrics
async function apiRequest(method, endpoint, body = null, label = 'request') {
  const startTime = Date.now();
  const url = `${API_URL}${endpoint}`;
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    
    const metric = {
      label,
      method,
      endpoint,
      status: response.status,
      duration,
      timestamp: Date.now(),
      success: response.ok,
    };
    
    metrics.requests.push(metric);
    
    if (!response.ok) {
      metrics.errors.push({
        ...metric,
        error: data?.error || `HTTP ${response.status}`,
      });
    }
    
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const metric = {
      label,
      method,
      endpoint,
      status: 0,
      duration,
      timestamp: Date.now(),
      success: false,
    };
    
    metrics.requests.push(metric);
    metrics.errors.push({
      ...metric,
      error: error.message,
    });
    
    return { ok: false, status: 0, data: null, error: error.message };
  }
}

// ============================================================================
// PHASE 0: Setup Test Data
// ============================================================================

async function setupTestData() {
  console.log('📦 Setting up test data...\n');
  
  // 1. Fetch existing products
  console.log('  → Fetching existing products...');
  const productsRes = await apiRequest('GET', '/products', null, 'setup');
  if (productsRes.ok && productsRes.data) {
    testData.products = productsRes.data;
    console.log(`    ✓ Found ${testData.products.length} products`);
  } else {
    throw new Error('Failed to fetch products');
  }
  
  // 2. Fetch existing pods
  console.log('  → Fetching existing pods...');
  const podsRes = await apiRequest('GET', '/pods', null, 'setup');
  if (podsRes.ok && podsRes.data) {
    testData.pods = podsRes.data;
    console.log(`    ✓ Found ${testData.pods.length} pods`);
  } else {
    throw new Error('Failed to fetch pods');
  }
  
  // 3. Fetch existing drivers
  console.log('  → Fetching existing drivers...');
  const driversRes = await apiRequest('GET', '/drivers', null, 'setup');
  if (driversRes.ok && driversRes.data) {
    testData.drivers = driversRes.data;
    console.log(`    ✓ Found ${testData.drivers.length} drivers`);
  } else {
    throw new Error('Failed to fetch drivers');
  }
  
  // 4. Create 200 test customers
  console.log('  → Creating 200 test customers...');
  const customerBatches = 4; // Create in batches
  const customersPerBatch = 50;
  
  for (let batch = 0; batch < customerBatches; batch++) {
    const promises = [];
    
    for (let i = 0; i < customersPerBatch; i++) {
      const customerNum = batch * customersPerBatch + i + 1;
      const timestamp = Date.now();
      const uniqueId = timestamp.toString().slice(-6) + String(customerNum).padStart(3, '0');
      const phone = `+2791${uniqueId}`;
      
      promises.push(
        apiRequest('POST', '/customers', {
          name: `StressTest User ${uniqueId}`,
          phone,
          address: {
            text: `Test Address ${uniqueId}, Limpopo`,
            lat: -24.6792 + (Math.random() - 0.5) * 0.1,
            lng: 30.3247 + (Math.random() - 0.5) * 0.1,
            isDefault: true,
          },
          languagePreference: ['en', 'zu', 'xh'][customerNum % 3],
        }, 'customer_create')
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.ok && r.data?.data);
    testData.customers.push(...successful.map(r => r.data.data));
    
    process.stdout.write(`\r    Progress: ${testData.customers.length}/500 customers created`);
  }
  
  console.log('\n    ✓ Customer creation complete');
  console.log(`\n✅ Test data ready: ${testData.customers.length} customers, ${testData.products.length} products, ${testData.pods.length} pods, ${testData.drivers.length} drivers\n`);
}

// ============================================================================
// Traffic Patterns
// ============================================================================

// Customer ordering flow
async function customerOrderFlow(customerId) {
  const customer = testData.customers.find(c => c.id === customerId);
  if (!customer) return;
  
  // 1. Browse products
  await apiRequest('GET', '/products', null, 'browse_products');
  await sleep(Math.random() * 500 + 200); // Think time
  
  // 2. Create order
  const product = testData.products[Math.floor(Math.random() * testData.products.length)];
  const orderRes = await apiRequest('POST', '/orders', {
    customerId: customer.id,
    channel: ['app', 'whatsapp', 'ussd'][Math.floor(Math.random() * 3)],
    items: [{
      productId: product.id,
      quantity: Math.floor(Math.random() * 3) + 1,
    }],
    deliveryAddress: customer.addresses[0],
    paymentMethod: ['cash', 'wallet', 'mobile_money'][Math.floor(Math.random() * 3)],
  }, 'create_order');
  
  if (orderRes.ok && orderRes.data?.data) {
    testData.orders.push(orderRes.data.data);
    
    // 3. Track order status
    await sleep(Math.random() * 1000 + 500);
    await apiRequest('GET', `/orders/${orderRes.data.data.id}`, null, 'track_order');
  }
}

// Driver operations flow
async function driverOperationsFlow(driverId) {
  const driver = testData.drivers.find(d => d.id === driverId);
  if (!driver) return;
  
  // 1. Update location
  await apiRequest('PATCH', `/drivers/${driver.id}/location`, {
    location: {
      lat: -24.6792 + (Math.random() - 0.5) * 0.05,
      lng: 30.3247 + (Math.random() - 0.5) * 0.05,
    },
  }, 'driver_location');
  
  await sleep(Math.random() * 500);
  
  // 2. Check for available orders
  const ordersRes = await apiRequest('GET', '/orders?status=created', null, 'driver_check_orders');
  
  if (ordersRes.ok && ordersRes.data?.data?.length > 0) {
    const order = ordersRes.data.data[Math.floor(Math.random() * ordersRes.data.data.length)];
    
    // 3. Accept delivery
    await apiRequest('POST', `/orders/${order.id}/assign`, {
      driverId: driver.id,
    }, 'driver_accept');
    
    await sleep(Math.random() * 2000 + 1000);
    
    // 4. Update to in_transit
    await apiRequest('PATCH', `/orders/${order.id}/status`, {
      status: 'in_transit',
    }, 'driver_in_transit');
    
    await sleep(Math.random() * 3000 + 2000);
    
    // 5. Complete delivery
    await apiRequest('PATCH', `/orders/${order.id}/status`, {
      status: 'delivered',
      deliveryProof: {
        type: 'photo',
        url: 'https://example.com/proof.jpg',
        timestamp: new Date().toISOString(),
      },
    }, 'driver_complete');
  }
}

// POS sales flow
async function posSalesFlow(podId) {
  const pod = testData.pods.find(p => p.id === podId);
  if (!pod) return;
  
  // 1. Walk-in sale (no customer)
  const product = testData.products[Math.floor(Math.random() * testData.products.length)];
  
  await apiRequest('POST', '/orders', {
    channel: 'pos',
    items: [{
      productId: product.id,
      quantity: 1,
    }],
    podId: pod.id,
    paymentMethod: 'cash',
  }, 'pos_sale');
}

// Admin dashboard polling
async function adminDashboardFlow() {
  // Poll orders
  await apiRequest('GET', '/orders?limit=20', null, 'admin_orders');
  
  await sleep(Math.random() * 200);
  
  // Poll customers
  await apiRequest('GET', '/customers?limit=20', null, 'admin_customers');
  
  await sleep(Math.random() * 200);
  
  // Check inventory
  await apiRequest('GET', '/inventory/stock', null, 'admin_inventory');
}

// ============================================================================
// Test Execution with Ramp-up
// ============================================================================

async function runLoadPhase(phase, concurrentUsers, durationMs) {
  console.log(`\n🔥 Phase ${phase}: ${concurrentUsers} concurrent users for ${durationMs / 1000}s`);
  console.log('─'.repeat(60));
  
  const phaseStart = Date.now();
  const workers = [];
  
  // Spawn concurrent workers
  for (let i = 0; i < concurrentUsers; i++) {
    workers.push(
      (async () => {
        while (Date.now() - phaseStart < durationMs) {
          const action = Math.random();
          
          if (action < 0.5) {
            // 50% customer ordering
            const customer = testData.customers[Math.floor(Math.random() * testData.customers.length)];
            await customerOrderFlow(customer.id);
          } else if (action < 0.65) {
            // 15% driver operations
            if (testData.drivers.length > 0) {
              const driver = testData.drivers[Math.floor(Math.random() * testData.drivers.length)];
              await driverOperationsFlow(driver.id);
            }
          } else if (action < 0.75) {
            // 10% POS sales
            if (testData.pods.length > 0) {
              const pod = testData.pods[Math.floor(Math.random() * testData.pods.length)];
              await posSalesFlow(pod.id);
            }
          } else {
            // 25% admin dashboard
            await adminDashboardFlow();
          }
          
          await sleep(Math.random() * 1000 + 500); // Random think time
        }
      })()
    );
  }
  
  // Wait for phase to complete
  await Promise.all(workers);
  
  // Report phase metrics
  const phaseRequests = metrics.requests.filter(
    r => r.timestamp >= phaseStart && r.timestamp <= Date.now()
  );
  const phaseErrors = metrics.errors.filter(
    e => e.timestamp >= phaseStart && e.timestamp <= Date.now()
  );
  
  console.log(`\n📊 Phase ${phase} Results:`);
  console.log(`  Total Requests: ${phaseRequests.length}`);
  console.log(`  Errors: ${phaseErrors.length} (${((phaseErrors.length / phaseRequests.length) * 100).toFixed(2)}%)`);
  console.log(`  Requests/sec: ${(phaseRequests.length / (durationMs / 1000)).toFixed(2)}`);
}

async function runEdgeCaseTests() {
  console.log('\n🧪 Running edge case tests...\n');
  
  // 1. Concurrent orders for same product (race condition on stock)
  console.log('  → Testing concurrent orders for same product...');
  const product = testData.products[0];
  const concurrentOrderPromises = [];
  
  for (let i = 0; i < 10; i++) {
    const customer = testData.customers[i];
    concurrentOrderPromises.push(
      apiRequest('POST', '/orders', {
        customerId: customer.id,
        channel: 'app',
        items: [{ productId: product.id, quantity: 1 }],
        deliveryAddress: customer.addresses[0],
        paymentMethod: 'cash',
      }, 'edge_concurrent_orders')
    );
  }
  
  const results = await Promise.all(concurrentOrderPromises);
  console.log(`    ✓ ${results.filter(r => r.ok).length}/10 orders succeeded`);
  
  // 2. Same customer placing multiple simultaneous orders
  console.log('  → Testing same customer multiple simultaneous orders...');
  const customer = testData.customers[0];
  const multiOrderPromises = [];
  
  for (let i = 0; i < 5; i++) {
    multiOrderPromises.push(
      apiRequest('POST', '/orders', {
        customerId: customer.id,
        channel: 'app',
        items: [{ productId: testData.products[i % testData.products.length].id, quantity: 1 }],
        deliveryAddress: customer.addresses[0],
        paymentMethod: 'cash',
      }, 'edge_multi_orders_same_customer')
    );
  }
  
  const multiResults = await Promise.all(multiOrderPromises);
  console.log(`    ✓ ${multiResults.filter(r => r.ok).length}/5 orders succeeded`);
  
  // 3. Driver assigned to multiple deliveries at once
  if (testData.drivers.length > 0 && testData.orders.length >= 2) {
    console.log('  → Testing driver assigned to multiple deliveries...');
    const driver = testData.drivers[0];
    const assignPromises = [];
    
    // Get first 2 unassigned orders
    const unassignedOrders = testData.orders.filter(o => !o.driverId).slice(0, 2);
    
    for (const order of unassignedOrders) {
      assignPromises.push(
        apiRequest('POST', `/orders/${order.id}/assign`, {
          driverId: driver.id,
        }, 'edge_multi_assign_driver')
      );
    }
    
    const assignResults = await Promise.all(assignPromises);
    console.log(`    ✓ ${assignResults.filter(r => r.ok).length}/${unassignedOrders.length} assignments succeeded`);
  }
  
  console.log('\n✅ Edge case tests complete\n');
}

// ============================================================================
// Results Analysis and Reporting
// ============================================================================

function calculatePercentile(values, percentile) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

function generateReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const totalRequests = metrics.requests.length;
  const totalErrors = metrics.errors.length;
  const successfulRequests = totalRequests - totalErrors;
  
  const durations = metrics.requests.map(r => r.duration);
  const p50 = calculatePercentile(durations, 50);
  const p95 = calculatePercentile(durations, 95);
  const p99 = calculatePercentile(durations, 99);
  
  // Group by label
  const byLabel = {};
  for (const req of metrics.requests) {
    if (!byLabel[req.label]) {
      byLabel[req.label] = { total: 0, errors: 0, durations: [] };
    }
    byLabel[req.label].total++;
    byLabel[req.label].durations.push(req.duration);
    if (!req.success) {
      byLabel[req.label].errors++;
    }
  }
  
  let report = `# Gaztime API Stress Test Results\n\n`;
  report += `**Test Date:** ${new Date().toISOString()}\n`;
  report += `**Duration:** ${duration.toFixed(2)}s\n`;
  report += `**API URL:** ${API_URL}\n\n`;
  
  report += `## Summary Metrics\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Requests | ${totalRequests} |\n`;
  report += `| Successful | ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%) |\n`;
  report += `| Failed | ${totalErrors} (${((totalErrors / totalRequests) * 100).toFixed(2)}%) |\n`;
  report += `| Requests/sec | ${(totalRequests / duration).toFixed(2)} |\n`;
  report += `| Avg Response Time | ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)}ms |\n`;
  report += `| p50 Response Time | ${p50.toFixed(2)}ms |\n`;
  report += `| p95 Response Time | ${p95.toFixed(2)}ms |\n`;
  report += `| p99 Response Time | ${p99.toFixed(2)}ms |\n\n`;
  
  report += `## Breakdown by Operation\n\n`;
  report += `| Operation | Total | Errors | Error Rate | Avg Duration |\n`;
  report += `|-----------|-------|--------|------------|-------------|\n`;
  
  for (const [label, stats] of Object.entries(byLabel)) {
    const avgDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
    const errorRate = ((stats.errors / stats.total) * 100).toFixed(2);
    report += `| ${label} | ${stats.total} | ${stats.errors} | ${errorRate}% | ${avgDuration.toFixed(2)}ms |\n`;
  }
  
  report += `\n## Error Details\n\n`;
  if (totalErrors === 0) {
    report += `No errors encountered! 🎉\n\n`;
  } else {
    report += `| Endpoint | Status | Error | Count |\n`;
    report += `|----------|--------|-------|-------|\n`;
    
    const errorGroups = {};
    for (const err of metrics.errors) {
      const key = `${err.endpoint}|${err.status}|${JSON.stringify(err.error)}`;
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    }
    
    for (const [key, count] of Object.entries(errorGroups)) {
      const [endpoint, status, error] = key.split('|');
      report += `| ${endpoint} | ${status} | ${error} | ${count} |\n`;
    }
    report += `\n`;
  }
  
  report += `## Test Configuration\n\n`;
  report += `- **Test Customers:** 200\n`;
  report += `- **Products:** ${testData.products.length}\n`;
  report += `- **Pods:** ${testData.pods.length}\n`;
  report += `- **Drivers:** ${testData.drivers.length}\n\n`;
  
  report += `### Load Phases\n\n`;
  report += `1. **Phase 1:** 10 concurrent users, 30 seconds\n`;
  report += `2. **Phase 2:** 50 concurrent users, 1 minute\n`;
  report += `3. **Phase 3:** 100 concurrent users, 1.5 minutes\n`;
  report += `4. **Phase 4:** 200 concurrent users, 2 minutes\n\n`;
  
  report += `## Bottleneck Analysis\n\n`;
  
  // Find slowest operations
  const slowestOps = Object.entries(byLabel)
    .map(([label, stats]) => ({
      label,
      avgDuration: stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 5);
  
  report += `### Slowest Operations\n\n`;
  for (const op of slowestOps) {
    report += `- **${op.label}**: ${op.avgDuration.toFixed(2)}ms average\n`;
  }
  report += `\n`;
  
  // Breaking point analysis
  report += `## Breaking Point\n\n`;
  if (totalErrors / totalRequests > 0.05) {
    report += `⚠️ **System showed signs of stress** with ${((totalErrors / totalRequests) * 100).toFixed(2)}% error rate.\n\n`;
    report += `The system began to fail under load. Primary issues:\n`;
    
    const topErrors = Object.entries(errorGroups).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [key, count] of topErrors) {
      const [endpoint] = key.split('|');
      report += `- ${endpoint}: ${count} failures\n`;
    }
  } else {
    report += `✅ **System handled load well** with only ${((totalErrors / totalRequests) * 100).toFixed(2)}% error rate.\n\n`;
    report += `The system successfully handled ${(totalRequests / duration).toFixed(2)} requests/sec with acceptable performance.\n`;
  }
  report += `\n`;
  
  report += `## Recommendations for Production Scaling\n\n`;
  
  if (p95 > 1000) {
    report += `1. **Database Optimization**: p95 response time is ${p95.toFixed(2)}ms. Consider:\n`;
    report += `   - Adding database indexes on frequently queried fields\n`;
    report += `   - Connection pooling optimization\n`;
    report += `   - Query optimization for slow endpoints\n\n`;
  }
  
  if (totalErrors / totalRequests > 0.01) {
    report += `2. **Error Handling**: ${((totalErrors / totalRequests) * 100).toFixed(2)}% error rate detected. Investigate:\n`;
    report += `   - Database connection limits\n`;
    report += `   - Race conditions in order processing\n`;
    report += `   - Input validation issues\n\n`;
  }
  
  report += `3. **Horizontal Scaling**:\n`;
  report += `   - Current load: ${(totalRequests / duration).toFixed(2)} req/s\n`;
  report += `   - For 10x traffic: Consider load balancer + multiple API instances\n`;
  report += `   - Neon PostgreSQL serverless should auto-scale, monitor connection limits\n\n`;
  
  report += `4. **Caching Strategy**:\n`;
  report += `   - Cache product listings (changes infrequently)\n`;
  report += `   - Cache pod locations and operating hours\n`;
  report += `   - Redis for session state and hot data\n\n`;
  
  report += `5. **Database Connection Pool**:\n`;
  report += `   - Monitor Neon connection usage\n`;
  report += `   - Set appropriate pool size based on load\n`;
  report += `   - Consider PgBouncer for connection pooling\n\n`;
  
  report += `## Memory Usage\n\n`;
  const memUsage = process.memoryUsage();
  report += `- **RSS:** ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB\n`;
  report += `- **Heap Used:** ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
  report += `- **Heap Total:** ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
  report += `- **External:** ${(memUsage.external / 1024 / 1024).toFixed(2)} MB\n\n`;
  
  return report;
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('🚀 Gaztime API Stress Test\n');
  console.log('═'.repeat(60));
  
  try {
    // Setup
    await setupTestData();
    
    // Warmup
    console.log('🔥 Warming up...');
    for (let i = 0; i < 10; i++) {
      await apiRequest('GET', '/health', null, 'warmup');
    }
    await sleep(WARMUP_DURATION);
    console.log('✓ Warmup complete\n');
    
    // Start metrics tracking
    metrics.startTime = Date.now();
    
    // Phase 1: 10 concurrent users, 30 sec
    await runLoadPhase(1, 10, 30 * 1000);
    
    // Phase 2: 50 concurrent users, 1 min
    await runLoadPhase(2, 50, 1 * 60 * 1000);
    
    // Phase 3: 100 concurrent users, 1.5 min
    await runLoadPhase(3, 100, 90 * 1000);
    
    // Phase 4: 200 concurrent users, 2 min
    await runLoadPhase(4, 200, 2 * 60 * 1000);
    
    // Edge case tests
    await runEdgeCaseTests();
    
    // End metrics tracking
    metrics.endTime = Date.now();
    
    // Generate and save report
    console.log('\n📝 Generating report...\n');
    const report = generateReport();
    
    const fs = await import('fs');
    fs.writeFileSync('/home/hein/clawd/gaztime/AUDIT-STRESS-TEST.md', report);
    
    console.log('✅ Report saved to /home/hein/clawd/gaztime/AUDIT-STRESS-TEST.md\n');
    console.log(report);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
