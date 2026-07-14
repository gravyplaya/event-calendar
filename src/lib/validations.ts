import { z } from 'zod';
import { validateTimeOrder } from './date';
import { CalendarViewType } from '@/types/event';

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

// Define the location options as a const array for reuse
export const LOCATION_OPTIONS = [
  'Restaurant/Bar',
  'Basement Speakeasy',
  'Both',
] as const;

const baseEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(256),
  description: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  location: z.enum(LOCATION_OPTIONS),
  category: z.string().min(1).max(100),
  color: z.string().min(1).max(25),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  location: z.enum(LOCATION_OPTIONS),
  category: z.string().min(1).max(100),
  isRepeating: z.boolean().default(false).optional(),
  repeatingType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  color: z.string().min(1).max(25),
});

export const eventFormSchema = baseEventSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    isRepeating: z.boolean().default(false).optional(),
    repeatingType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  })
  .refine((data) => !data.isRepeating || data.repeatingType, {
    message: 'Repeating type is required for repeating events',
    path: ['repeatingType'],
  })
  .refine(
    (data) => {
      if (data.startDate.toDateString() !== data.endDate.toDateString()) {
        return data.endDate > data.startDate;
      }
      return validateTimeOrder(data.startTime, data.endTime);
    },
    {
      message: 'End time must be later than start time.',
      path: ['endTime'],
    },
  );

export const UpdateEventSchema = createEventSchema.partial();

export const eventFilterSchema = z.object({
  title: z.string().optional(),
  categories: z.array(z.string()).default([]),
  daysCount: z.number().optional(),
  view: z
    .enum([
      CalendarViewType.DAY,
      CalendarViewType.DAYS,
      CalendarViewType.WEEK,
      CalendarViewType.MONTH,
      CalendarViewType.YEAR,
    ])
    .optional(),
  date: z.date(),
  colors: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  repeatingTypes: z.array(z.string()).default([]),
  isRepeating: z.boolean().optional(),
});

export const searchEventFilterSchema = z.object({
  search: z.string().min(1, 'Search query is required'),
  categories: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  repeatingTypes: z.array(z.string()).default([]),
  isRepeating: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Conflict detection types
export interface EventConflict {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: EventConflict[];
  message?: string;
}

export type EventFilter = z.infer<typeof eventFilterSchema>;
export type SearchEventFilter = z.infer<typeof searchEventFilterSchema>;

export type CreateTaskSchema = z.infer<typeof createEventSchema>;
export type UpdateTaskSchema = z.infer<typeof UpdateEventSchema>;

// ── Loyalty Program Schemas ────────────────────────────────────────────

export const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional(),
  smsOptIn: z.boolean(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const checkInSchema = z
  .object({
    code: z.string().uuid('Invalid check-in code'),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    smsOptIn: z.boolean().default(false),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
    path: ['email'],
  });

export type CheckInInput = z.infer<typeof checkInSchema>;

export const adjustLoyaltyPointsSchema = z.object({
  subscriberId: z.string().uuid(),
  points: z.number().int(),
  reason: z.string().min(1).max(256),
});

export type AdjustLoyaltyPointsInput = z.infer<
  typeof adjustLoyaltyPointsSchema
>;
