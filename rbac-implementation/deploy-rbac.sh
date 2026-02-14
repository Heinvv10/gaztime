#!/bin/bash
# ============================================================================
# RBAC Deployment Script for Gaztime API
# Task #232: Implement Role-Based Access Control
# ============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="/workspace/extra/gaztime/packages/api/src"

echo "============================================================================"
echo "Gaztime RBAC Deployment"
echo "Task #232: Implementing Role-Based Access Control"
echo "============================================================================"
echo ""

# Check if we're running with appropriate permissions
if [ ! -w "$API_DIR" ]; then
    echo "❌ ERROR: Cannot write to $API_DIR"
    echo "Current user: $(whoami) (UID: $(id -u))"
    echo "Directory owner: $(stat -c '%U (UID: %u)' "$API_DIR")"
    echo ""
    echo "Solutions:"
    echo "1. Run this script as the file owner (UID 1003)"
    echo "2. Change directory ownership: chown -R \$(whoami):\$(whoami) /workspace/extra/gaztime"
    echo "3. Apply patches manually as the file owner"
    echo ""
    exit 1
fi

echo "✅ Permission check passed"
echo ""

# Backup existing files
echo "📦 Creating backups..."
BACKUP_DIR="/workspace/extra/gaztime/rbac-implementation/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp "$API_DIR/middleware/auth.ts" "$BACKUP_DIR/auth.ts.bak"
cp "$API_DIR/routes/drivers.ts" "$BACKUP_DIR/drivers.ts.bak"
cp "$API_DIR/routes/orders.ts" "$BACKUP_DIR/orders.ts.bak"
cp "$API_DIR/routes/customers.ts" "$BACKUP_DIR/customers.ts.bak"

echo "✅ Backups created in: $BACKUP_DIR"
echo ""

# Deploy updated files
echo "🚀 Deploying RBAC implementation..."

echo "  → Updating auth middleware..."
cp "$SCRIPT_DIR/enhanced-auth-middleware.ts" "$API_DIR/middleware/auth.ts"

echo "  → Updating driver routes..."
cp "$SCRIPT_DIR/drivers-routes-rbac.ts" "$API_DIR/routes/drivers.ts"

echo "  → Updating order routes..."
cp "$SCRIPT_DIR/orders-routes-rbac.ts" "$API_DIR/routes/orders.ts"

echo "  → Updating customer routes..."
cp "$SCRIPT_DIR/customers-routes-rbac.ts" "$API_DIR/routes/customers.ts"

echo "✅ Files deployed successfully"
echo ""

# Verify TypeScript compilation
echo "🔍 Verifying TypeScript compilation..."
cd /workspace/extra/gaztime/packages/api

if pnpm run build 2>&1 | tee /tmp/rbac-build.log; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "Check logs: /tmp/rbac-build.log"
    echo ""
    echo "Restoring backups..."
    cp "$BACKUP_DIR/auth.ts.bak" "$API_DIR/middleware/auth.ts"
    cp "$BACKUP_DIR/drivers.ts.bak" "$API_DIR/routes/drivers.ts"
    cp "$BACKUP_DIR/orders.ts.bak" "$API_DIR/routes/orders.ts"
    cp "$BACKUP_DIR/customers.ts.bak" "$API_DIR/routes/customers.ts"
    echo "✅ Backups restored"
    exit 1
fi

echo ""
echo "============================================================================"
echo "✅ RBAC Implementation Deployed Successfully!"
echo "============================================================================"
echo ""
echo "Next Steps:"
echo "1. Restart the API server: cd /workspace/extra/gaztime/packages/api && pnpm dev"
echo "2. Run RBAC tests: bash $SCRIPT_DIR/test-rbac.sh"
echo "3. Review the RBAC matrix in: $SCRIPT_DIR/RBAC_COMPLETE.md"
echo ""
echo "Backups location: $BACKUP_DIR"
echo ""
