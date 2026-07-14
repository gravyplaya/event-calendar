'use server';

import { db } from '@/db';
import {
  subscribers,
  loyaltyTransactions,
  eventCheckInCodes,
  events,
} from '@/db/schema';
import { eq, ilike, and, desc, sql, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/admin-auth';
import {
  subscribeSchema,
  checkInSchema,
  adjustLoyaltyPointsSchema,
  type SubscribeInput,
  type CheckInInput,
} from '@/lib/validations';
import { sendWelcomeEmail } from '@/lib/email';

const SIGNUP_BONUS = parseInt(process.env.LOYALTY_SIGNUP_BONUS || '100', 10);
const EVENT_ATTENDANCE_POINTS = parseInt(
  process.env.LOYALTY_EVENT_ATTENDANCE_POINTS || '50',
  10,
);

// ── Public: Subscribe (landing page) ───────────────────────────────────

export async function subscribe(input: SubscribeInput) {
  try {
    const validated = subscribeSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid fields',
        details: validated.error.flatten().fieldErrors,
      };
    }

    const { email, firstName, lastName, phone, smsOptIn } = validated.data;

    // Check if subscriber already exists
    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      const sub = existing[0];
      if (sub.status === 'unsubscribed') {
        // Resubscribe them
        await db
          .update(subscribers)
          .set({
            status: 'active',
            firstName,
            lastName,
            phone: phone || sub.phone,
            smsOptIn,
            updatedAt: new Date(),
          })
          .where(eq(subscribers.id, sub.id));

        revalidatePath('/');
        return {
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          points: sub.loyaltyPoints,
        };
      }
      return {
        success: false,
        error: 'already_subscribed',
        message: 'You are already subscribed to The Nest loyalty program.',
        points: sub.loyaltyPoints,
      };
    }

    // Create new subscriber
    const [newSub] = await db
      .insert(subscribers)
      .values({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        smsOptIn,
        loyaltyPoints: SIGNUP_BONUS,
        source: 'landing_page',
      })
      .returning();

    // Record signup bonus transaction
    await db.insert(loyaltyTransactions).values({
      subscriberId: newSub.id,
      points: SIGNUP_BONUS,
      reason: 'signup_bonus',
    });

    // Send welcome email (non-blocking — don't fail the signup if email fails)
    sendWelcomeEmail(
      newSub.email,
      newSub.firstName,
      SIGNUP_BONUS,
      newSub.unsubscribeToken,
    ).catch((err) => {
      console.error('[subscribe] Welcome email failed:', err);
    });

    revalidatePath('/');
    return {
      success: true,
      message: `Welcome to The Nest Loyalty Program! You've earned ${SIGNUP_BONUS} points.`,
      points: SIGNUP_BONUS,
    };
  } catch (error) {
    console.error('[subscribe] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe',
    };
  }
}

// ── Public: Unsubscribe (token-based) ──────────────────────────────────

export async function unsubscribeByToken(token: string) {
  try {
    const result = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.unsubscribeToken, token))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }

    const sub = result[0];

    if (sub.status === 'unsubscribed') {
      return {
        success: true,
        message: 'You are already unsubscribed.',
        alreadyUnsubscribed: true,
      };
    }

    await db
      .update(subscribers)
      .set({ status: 'unsubscribed', updatedAt: new Date() })
      .where(eq(subscribers.id, sub.id));

    return {
      success: true,
      message: 'You have been successfully unsubscribed.',
    };
  } catch (error) {
    console.error('[unsubscribeByToken] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsubscribe',
    };
  }
}

// ── Public: Event Check-in (QR code flow) ──────────────────────────────

export async function checkIn(input: CheckInInput) {
  try {
    const validated = checkInSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: 'Invalid fields',
        details: validated.error.flatten().fieldErrors,
      };
    }

    const { code, email, phone, firstName, lastName, smsOptIn } =
      validated.data;

    // Validate the check-in code
    const checkInCode = await db
      .select()
      .from(eventCheckInCodes)
      .where(
        and(
          eq(eventCheckInCodes.code, code),
          eq(eventCheckInCodes.isActive, true),
        ),
      )
      .limit(1);

    if (checkInCode.length === 0) {
      return {
        success: false,
        error: 'invalid_code',
        message:
          'This check-in code is invalid or no longer active. Please ask staff for assistance.',
      };
    }

    const checkInRecord = checkInCode[0];

    // Check if code has expired
    if (checkInRecord.expiresAt && new Date() > checkInRecord.expiresAt) {
      return {
        success: false,
        error: 'expired_code',
        message: 'This check-in code has expired.',
      };
    }

    const pointsToAward = checkInRecord.pointsAwarded;

    // Try to find existing subscriber by email or phone
    let existingSub: typeof subscribers.$inferSelect | null = null;

    if (email) {
      const byEmail = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.email, email.toLowerCase()))
        .limit(1);
      if (byEmail.length > 0) existingSub = byEmail[0];
    }

    if (!existingSub && phone) {
      const byPhone = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.phone, phone))
        .limit(1);
      if (byPhone.length > 0) existingSub = byPhone[0];
    }

    if (existingSub) {
      // Existing member — award attendance points
      // Check if they've already checked in for this event
      const alreadyCheckedIn = await db
        .select()
        .from(loyaltyTransactions)
        .where(
          and(
            eq(loyaltyTransactions.subscriberId, existingSub.id),
            eq(loyaltyTransactions.eventId, checkInRecord.eventId),
            eq(loyaltyTransactions.reason, 'event_attendance'),
          ),
        )
        .limit(1);

      if (alreadyCheckedIn.length > 0) {
        return {
          success: false,
          error: 'already_checked_in',
          message: `You've already checked in for this event. See you next time!`,
          points: existingSub.loyaltyPoints,
        };
      }

      // Award points
      await db
        .update(subscribers)
        .set({
          loyaltyPoints: existingSub.loyaltyPoints + pointsToAward,
          updatedAt: new Date(),
        })
        .where(eq(subscribers.id, existingSub.id));

      await db.insert(loyaltyTransactions).values({
        subscriberId: existingSub.id,
        points: pointsToAward,
        reason: 'event_attendance',
        eventId: checkInRecord.eventId,
      });

      return {
        success: true,
        message: `Checked in! You earned ${pointsToAward} points. Your balance: ${existingSub.loyaltyPoints + pointsToAward} points.`,
        points: existingSub.loyaltyPoints + pointsToAward,
        isNew: false,
      };
    }

    // New member — need first/last name for a new signup
    if (!firstName || !lastName || !email) {
      return {
        success: false,
        error: 'new_member_needs_info',
        message:
          'Welcome! It looks like you are not yet a member. Please provide your first name, last name, and email to sign up and earn points.',
        needsSignup: true,
      };
    }

    // Create new subscriber with signup + attendance bonus
    const totalPoints = SIGNUP_BONUS + pointsToAward;

    const [newSub] = await db
      .insert(subscribers)
      .values({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        smsOptIn,
        loyaltyPoints: totalPoints,
        source: 'event_checkin',
      })
      .returning();

    // Record signup bonus
    await db.insert(loyaltyTransactions).values({
      subscriberId: newSub.id,
      points: SIGNUP_BONUS,
      reason: 'signup_bonus',
    });

    // Record event attendance bonus
    await db.insert(loyaltyTransactions).values({
      subscriberId: newSub.id,
      points: pointsToAward,
      reason: 'event_attendance',
      eventId: checkInRecord.eventId,
    });

    // Send welcome email
    sendWelcomeEmail(
      newSub.email,
      newSub.firstName,
      totalPoints,
      newSub.unsubscribeToken,
    ).catch((err) => {
      console.error('[checkIn] Welcome email failed:', err);
    });

    return {
      success: true,
      message: `Welcome to The Nest! You've earned ${totalPoints} points (${SIGNUP_BONUS} signup bonus + ${pointsToAward} event attendance).`,
      points: totalPoints,
      isNew: true,
    };
  } catch (error) {
    console.error('[checkIn] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check in',
    };
  }
}

// ── Admin: Get subscribers (paginated, filtered) ──────────────────────

export async function getSubscribers(
  options: {
    search?: string;
    status?: 'active' | 'unsubscribed' | 'bounced';
    limit?: number;
    offset?: number;
  } = {},
) {
  await requireAdminAuth();

  try {
    const { search, status, limit = 50, offset = 0 } = options;

    const conditions = [];
    if (status) {
      conditions.push(eq(subscribers.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(subscribers.email, `%${search}%`),
          ilike(subscribers.firstName, `%${search}%`),
          ilike(subscribers.lastName, `%${search}%`),
          ilike(subscribers.phone, `%${search}%`),
        )!,
      );
    }

    const query = db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.signupDate))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const result = await query.execute();

    return { subscribers: result, success: true };
  } catch (error) {
    console.error('[getSubscribers] Error:', error);
    return {
      subscribers: [],
      success: false,
      error: 'Failed to fetch subscribers',
    };
  }
}

// ── Admin: Get loyalty transactions for a subscriber ──────────────────

export async function getLoyaltyTransactions(subscriberId: string) {
  await requireAdminAuth();

  try {
    const result = await db
      .select({
        id: loyaltyTransactions.id,
        points: loyaltyTransactions.points,
        reason: loyaltyTransactions.reason,
        eventId: loyaltyTransactions.eventId,
        adminId: loyaltyTransactions.adminId,
        createdAt: loyaltyTransactions.createdAt,
        eventTitle: events.title,
      })
      .from(loyaltyTransactions)
      .leftJoin(events, eq(loyaltyTransactions.eventId, events.id))
      .where(eq(loyaltyTransactions.subscriberId, subscriberId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .execute();

    return { transactions: result, success: true };
  } catch (error) {
    console.error('[getLoyaltyTransactions] Error:', error);
    return { transactions: [], success: false };
  }
}

// ── Admin: Adjust loyalty points ──────────────────────────────────────

export async function adjustLoyaltyPoints(
  subscriberId: string,
  points: number,
  reason: string,
) {
  await requireAdminAuth();

  try {
    const sub = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, subscriberId))
      .limit(1);

    if (sub.length === 0) {
      return { success: false, error: 'Subscriber not found' };
    }

    await db
      .update(subscribers)
      .set({
        loyaltyPoints: sub[0].loyaltyPoints + points,
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, subscriberId));

    await db.insert(loyaltyTransactions).values({
      subscriberId,
      points,
      reason,
      adminId: 'admin',
    });

    revalidatePath('/admin/subscribers');
    return { success: true };
  } catch (error) {
    console.error('[adjustLoyaltyPoints] Error:', error);
    return { success: false, error: 'Failed to adjust points' };
  }
}

// ── Admin: Generate check-in QR code for an event ─────────────────────

export async function generateEventCheckInCode(
  eventId: string,
  pointsAwarded?: number,
) {
  await requireAdminAuth();

  try {
    // Deactivate any existing active codes for this event
    await db
      .update(eventCheckInCodes)
      .set({ isActive: false })
      .where(
        and(
          eq(eventCheckInCodes.eventId, eventId),
          eq(eventCheckInCodes.isActive, true),
        ),
      );

    const [newCode] = await db
      .insert(eventCheckInCodes)
      .values({
        eventId,
        pointsAwarded: pointsAwarded ?? EVENT_ATTENDANCE_POINTS,
        isActive: true,
      })
      .returning();

    revalidatePath('/admin');
    return { code: newCode, success: true };
  } catch (error) {
    console.error('[generateEventCheckInCode] Error:', error);
    return { success: false, error: 'Failed to generate check-in code' };
  }
}

// ── Admin: Get active check-in codes ──────────────────────────────────

export async function getActiveCheckInCodes() {
  await requireAdminAuth();

  try {
    const result = await db
      .select({
        id: eventCheckInCodes.id,
        code: eventCheckInCodes.code,
        eventId: eventCheckInCodes.eventId,
        pointsAwarded: eventCheckInCodes.pointsAwarded,
        isActive: eventCheckInCodes.isActive,
        expiresAt: eventCheckInCodes.expiresAt,
        createdAt: eventCheckInCodes.createdAt,
        eventTitle: events.title,
        eventStartDate: events.startDate,
      })
      .from(eventCheckInCodes)
      .leftJoin(events, eq(eventCheckInCodes.eventId, events.id))
      .where(eq(eventCheckInCodes.isActive, true))
      .orderBy(desc(eventCheckInCodes.createdAt))
      .execute();

    return { codes: result, success: true };
  } catch (error) {
    console.error('[getActiveCheckInCodes] Error:', error);
    return { codes: [], success: false };
  }
}

// ── Admin: Deactivate a check-in code ─────────────────────────────────

export async function deactivateCheckInCode(codeId: string) {
  await requireAdminAuth();

  try {
    await db
      .update(eventCheckInCodes)
      .set({ isActive: false })
      .where(eq(eventCheckInCodes.id, codeId));

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[deactivateCheckInCode] Error:', error);
    return { success: false, error: 'Failed to deactivate code' };
  }
}

// ── Admin: Get subscriber by email (for POS lookup) ───────────────────

export async function getSubscriberByEmail(email: string) {
  await requireAdminAuth();

  try {
    const result = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email.toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return { subscriber: null, success: false, error: 'Not found' };
    }

    return { subscriber: result[0], success: true };
  } catch (error) {
    console.error('[getSubscriberByEmail] Error:', error);
    return { subscriber: null, success: false };
  }
}

// ── Public: Get subscriber count (for landing page social proof) ───────

export async function getSubscriberCount() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscribers)
      .where(eq(subscribers.status, 'active'));

    return { count: result[0]?.count ?? 0, success: true };
  } catch {
    return { count: 0, success: false };
  }
}
