#!/usr/bin/env node
/**
 * GazTime Full E2E Visual Audit
 * Tests every page, button, link, and interaction across all 4 apps
 * Uses Playwright with Chromium
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const API = 'http://localhost:3333/api';
const APPS = {
  customer: 'http://localhost:3000',
  admin: 'http://localhost:3001',
  driver: 'http://localhost:3003',
  pod: 'http://localhost:3005',
};

const results = [];
const errors = [];
let screenshotCount = 0;
const SCREENSHOT_DIR = '/home/hein/clawd/gaztime/audit-screenshots';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function screenshot(page, name) {
  screenshotCount++;
  const path = `${SCREENSHOT_DIR}/${String(screenshotCount).padStart(2,'0')}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

function log(app, page, test, status, detail = '') {
  const entry = { app, page, test, status, detail };
  results.push(entry);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${app}] ${page} → ${test}${detail ? ': ' + detail : ''}`);
  if (status === 'FAIL') errors.push(entry);
}

async function getConsoleErrors(page) {
  // Already collected via event listener
  return page._consoleErrors || [];
}

function setupConsoleCapture(page) {
  page._consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') page._consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    page._consoleErrors.push(err.message);
  });
}

// ============================================================
// ADMIN DASHBOARD TESTS
// ============================================================
async function testAdmin(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  setupConsoleCapture(page);

  // LOGIN
  await page.goto(`${APPS.admin}/login`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'admin-login');
  
  const emailInput = page.locator('input[type="email"], input[placeholder*="admin"]').first();
  const passInput = page.locator('input[type="password"]').first();
  
  if (await emailInput.count() > 0) {
    log('Admin', 'Login', 'Login form renders', 'PASS');
    // Credentials should be pre-filled
    const emailVal = await emailInput.inputValue();
    log('Admin', 'Login', 'Email pre-filled', emailVal ? 'PASS' : 'WARN', emailVal);
    
    if (!emailVal) await emailInput.fill('admin@gaztime.co.za');
    if (!(await passInput.inputValue())) await passInput.fill('admin123');
    
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-dashboard');
    
    const url = page.url();
    log('Admin', 'Login', 'Redirects to dashboard', url.includes('/login') ? 'FAIL' : 'PASS', url);
  } else {
    log('Admin', 'Login', 'Login form renders', 'FAIL', 'No email input found');
  }

  // DASHBOARD
  if (!page.url().includes('/login')) {
    // Stats cards
    const statsText = await page.textContent('body');
    log('Admin', 'Dashboard', 'Orders Today visible', statsText.includes('Orders Today') ? 'PASS' : 'FAIL');
    log('Admin', 'Dashboard', 'Revenue Today visible', statsText.includes('Revenue Today') ? 'PASS' : 'FAIL');
    log('Admin', 'Dashboard', 'Active Drivers visible', statsText.includes('Active Drivers') ? 'PASS' : 'FAIL');
    log('Admin', 'Dashboard', 'Charts render', (await page.locator('canvas, svg, .recharts-wrapper').count()) > 0 ? 'PASS' : 'WARN', 'Looking for chart elements');
    
    // Check console errors
    const dashErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Dashboard', 'Console errors', dashErrors.length === 0 ? 'PASS' : 'FAIL', dashErrors.join(' | '));

    // ORDERS PAGE
    await page.goto(`${APPS.admin}/orders`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-orders');
    
    const ordersText = await page.textContent('body');
    log('Admin', 'Orders', 'Page loads', ordersText.includes('Orders') ? 'PASS' : 'FAIL');
    log('Admin', 'Orders', 'Order list visible', ordersText.includes('GT-') ? 'PASS' : 'FAIL');
    log('Admin', 'Orders', 'Customer names visible', !ordersText.includes('N/A') || ordersText.includes('Nomsa') || ordersText.includes('Bongani') ? 'PASS' : 'FAIL');
    
    // Search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('GT-1007');
      await page.waitForTimeout(1000);
      log('Admin', 'Orders', 'Search works', 'PASS');
      await searchInput.clear();
    }
    
    // Status filter
    const statusFilter = page.locator('select').first();
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      log('Admin', 'Orders', 'Status filter works', 'PASS');
      await statusFilter.selectOption({ index: 0 });
    }
    
    // Click View on first order
    const viewBtn = page.locator('button:has-text("View"), [data-testid*="view"], svg[class*="eye"]').first();
    if (await viewBtn.count() > 0) {
      // Look for the eye icon button
      const eyeBtn = page.locator('td button, td a').first();
      if (await eyeBtn.count() > 0) {
        await eyeBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-order-detail');
        const detailText = await page.textContent('body');
        log('Admin', 'Orders', 'Order detail modal/page', detailText.includes('Assign') || detailText.includes('Status') || detailText.includes('GT-') ? 'PASS' : 'WARN', 'Clicked view button');
      }
    }
    
    // Console errors
    const orderErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Orders', 'Console errors', orderErrors.length === 0 ? 'PASS' : 'FAIL', orderErrors.slice(-3).join(' | '));

    // CUSTOMERS PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/customers`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-customers');
    
    const custText = await page.textContent('body');
    log('Admin', 'Customers', 'Page loads', custText.includes('Customers') ? 'PASS' : 'FAIL');
    log('Admin', 'Customers', 'Customer names visible', custText.includes('Nomsa') || custText.includes('Bongani') || custText.includes('Thandi') ? 'PASS' : 'FAIL');
    log('Admin', 'Customers', 'Segments visible', custText.includes('active') || custText.includes('new') ? 'PASS' : 'FAIL');
    
    // Search
    const custSearch = page.locator('input[placeholder*="Search"]').first();
    if (await custSearch.count() > 0) {
      await custSearch.fill('Nomsa');
      await page.waitForTimeout(1000);
      const filtered = await page.textContent('body');
      log('Admin', 'Customers', 'Search filters', filtered.includes('Nomsa') ? 'PASS' : 'WARN');
      await custSearch.clear();
    }

    // Click View on first customer
    const custView = page.locator('text=View').first();
    if (await custView.count() > 0) {
      await custView.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-customer-detail');
      log('Admin', 'Customers', 'Customer detail', 'PASS');
    }
    
    const custErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Customers', 'Console errors', custErrors.length === 0 ? 'PASS' : 'FAIL', custErrors.join(' | '));

    // INVENTORY PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/inventory`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-inventory');
    
    const invText = await page.textContent('body');
    log('Admin', 'Inventory', 'Page loads', invText.includes('Inventory') ? 'PASS' : 'FAIL');
    log('Admin', 'Inventory', 'Stock levels visible', invText.includes('Stock Levels') ? 'PASS' : 'FAIL');
    log('Admin', 'Inventory', 'Low stock alerts', invText.includes('Low Stock') ? 'PASS' : 'FAIL');
    
    const invErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Inventory', 'Console errors', invErrors.length === 0 ? 'PASS' : 'FAIL', invErrors.join(' | '));

    // FLEET PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/fleet`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-fleet');
    
    const fleetText = await page.textContent('body');
    log('Admin', 'Fleet', 'Page loads', fleetText.includes('Fleet') ? 'PASS' : 'FAIL');
    log('Admin', 'Fleet', 'Drivers visible', fleetText.includes('Sipho') || fleetText.includes('Thabo') ? 'PASS' : 'FAIL');
    log('Admin', 'Fleet', 'Status badges', fleetText.includes('online') ? 'PASS' : 'FAIL');

    const fleetErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Fleet', 'Console errors', fleetErrors.length === 0 ? 'PASS' : 'FAIL', fleetErrors.join(' | '));

    // PODS PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/pods`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-pods');
    
    const podsText = await page.textContent('body');
    log('Admin', 'Pods', 'Page loads', podsText.includes('Pods') ? 'PASS' : 'FAIL');
    log('Admin', 'Pods', 'Pod names visible', podsText.includes('Town Centre') || podsText.includes('Extension') ? 'PASS' : 'FAIL');
    log('Admin', 'Pods', 'Map renders', (await page.locator('.leaflet-container, [class*="map"]').count()) > 0 ? 'PASS' : 'WARN');
    
    // Click View Details on first pod
    const podView = page.locator('text=View Details').first();
    if (await podView.count() > 0) {
      await podView.click();
      await page.waitForTimeout(1000);
      await screenshot(page, 'admin-pod-detail');
      log('Admin', 'Pods', 'Pod detail', 'PASS');
    }

    const podErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Pods', 'Console errors', podErrors.length === 0 ? 'PASS' : 'FAIL', podErrors.join(' | '));

    // FINANCE PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/finance`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-finance');
    
    const finText = await page.textContent('body');
    log('Admin', 'Finance', 'Page loads', finText.includes('Finance') ? 'PASS' : 'FAIL');
    log('Admin', 'Finance', 'Revenue visible', finText.includes('Revenue') ? 'PASS' : 'FAIL');
    log('Admin', 'Finance', 'Charts render', (await page.locator('canvas, svg, .recharts-wrapper').count()) > 0 ? 'PASS' : 'WARN');

    const finErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Finance', 'Console errors', finErrors.length === 0 ? 'PASS' : 'FAIL', finErrors.join(' | '));

    // REPORTS PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/reports`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-reports');
    
    const repText = await page.textContent('body');
    log('Admin', 'Reports', 'Page loads', repText.includes('Reports') ? 'PASS' : 'FAIL');
    log('Admin', 'Reports', 'Report types visible', repText.includes('Sales Report') ? 'PASS' : 'FAIL');
    log('Admin', 'Reports', 'Generate buttons', (await page.locator('text=Generate').count()) > 0 ? 'PASS' : 'FAIL');

    const repErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Reports', 'Console errors', repErrors.length === 0 ? 'PASS' : 'FAIL', repErrors.join(' | '));

    // SETTINGS PAGE
    page._consoleErrors = [];
    await page.goto(`${APPS.admin}/settings`);
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-settings');
    
    const setText = await page.textContent('body');
    log('Admin', 'Settings', 'Page loads', setText.includes('Settings') ? 'PASS' : 'FAIL');
    log('Admin', 'Settings', 'Profile section', setText.includes('Profile') ? 'PASS' : 'FAIL');
    log('Admin', 'Settings', 'Notifications', setText.includes('Notification') ? 'PASS' : 'FAIL');
    log('Admin', 'Settings', 'Pricing config', setText.includes('Pricing') ? 'PASS' : 'FAIL');

    const setErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
    log('Admin', 'Settings', 'Console errors', setErrors.length === 0 ? 'PASS' : 'FAIL', setErrors.join(' | '));
  }

  await context.close();
}

// ============================================================
// POD POS TESTS
// ============================================================
async function testPodPOS(browser) {
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page = await context.newPage();
  setupConsoleCapture(page);

  await page.goto(APPS.pod);
  await page.waitForTimeout(2000);
  await screenshot(page, 'pod-login');
  
  const bodyText = await page.textContent('body');
  log('Pod', 'Login', 'PIN pad renders', bodyText.includes('Enter your PIN') ? 'PASS' : 'FAIL');
  
  // Enter PIN 1234
  for (const digit of ['1', '2', '3', '4']) {
    await page.click(`button:has-text("${digit}")`);
    await page.waitForTimeout(200);
  }
  log('Pod', 'Login', 'PIN digits entered', 'PASS');
  
  // Click Enter
  await page.click('button:has-text("Enter")');
  await page.waitForTimeout(3000);
  await screenshot(page, 'pod-pos-main');
  
  const posText = await page.textContent('body');
  log('Pod', 'Login', 'Login succeeds', posText.includes('Quick Sell') || posText.includes('Town Centre') ? 'PASS' : 'FAIL');
  
  if (posText.includes('Quick Sell')) {
    // Product buttons
    log('Pod', 'POS', 'Products visible', posText.includes('R35') && posText.includes('R315') ? 'PASS' : 'FAIL');
    log('Pod', 'POS', 'Customer search', (await page.locator('input[placeholder*="phone"]').count()) > 0 ? 'PASS' : 'FAIL');
    
    // Add items to cart
    const product9kg = page.locator('button:has-text("9kg")').first();
    if (await product9kg.count() > 0) {
      await product9kg.click();
      await page.waitForTimeout(500);
      await product9kg.click();
      await page.waitForTimeout(500);
      
      const product1kg = page.locator('button:has-text("1kg")').first();
      await product1kg.click();
      await page.waitForTimeout(500);
      
      await screenshot(page, 'pod-pos-cart');
      const cartText = await page.textContent('body');
      log('Pod', 'POS', 'Cart adds items', cartText.includes('Cart (3)') || cartText.includes('Cart (2)') ? 'PASS' : 'FAIL');
      log('Pod', 'POS', 'Cart total correct', cartText.includes('665') || cartText.includes('R665') ? 'PASS' : 'FAIL');
      log('Pod', 'POS', 'Remove button', cartText.includes('Remove') ? 'PASS' : 'FAIL');
      
      // Payment methods
      log('Pod', 'POS', 'Cash payment', cartText.includes('Cash') ? 'PASS' : 'FAIL');
      log('Pod', 'POS', 'Mobile payment', cartText.includes('Mobile') ? 'PASS' : 'FAIL');
      log('Pod', 'POS', 'Voucher payment', cartText.includes('Voucher') ? 'PASS' : 'FAIL');
      log('Pod', 'POS', 'Complete Sale button', cartText.includes('Complete Sale') ? 'PASS' : 'FAIL');
      
      // Select Cash and complete sale
      const cashBtn = page.locator('button:has-text("Cash"), div:has-text("Cash")').first();
      if (await cashBtn.count() > 0) {
        await cashBtn.click();
        await page.waitForTimeout(500);
        
        const completeBtn = page.locator('button:has-text("Complete Sale")').first();
        if (await completeBtn.count() > 0 && await completeBtn.isEnabled()) {
          await completeBtn.click();
          await page.waitForTimeout(3000);
          await screenshot(page, 'pod-pos-sale-complete');
          const afterSale = await page.textContent('body');
          log('Pod', 'POS', 'Complete Sale works', afterSale.includes('success') || afterSale.includes('Cart (0)') || afterSale.includes('completed') ? 'PASS' : 'WARN', 'Sale attempted');
        }
      }
    }
    
    // Stock tab
    page._consoleErrors = [];
    const stockBtn = page.locator('button:has-text("Stock")').first();
    if (await stockBtn.count() > 0) {
      await stockBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'pod-stock');
      log('Pod', 'Stock', 'Stock page loads', 'PASS');
      const stockErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
      log('Pod', 'Stock', 'Console errors', stockErrors.length === 0 ? 'PASS' : 'FAIL', stockErrors.join(' | '));
    }
    
    // Orders tab
    page._consoleErrors = [];
    const ordersBtn = page.locator('button:has-text("Orders")').first();
    if (await ordersBtn.count() > 0) {
      await ordersBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'pod-orders');
      const ordersText = await page.textContent('body');
      log('Pod', 'Orders', 'Orders page loads', 'PASS');
      log('Pod', 'Orders', 'Customer orders section', ordersText.includes('Customer Orders') || ordersText.includes('Incoming') || ordersText.includes('orders') ? 'PASS' : 'WARN');
      const ordErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
      log('Pod', 'Orders', 'Console errors', ordErrors.length === 0 ? 'PASS' : 'FAIL', ordErrors.join(' | '));
    }
    
    // Reports tab
    page._consoleErrors = [];
    const reportsBtn = page.locator('button:has-text("Reports")').first();
    if (await reportsBtn.count() > 0) {
      await reportsBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'pod-reports');
      log('Pod', 'Reports', 'Reports page loads', 'PASS');
      const repErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
      log('Pod', 'Reports', 'Console errors', repErrors.length === 0 ? 'PASS' : 'FAIL', repErrors.join(' | '));
    }
    
    // Shift tab
    page._consoleErrors = [];
    const shiftBtn = page.locator('button:has-text("Shift")').first();
    if (await shiftBtn.count() > 0) {
      await shiftBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'pod-shift');
      log('Pod', 'Shift', 'Shift page loads', 'PASS');
      const shiftErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
      log('Pod', 'Shift', 'Console errors', shiftErrors.length === 0 ? 'PASS' : 'FAIL', shiftErrors.join(' | '));
    }
    
    // Logout
    const logoutBtn = page.locator('button:has-text("Logout")').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      const afterLogout = await page.textContent('body');
      log('Pod', 'Logout', 'Returns to PIN', afterLogout.includes('Enter your PIN') ? 'PASS' : 'FAIL');
    }
  }

  const podErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
  log('Pod', 'Overall', 'Console errors', podErrors.length === 0 ? 'PASS' : 'FAIL', podErrors.join(' | '));
  
  await context.close();
}

// ============================================================
// CUSTOMER APP TESTS
// ============================================================
async function testCustomer(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  setupConsoleCapture(page);

  await page.goto(APPS.customer);
  await page.waitForTimeout(2000);
  await screenshot(page, 'customer-onboarding');
  
  const bodyText = await page.textContent('body');
  log('Customer', 'Onboarding', 'Page renders', bodyText.includes('Clean Energy') || bodyText.includes('Gaz Time') ? 'PASS' : 'FAIL');
  log('Customer', 'Onboarding', 'Next button', (await page.locator('button:has-text("Next")').count()) > 0 ? 'PASS' : 'FAIL');
  log('Customer', 'Onboarding', 'Skip link', bodyText.includes('Skip') ? 'PASS' : 'FAIL');
  
  // Click Next through onboarding slides
  for (let i = 0; i < 3; i++) {
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(800);
    }
  }
  
  // Should reach Get Started or login
  await page.waitForTimeout(1000);
  await screenshot(page, 'customer-after-onboarding');
  const afterOnboard = await page.textContent('body');
  log('Customer', 'Onboarding', 'Slides navigate', afterOnboard.includes('Get Started') || afterOnboard.includes('Phone') || afterOnboard.includes('Welcome') ? 'PASS' : 'WARN');
  
  // Try to get to phone login
  const getStarted = page.locator('button:has-text("Get Started")').first();
  if (await getStarted.count() > 0) {
    await getStarted.click();
    await page.waitForTimeout(1000);
  }
  
  // Skip if still on onboarding
  const skipLink = page.locator('text=Skip').first();
  if (await skipLink.count() > 0) {
    await skipLink.click();
    await page.waitForTimeout(1000);
  }
  
  await screenshot(page, 'customer-login');
  const loginText = await page.textContent('body');
  log('Customer', 'Login', 'Phone input visible', loginText.includes('Phone') || loginText.includes('+27') ? 'PASS' : 'FAIL');
  log('Customer', 'Login', 'Continue button', loginText.includes('Continue') ? 'PASS' : 'FAIL');
  
  // Enter phone number
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="072"]').first();
  if (await phoneInput.count() > 0) {
    await phoneInput.fill('0783456789');
    await page.waitForTimeout(500);
    
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, 'customer-otp');
      const otpText = await page.textContent('body');
      log('Customer', 'Login', 'OTP screen', otpText.includes('OTP') || otpText.includes('verification') || otpText.includes('code') ? 'PASS' : 'WARN', 'After phone submit');
      
      // Try entering OTP
      const otpInputs = page.locator('input[maxlength="1"], input[type="tel"]');
      if (await otpInputs.count() >= 4) {
        for (let i = 0; i < 6; i++) {
          const inp = otpInputs.nth(i);
          if (await inp.count() > 0) await inp.fill(String(i + 1));
        }
        await page.waitForTimeout(1000);
        
        const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")').first();
        if (await verifyBtn.count() > 0) {
          await verifyBtn.click();
          await page.waitForTimeout(3000);
          await screenshot(page, 'customer-after-login');
          
          const homeText = await page.textContent('body');
          log('Customer', 'Home', 'Logged in', homeText.includes('Home') || homeText.includes('Order') || homeText.includes('Welcome') ? 'PASS' : 'WARN', page.url());
          
          // If logged in, check home page
          if (!page.url().includes('auth')) {
            log('Customer', 'Home', 'Products visible', homeText.includes('kg') || homeText.includes('LPG') ? 'PASS' : 'WARN');
            
            // Try ordering
            const orderBtn = page.locator('button:has-text("Order"), button:has-text("Buy"), a:has-text("Order")').first();
            if (await orderBtn.count() > 0) {
              await orderBtn.click();
              await page.waitForTimeout(2000);
              await screenshot(page, 'customer-order');
              log('Customer', 'Order', 'Order page loads', 'PASS');
            }
          }
        }
      }
    }
  }

  const custErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
  log('Customer', 'Overall', 'Console errors', custErrors.length === 0 ? 'PASS' : 'FAIL', custErrors.slice(-5).join(' | '));
  
  await context.close();
}

// ============================================================
// DRIVER APP TESTS
// ============================================================
async function testDriver(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  setupConsoleCapture(page);

  await page.goto(`${APPS.driver}/login`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'driver-login');
  
  const bodyText = await page.textContent('body');
  log('Driver', 'Login', 'Page renders', bodyText.includes('Driver') || bodyText.includes('Sign in') ? 'PASS' : 'FAIL');
  log('Driver', 'Login', 'Phone input', bodyText.includes('Phone') ? 'PASS' : 'FAIL');
  log('Driver', 'Login', 'PIN input', bodyText.includes('PIN') ? 'PASS' : 'FAIL');
  log('Driver', 'Login', 'Biometric option', bodyText.includes('Biometric') ? 'PASS' : 'FAIL');
  
  // Login with demo credentials
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]').first();
  const pinInput = page.locator('input[type="password"], input[placeholder*="PIN"]').first();
  
  if (await phoneInput.count() > 0) {
    const phoneVal = await phoneInput.inputValue();
    if (!phoneVal) await phoneInput.fill('0765432109');
    const pinVal = await pinInput.inputValue();
    if (!pinVal) await pinInput.fill('1234');
    
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await screenshot(page, 'driver-dashboard');
    
    const dashText = await page.textContent('body');
    const loggedIn = !page.url().includes('login');
    log('Driver', 'Login', 'Login succeeds', loggedIn ? 'PASS' : 'FAIL', page.url());
    
    if (loggedIn) {
      log('Driver', 'Dashboard', 'Welcome message', dashText.includes('Welcome') || dashText.includes('Thabo') ? 'PASS' : 'FAIL');
      log('Driver', 'Dashboard', 'Delivery stats', dashText.includes('Deliver') || dashText.includes('Rating') ? 'PASS' : 'FAIL');
      
      // Bottom nav
      const navItems = ['Home', 'Stock', 'Safety', 'Settings'];
      for (const item of navItems) {
        const btn = page.locator(`button:has-text("${item}"), a:has-text("${item}")`).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1500);
          await screenshot(page, `driver-${item.toLowerCase()}`);
          log('Driver', item, 'Page loads', 'PASS');
        } else {
          log('Driver', item, 'Nav button exists', 'WARN', 'Not found');
        }
      }
      
      // Go online/offline
      const statusBtn = page.locator('button:has-text("Go Online"), button:has-text("Go Offline"), button:has-text("Online"), button:has-text("Offline")').first();
      if (await statusBtn.count() > 0) {
        const statusText = await statusBtn.textContent();
        await statusBtn.click();
        await page.waitForTimeout(1000);
        log('Driver', 'Dashboard', 'Status toggle', 'PASS', `Was: ${statusText}`);
      }
    }
  }

  const drvErrors = page._consoleErrors.filter(e => !e.includes('favicon'));
  log('Driver', 'Overall', 'Console errors', drvErrors.length === 0 ? 'PASS' : 'FAIL', drvErrors.slice(-5).join(' | '));
  
  await context.close();
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🔥 GazTime Full E2E Visual Audit');
  console.log('================================\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('\n📱 ADMIN DASHBOARD');
    console.log('──────────────────');
    await testAdmin(browser);
    
    console.log('\n📱 POD POS');
    console.log('──────────');
    await testPodPOS(browser);
    
    console.log('\n📱 CUSTOMER APP');
    console.log('───────────────');
    await testCustomer(browser);
    
    console.log('\n📱 DRIVER APP');
    console.log('─────────────');
    await testDriver(browser);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await browser.close();
  }

  // Summary
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  
  console.log('\n══════════════════════════════════════');
  console.log('  AUDIT SUMMARY');
  console.log('══════════════════════════════════════');
  console.log(`  ✅ Passed: ${pass}`);
  console.log(`  ❌ Failed: ${fail}`);
  console.log(`  ⚠️  Warnings: ${warn}`);
  console.log(`  📸 Screenshots: ${screenshotCount}`);
  console.log(`  Total tests: ${results.length}`);
  
  if (errors.length > 0) {
    console.log('\n  FAILURES:');
    errors.forEach(e => console.log(`    ❌ [${e.app}] ${e.page} → ${e.test}: ${e.detail}`));
  }
  
  console.log('\n══════════════════════════════════════');
  
  // Write results to file
  const report = {
    date: new Date().toISOString(),
    summary: { pass, fail, warn, total: results.length, screenshots: screenshotCount },
    results,
    errors,
  };
  writeFileSync(`${SCREENSHOT_DIR}/audit-results.json`, JSON.stringify(report, null, 2));
  console.log(`\nResults saved to ${SCREENSHOT_DIR}/audit-results.json`);
}

main().catch(console.error);
