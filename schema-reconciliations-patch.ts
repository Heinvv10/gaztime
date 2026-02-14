// ============================================================================
// RECONCILIATIONS TABLE - ADD TO packages/api/src/db/schema.ts
// ============================================================================
// Add this code after the subscriptionsRelations export (around line 314)

import { pgTable, text, real, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------------------------------
// Pod Reconciliations
// ----------------------------------------------------------------------------

export const reconciliations = pgTable('reconciliations', {
  id: text('id').primaryKey(),
  pod_id: text('pod_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  expected_cash: real('expected_cash').notNull(),
  actual_cash: real('actual_cash').notNull(),
  variance: real('variance').notNull(),
  operator_id: text('operator_id').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  podIdx: index('reconciliations_pod_idx').on(table.pod_id),
  dateIdx: index('reconciliations_date_idx').on(table.date),
}));

export const reconciliationsRelations = relations(reconciliations, ({ one }) => ({
  pod: one(pods, {
    fields: [reconciliations.pod_id],
    references: [pods.id],
  }),
}));
