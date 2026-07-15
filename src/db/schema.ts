import {
  pgTable,
  timestamp,
  varchar,
  uuid,
  boolean,
  text,
  integer,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  isRepeating: boolean('is_repeating').notNull(),
  repeatingType: varchar('repeating_type', {
    length: 10,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
  }).$type<'daily' | 'weekly' | 'biweekly' | 'monthly'>(),
  location: varchar('location', {
    length: 256,
    enum: ['Restaurant/Bar', 'Basement Speakeasy', 'Both'],
  }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  color: varchar('color', { length: 15 }).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  submitterEmail: varchar('submitter_email', { length: 256 }),
  submitterPhone: varchar('submitter_phone', { length: 20 }),
  flyerUrl: varchar('flyer_url', { length: 512 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type EventTypes = typeof events.$inferSelect;
export type newEvent = typeof events.$inferInsert;

// ── Loyalty Program Schema ─────────────────────────────────────────────

export const subscriberStatusEnum = pgEnum('subscriber_status', [
  'active',
  'unsubscribed',
  'bounced',
]);

export const subscribers = pgTable(
  'subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 256 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    smsOptIn: boolean('sms_opt_in').default(false).notNull(),
    loyaltyPoints: integer('loyalty_points').default(0).notNull(),
    status: subscriberStatusEnum('status').default('active').notNull(),
    unsubscribeToken: uuid('unsubscribe_token').defaultRandom().notNull(),
    source: varchar('source', { length: 50 }).default('landing_page').notNull(),
    signupDate: timestamp('signup_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('subscribers_email_idx').on(table.email),
    tokenIdx: uniqueIndex('subscribers_unsubscribe_token_idx').on(
      table.unsubscribeToken,
    ),
  }),
);

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriberId: uuid('subscriber_id')
    .notNull()
    .references(() => subscribers.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: varchar('reason', { length: 256 }).notNull(),
  eventId: uuid('event_id').references(() => events.id, {
    onDelete: 'set null',
  }),
  adminId: varchar('admin_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type NewLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

export const eventCheckInCodes = pgTable(
  'event_check_in_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    code: uuid('code').defaultRandom().notNull(),
    pointsAwarded: integer('points_awarded').default(50).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('event_check_in_codes_code_idx').on(table.code),
  }),
);

export type EventCheckInCode = typeof eventCheckInCodes.$inferSelect;
export type NewEventCheckInCode = typeof eventCheckInCodes.$inferInsert;

// ── Relations ──────────────────────────────────────────────────────────

export const subscribersRelations = relations(subscribers, ({ many }) => ({
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const loyaltyTransactionsRelations = relations(
  loyaltyTransactions,
  ({ one }) => ({
    subscriber: one(subscribers, {
      fields: [loyaltyTransactions.subscriberId],
      references: [subscribers.id],
    }),
    event: one(events, {
      fields: [loyaltyTransactions.eventId],
      references: [events.id],
    }),
  }),
);

export const eventCheckInCodesRelations = relations(
  eventCheckInCodes,
  ({ one }) => ({
    event: one(events, {
      fields: [eventCheckInCodes.eventId],
      references: [events.id],
    }),
  }),
);
