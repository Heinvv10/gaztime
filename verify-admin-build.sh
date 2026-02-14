#!/bin/bash
# Verify Admin Dashboard mobile responsiveness changes build successfully

set -e

echo "================================================"
echo "Admin Dashboard Build Verification"
echo "================================================"
echo ""

cd /workspace/extra/gaztime/apps/admin

echo "✓ Checking for new files..."
if [ -f "src/components/layout/MobileMenu.tsx" ]; then
  echo "  ✅ MobileMenu.tsx found"
else
  echo "  ❌ MobileMenu.tsx missing"
  exit 1
fi

if [ -f "src/components/ui/responsive-table.tsx" ]; then
  echo "  ✅ responsive-table.tsx found"
else
  echo "  ❌ responsive-table.tsx missing"
  exit 1
fi

echo ""
echo "✓ Checking modified files..."
for file in "src/components/layout/DashboardLayout.tsx" \
            "src/components/layout/Sidebar.tsx" \
            "src/components/layout/Header.tsx" \
            "src/pages/HomePage.tsx"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file missing"
    exit 1
  fi
done

echo ""
echo "✓ Running TypeScript check..."
npx tsc --noEmit --skipLibCheck || {
  echo "  ❌ TypeScript errors found"
  exit 1
}
echo "  ✅ No TypeScript errors"

echo ""
echo "✓ Installing dependencies (if needed)..."
npm install --silent 2>/dev/null || true

echo ""
echo "✓ Building Admin Dashboard..."
npm run build || {
  echo "  ❌ Build failed"
  exit 1
}
echo "  ✅ Build successful"

echo ""
echo "================================================"
echo "✅ ALL CHECKS PASSED"
echo "================================================"
echo ""
echo "Admin Dashboard mobile responsiveness changes verified!"
echo "Files ready for deployment."
echo ""
