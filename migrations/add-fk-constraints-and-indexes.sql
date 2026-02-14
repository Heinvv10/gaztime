-- ============================================================================
-- Gaztime Database: Add Foreign Key Constraints & Indexes
-- Task #235 - February 14, 2026
-- Migration: add-fk-constraints-and-indexes
-- ============================================================================
--
-- IMPORTANT: Before running this migration:
-- 1. Backup your database
-- 2. Run data integrity checks (see DATABASE_FK_CONSTRAINTS_AUDIT.md)
-- 3. Clean up any orphaned records
-- 4. Test in staging environment first
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DATA INTEGRITY CHECKS (run these first, then clean up if needed)
-- ============================================================================

-- Uncomment to check for orphaned records before adding constraints:

-- -- Check for orphaned orders
-- SELECT 'Orphaned orders (customer_id):', COUNT(*) FROM orders WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM customers);
-- SELECT 'Orphaned orders (driver_id):', COUNT(*) FROM orders WHERE driver_id IS NOT NULL AND driver_id NOT IN (SELECT id FROM drivers);
-- SELECT 'Orphaned orders (pod_id):', COUNT(*) FROM orders WHERE pod_id IS NOT NULL AND pod_id NOT IN (SELECT id FROM pods);

-- -- Check for orphaned drivers
-- SELECT 'Orphaned drivers (user_id):', COUNT(*) FROM drivers WHERE user_id NOT IN (SELECT id FROM users);
-- SELECT 'Orphaned drivers (vehicle_id):', COUNT(*) FROM drivers WHERE vehicle_id IS NOT NULL AND vehicle_id NOT IN (SELECT id FROM vehicles);

-- -- Check for orphaned customers
-- SELECT 'Orphaned customers (referred_by):', COUNT(*) FROM customers WHERE referred_by IS NOT NULL AND referred_by NOT IN (SELECT id FROM customers);

-- -- Check for orphaned wallets
-- SELECT 'Orphaned wallets:', COUNT(*) FROM wallets WHERE customer_id NOT IN (SELECT id FROM customers);

-- -- Check for orphaned wallet transactions
-- SELECT 'Orphaned wallet_transactions:', COUNT(*) FROM wallet_transactions WHERE wallet_id NOT IN (SELECT id FROM wallets);

-- -- Check for orphaned subscriptions
-- SELECT 'Orphaned subscriptions (customer_id):', COUNT(*) FROM subscriptions WHERE customer_id NOT IN (SELECT id FROM customers);
-- SELECT 'Orphaned subscriptions (product_id):', COUNT(*) FROM subscriptions WHERE product_id NOT IN (SELECT id FROM products);

-- -- Check for orphaned pods
-- SELECT 'Orphaned pods:', COUNT(*) FROM pods WHERE operator_id IS NOT NULL AND operator_id NOT IN (SELECT id FROM users);

-- ============================================================================
-- STEP 2: ADD MISSING INDEXES
-- ============================================================================
-- Adding indexes BEFORE foreign keys improves constraint creation performance

DO $$
BEGIN
    -- Create index for drivers.user_id (FK to users)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'drivers_user_idx') THEN
        CREATE INDEX drivers_user_idx ON drivers(user_id);
        RAISE NOTICE 'Created index: drivers_user_idx';
    END IF;

    -- Create index for customers.referred_by (self-referencing FK)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'customers_referred_by_idx') THEN
        CREATE INDEX customers_referred_by_idx ON customers(referred_by);
        RAISE NOTICE 'Created index: customers_referred_by_idx';
    END IF;

    -- Create index for pods.operator_id (FK to users)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'pods_operator_idx') THEN
        CREATE INDEX pods_operator_idx ON pods(operator_id);
        RAISE NOTICE 'Created index: pods_operator_idx';
    END IF;

    -- Create index for subscriptions.product_id (FK to products)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'subscriptions_product_idx') THEN
        CREATE INDEX subscriptions_product_idx ON subscriptions(product_id);
        RAISE NOTICE 'Created index: subscriptions_product_idx';
    END IF;

    -- Create index for subscriptions.next_delivery_date (query performance)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'subscriptions_next_delivery_idx') THEN
        CREATE INDEX subscriptions_next_delivery_idx ON subscriptions(next_delivery_date);
        RAISE NOTICE 'Created index: subscriptions_next_delivery_idx';
    END IF;

    -- Create index for wallet_transactions.type (query performance)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'wallet_transactions_type_idx') THEN
        CREATE INDEX wallet_transactions_type_idx ON wallet_transactions(type);
        RAISE NOTICE 'Created index: wallet_transactions_type_idx';
    END IF;

    -- Create index for orders.pod_id (FK to pods - was missing)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_pod_idx') THEN
        CREATE INDEX orders_pod_idx ON orders(pod_id);
        RAISE NOTICE 'Created index: orders_pod_idx';
    END IF;

END $$;

-- ============================================================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
    -- Orders -> Customers (SET NULL: preserve historical orders)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_orders_customer'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT fk_orders_customer
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: orders.customer_id -> customers.id';
    END IF;

    -- Orders -> Drivers (SET NULL: preserve order history)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_orders_driver'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT fk_orders_driver
            FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: orders.driver_id -> drivers.id';
    END IF;

    -- Orders -> Pods (SET NULL: preserve order data when pod closed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_orders_pod'
    ) THEN
        ALTER TABLE orders
            ADD CONSTRAINT fk_orders_pod
            FOREIGN KEY (pod_id) REFERENCES pods(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: orders.pod_id -> pods.id';
    END IF;

    -- Customers -> Customers (SET NULL: self-referencing for referrals)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_customers_referrer'
    ) THEN
        ALTER TABLE customers
            ADD CONSTRAINT fk_customers_referrer
            FOREIGN KEY (referred_by) REFERENCES customers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: customers.referred_by -> customers.id';
    END IF;

    -- Drivers -> Users (CASCADE: driver account tied to user)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_drivers_user'
    ) THEN
        ALTER TABLE drivers
            ADD CONSTRAINT fk_drivers_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: drivers.user_id -> users.id (CASCADE)';
    END IF;

    -- Drivers -> Vehicles (SET NULL: driver can exist without vehicle)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_drivers_vehicle'
    ) THEN
        ALTER TABLE drivers
            ADD CONSTRAINT fk_drivers_vehicle
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: drivers.vehicle_id -> vehicles.id';
    END IF;

    -- Wallets -> Customers (CASCADE: wallet belongs to customer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_wallets_customer'
    ) THEN
        ALTER TABLE wallets
            ADD CONSTRAINT fk_wallets_customer
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: wallets.customer_id -> customers.id (CASCADE)';
    END IF;

    -- Wallet Transactions -> Wallets (CASCADE: transactions belong to wallet)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_wallet_transactions_wallet'
    ) THEN
        ALTER TABLE wallet_transactions
            ADD CONSTRAINT fk_wallet_transactions_wallet
            FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: wallet_transactions.wallet_id -> wallets.id (CASCADE)';
    END IF;

    -- Subscriptions -> Customers (CASCADE: subscription belongs to customer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_subscriptions_customer'
    ) THEN
        ALTER TABLE subscriptions
            ADD CONSTRAINT fk_subscriptions_customer
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: subscriptions.customer_id -> customers.id (CASCADE)';
    END IF;

    -- Subscriptions -> Products (RESTRICT: prevent deletion of products with active subscriptions)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_subscriptions_product'
    ) THEN
        ALTER TABLE subscriptions
            ADD CONSTRAINT fk_subscriptions_product
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
        RAISE NOTICE 'Added FK: subscriptions.product_id -> products.id (RESTRICT)';
    END IF;

    -- Pods -> Users (SET NULL: pod can operate with reassigned operator)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_pods_operator'
    ) THEN
        ALTER TABLE pods
            ADD CONSTRAINT fk_pods_operator
            FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: pods.operator_id -> users.id';
    END IF;

END $$;

-- ============================================================================
-- STEP 4: VERIFY CONSTRAINTS
-- ============================================================================

-- Display all foreign key constraints created
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name LIKE 'fk_%'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- STEP 5: VERIFY INDEXES
-- ============================================================================

-- Display all indexes created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexname LIKE '%_user_idx'
        OR indexname LIKE '%_referred_by_idx'
        OR indexname LIKE '%_operator_idx'
        OR indexname LIKE '%_product_idx'
        OR indexname LIKE '%_delivery_idx'
        OR indexname LIKE '%_type_idx'
        OR indexname LIKE '%_pod_idx'
    )
ORDER BY tablename, indexname;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- Uncomment and run if you need to rollback this migration:

-- BEGIN;
--
-- -- Drop foreign key constraints
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_customer;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_driver;
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_pod;
-- ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_referrer;
-- ALTER TABLE drivers DROP CONSTRAINT IF EXISTS fk_drivers_user;
-- ALTER TABLE drivers DROP CONSTRAINT IF EXISTS fk_drivers_vehicle;
-- ALTER TABLE wallets DROP CONSTRAINT IF EXISTS fk_wallets_customer;
-- ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS fk_wallet_transactions_wallet;
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_customer;
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_product;
-- ALTER TABLE pods DROP CONSTRAINT IF EXISTS fk_pods_operator;
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS drivers_user_idx;
-- DROP INDEX IF EXISTS customers_referred_by_idx;
-- DROP INDEX IF EXISTS pods_operator_idx;
-- DROP INDEX IF EXISTS subscriptions_product_idx;
-- DROP INDEX IF EXISTS subscriptions_next_delivery_idx;
-- DROP INDEX IF EXISTS wallet_transactions_type_idx;
-- DROP INDEX IF EXISTS orders_pod_idx;
--
-- COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
