// ============================================================================
// Create Users Table - One-time Migration Script
// ============================================================================

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

config();

const sql = neon(process.env.DATABASE_URL!);

async function createUsersTable() {
  console.log('📋 Creating users table...');

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'operator', 'customer')),
        name TEXT NOT NULL,
        phone TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `;

    console.log('✅ Users table created');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role)`;

    console.log('✅ Indexes created');

    // Create default admin user
    const adminPassword = 'Admin123!'; // Change this immediately after first login
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await sql`
      INSERT INTO users (id, email, password_hash, role, name, active, created_at)
      VALUES (
        'usr_admin_1',
        'admin@gaztime.app',
        ${passwordHash},
        'admin',
        'System Administrator',
        true,
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `;

    console.log('✅ Default admin user created (email: admin@gaztime.app, password: Admin123!)');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('');
    console.log('✅ Users table setup complete!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    process.exit(1);
  }
}

createUsersTable();
