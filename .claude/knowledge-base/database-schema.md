# GazTime Database Schema

## Tables

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| phone | text UNIQUE | |
| name | text | |
| addresses | jsonb | Array of address objects |
| wallet_balance | real | Default 0 |
| fibertime_account_id | text | Link to FibreTime |
| referral_code | text UNIQUE | |
| referred_by | text | FK to customers.id |
| segment | text | Default 'new' |
| language_preference | text | Default 'en' |
| status | text | Default 'active' |
| created_at | timestamp | |

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| reference | text UNIQUE | |
| customer_id | text FK | |
| channel | text | 'app', 'whatsapp', 'pod' |
| status | text | created/assigned/picked_up/delivered/cancelled |
| items | jsonb | Array of order items |
| delivery_address | jsonb | |
| delivery_fee | real | |
| total_amount | real | |
| payment_method | text | |
| payment_status | text | pending/paid/failed |
| driver_id | text FK | |
| pod_id | text FK | |
| assigned_at | timestamp | |
| picked_up_at | timestamp | |
| delivered_at | timestamp | |
| delivery_proof | jsonb | Photo, signature |
| rating | integer | 1-5 |
| notes | text | |
| created_at | timestamp | |
| cancelled_reason | text | |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| sku | text UNIQUE | |
| size_kg | real | Cylinder size |
| type | text | |
| prices | jsonb | Array of price tiers |
| active | boolean | |

### cylinders
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| serial_number | text UNIQUE | |
| size_kg | real | |
| status | text | new/filled/empty/condemned |
| location_type | text | depot/vehicle/pod/customer |
| location_id | text | |
| fill_count | integer | |
| last_filled_at | timestamp | |
| last_inspected_at | timestamp | |
| next_inspection_due | timestamp | |
| manufactured_at | timestamp | |
| condemned_at | timestamp | |
| movements | jsonb | Movement history array |

### drivers
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| user_id | text | |
| name | text | |
| phone | text | |
| license_number | text | |
| license_expiry | timestamp | |
| lpgsa_cert_number | text | LPGSA certification |
| cert_expiry | timestamp | |
| vehicle_id | text FK | |
| status | text | online/offline/delivering |
| current_location | jsonb | lat/lng |
| rating_avg | real | |
| total_deliveries | integer | |
| hired_at | timestamp | |
| active | boolean | |

### vehicles
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| registration | text UNIQUE | |
| make | text | |
| model | text | |
| capacity_cylinders | integer | |
| current_stock | jsonb | |
| insurance_expiry | timestamp | |
| service_due_date | timestamp | |
| gps_device_id | text | |
| active | boolean | |

### pods
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| location | jsonb | lat/lng/address |
| operator_id | text | |
| stock | jsonb | |
| operating_hours | jsonb | |
| fibertime_pop_id | text | Link to FibreTime POP |
| active | boolean | |

### depots
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| location | jsonb | |
| bulk_storage_capacity_tonnes | real | |
| current_stock_tonnes | real | |
| cylinder_stock | jsonb | |
| active | boolean | |

### wallets
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| customer_id | text UNIQUE FK | |
| balance | real | |
| created_at | timestamp | |

### wallet_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| wallet_id | text FK | |
| type | text | credit/debit |
| amount | real | |
| reference | text | |
| description | text | |
| created_at | timestamp | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| customer_id | text FK | |
| product_id | text FK | |
| frequency | text | weekly/biweekly/monthly |
| delivery_day | text | |
| delivery_window | text | |
| payment_method | text | |
| status | text | active/paused/cancelled |
| next_delivery_date | timestamp | |
| created_at | timestamp | |

## Relations
- Customer -> Orders (1:many)
- Customer -> Wallet (1:1)
- Customer -> Subscriptions (1:many)
- Order -> Driver (many:1)
- Order -> Pod (many:1)
- Driver -> Vehicle (many:1)
- Wallet -> Transactions (1:many)
- Subscription -> Product (many:1)
