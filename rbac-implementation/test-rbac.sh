#!/bin/bash
# ============================================================================
# RBAC Testing Script for Gaztime API
# Task #232: Role-Based Access Control Testing
# ============================================================================

set -e

API_URL="${API_URL:-http://172.17.0.1:3333}"
TEST_RESULTS="/tmp/rbac-test-results.json"

echo "============================================================================"
echo "Gaztime RBAC Test Suite"
echo "Testing Role-Based Access Control Implementation"
echo "============================================================================"
echo ""
echo "API URL: $API_URL"
echo ""

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result helper
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local token="$4"
    local expected_status="$5"
    local body="$6"

    TESTS_RUN=$((TESTS_RUN + 1))

    echo -n "TEST $TESTS_RUN: $test_name ... "

    if [ -z "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$API_URL$endpoint")
    fi

    status=$(echo "$response" | tail -n1)

    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ============================================================================
# Step 1: Create test users (run this manually first or via admin)
# ============================================================================
echo "ℹ️  Note: This script assumes test users already exist in the database"
echo "   Required test users: admin@gaztime.app, driver@gaztime.app, customer@gaztime.app"
echo ""

# Get tokens for different roles
echo "Step 1: Authenticating test users..."
echo ""

# Admin login
echo -n "  → Logging in as admin... "
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gaztime.app","password":"Admin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ FAILED"
    echo "Error: Could not authenticate admin user"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi
echo "✅ SUCCESS"

# Driver login
echo -n "  → Logging in as driver... "
DRIVER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"driver@gaztime.app","password":"Driver123!"}')
DRIVER_TOKEN=$(echo "$DRIVER_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$DRIVER_TOKEN" ]; then
    echo "❌ FAILED (user may not exist)"
    DRIVER_TOKEN="invalid-token"
else
    echo "✅ SUCCESS"
fi

# Customer login
echo -n "  → Logging in as customer... "
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"customer@gaztime.app","password":"Customer123!"}')
CUSTOMER_TOKEN=$(echo "$CUSTOMER_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$CUSTOMER_TOKEN" ]; then
    echo "❌ FAILED (user may not exist)"
    CUSTOMER_TOKEN="invalid-token"
else
    echo "✅ SUCCESS"
fi

echo ""
echo "============================================================================"
echo "Step 2: Testing RBAC Rules"
echo "============================================================================"
echo ""

# ============================================================================
# Test: Driver Routes
# ============================================================================
echo "--- Driver Routes ---"
echo ""

test_endpoint \
    "Admin can list all drivers" \
    "GET" "/api/drivers" "$ADMIN_TOKEN" "200"

test_endpoint \
    "Driver cannot list all drivers" \
    "GET" "/api/drivers" "$DRIVER_TOKEN" "403"

test_endpoint \
    "Customer cannot list all drivers" \
    "GET" "/api/drivers" "$CUSTOMER_TOKEN" "403"

echo ""

# ============================================================================
# Test: Order Routes
# ============================================================================
echo "--- Order Routes ---"
echo ""

test_endpoint \
    "Admin can list all orders" \
    "GET" "/api/orders" "$ADMIN_TOKEN" "200"

test_endpoint \
    "Driver can list their orders (filtered automatically)" \
    "GET" "/api/orders" "$DRIVER_TOKEN" "200"

test_endpoint \
    "Customer can list their orders (filtered automatically)" \
    "GET" "/api/orders" "$CUSTOMER_TOKEN" "200"

test_endpoint \
    "Customer can create order" \
    "POST" "/api/orders" "$CUSTOMER_TOKEN" "201" \
    '{"customerId":"cust_123","items":[{"productId":"prod_r35","quantity":1}],"deliveryAddress":{"street":"123 Test St","city":"Stellenbosch"}}'

test_endpoint \
    "Driver cannot create order" \
    "POST" "/api/orders" "$DRIVER_TOKEN" "403" \
    '{"customerId":"cust_123","items":[{"productId":"prod_r35","quantity":1}],"deliveryAddress":{"street":"123 Test St","city":"Stellenbosch"}}'

echo ""

# ============================================================================
# Test: Customer Routes
# ============================================================================
echo "--- Customer Routes ---"
echo ""

test_endpoint \
    "Admin can list all customers" \
    "GET" "/api/customers" "$ADMIN_TOKEN" "200"

test_endpoint \
    "Driver cannot list customers" \
    "GET" "/api/customers" "$DRIVER_TOKEN" "403"

test_endpoint \
    "Customer cannot list all customers" \
    "GET" "/api/customers" "$CUSTOMER_TOKEN" "403"

echo ""

# ============================================================================
# Test Summary
# ============================================================================
echo "============================================================================"
echo "Test Results Summary"
echo "============================================================================"
echo ""
echo "Total Tests:  $TESTS_RUN"
echo "Passed:       $TESTS_PASSED ($(( TESTS_PASSED * 100 / TESTS_RUN ))%)"
echo "Failed:       $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
