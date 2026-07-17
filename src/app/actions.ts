'use server';

import { db } from '@/db';
import { events } from '@/db/schema';
import { CalendarViewType } from '@/types/event';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { utapi } from '@/lib/uploadthing';
import { and, between, eq, ilike, or, lte, gte, ne } from 'drizzle-orm';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { z } from 'zod';
import { unstable_cache as cache, revalidatePath, updateTag } from 'next/cache';
import { combineDateAndTime } from '@/lib/date';
import { expandRepeatingEvents } from '@/lib/event';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  createEventSchema,
  EventFilter,
  eventFilterSchema,
  SearchEventFilter,
  searchEventFilterSchema,
} from '@/lib/validations';

const REVALIDATE_TIME = 3600;

/**
 * Strips the synthetic repeat-occurrence suffix that `expandRepeatingEvents`
 * attaches at query time (format: `<uuid>__repeat_<n>`). Server actions that
 * take an event id from the client receive these synthetic ids and need to
 * resolve them to the underlying parent row before talking to the DB — the
 * `__repeat_<n>` tail is not a valid UUID and would otherwise crash Postgres
 * with `invalid input syntax for type uuid`.
 *
 * Returns the input unchanged when no suffix is present so it's safe to call
 * unconditionally on any id-like string.
 */
function extractEventUuid(id: string | null | undefined): string {
  if (!id) return '';
  const at = id.indexOf('__repeat_');
  return at === -1 ? id : id.slice(0, at);
}

export const getEvents = cache(
  async (filterParams: EventFilter) => {
    try {
      console.log(
        '🔍 [getEvents] Starting event fetch with params:',
        filterParams,
      );

      const filter = eventFilterSchema.parse(filterParams);
      console.log('✅ [getEvents] Filter validation passed:', filter);

      const currentDate = new Date(filter.date);
      let dateRange: { start: Date; end: Date } = {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
      if (filter.view) {
        switch (filter.view) {
          case CalendarViewType.DAY:
            dateRange = {
              start: startOfDay(currentDate),
              end: endOfDay(currentDate),
            };
            break;
          case CalendarViewType.DAYS:
            {
              const daysToAdd = filter.daysCount || 7;
              dateRange = {
                start: startOfDay(currentDate),
                end: endOfDay(
                  new Date(
                    currentDate.getTime() +
                      (daysToAdd - 1) * 24 * 60 * 60 * 1000,
                  ),
                ),
              };
            }
            break;
          case CalendarViewType.WEEK:
            dateRange = {
              start: startOfWeek(currentDate, { weekStartsOn: 0 }),
              end: endOfWeek(currentDate, { weekStartsOn: 0 }),
            };
            break;
          case CalendarViewType.MONTH:
            dateRange = {
              start: startOfMonth(currentDate),
              end: endOfMonth(currentDate),
            };
            break;
          case CalendarViewType.YEAR:
            dateRange = {
              start: startOfYear(currentDate),
              end: endOfYear(currentDate),
            };
            break;
        }
      }

      console.log('📅 [getEvents] Date range calculated:', {
        view: filter.view,
        currentDate: currentDate.toISOString(),
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
      });

      const conditions = [];

      // Fetch events that overlap the visible date range, PLUS repeating
      // events whose original start date is before the range (they may
      // generate occurrences that fall within the range).
      conditions.push(
        or(
          and(
            between(events.startDate, dateRange.start, dateRange.end),
            between(events.endDate, dateRange.start, dateRange.end),
          ),
          or(
            between(events.startDate, dateRange.start, dateRange.end),
            between(events.endDate, dateRange.start, dateRange.end),
            and(
              lte(events.startDate, dateRange.start),
              gte(events.endDate, dateRange.end),
            ),
          ),
          // Repeating events that start before the range — their
          // occurrences will be expanded after the query.
          and(
            eq(events.isRepeating, true),
            lte(events.startDate, dateRange.end),
          ),
        ),
      );

      if (filter.title) {
        conditions.push(ilike(events.title, `%${filter.title}%`));
      }

      if (filter.categories.length > 0) {
        const categoryConditions = filter.categories.map((category) =>
          eq(events.category, category),
        );
        conditions.push(or(...categoryConditions));
      }

      if (filter.colors.length > 0) {
        const colorConditions = filter.colors.map((color) =>
          eq(events.color, color),
        );
        conditions.push(or(...colorConditions));
      }

      if (filter.locations.length > 0) {
        const locationConditions = filter.locations.map((location) =>
          ilike(events.location, `%${location}%`),
        );
        conditions.push(or(...locationConditions));
      }

      if (filter.isRepeating) {
        conditions.push(eq(events.isRepeating, filter.isRepeating));
      }

      // Only show approved events unless explicitly requested (admin view)
      if (!filter.includePending) {
        conditions.push(eq(events.isApproved, true));
      }

      console.log(
        '🔍 [getEvents] Query conditions:',
        conditions.length,
        'conditions',
      );

      const result = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .execute();

      // Expand repeating events into virtual occurrences within the range
      const expandedResult = expandRepeatingEvents(
        result,
        dateRange.start,
        dateRange.end,
      );

      console.log('✅ [getEvents] Raw database result:', {
        count: result.length,
        expandedCount: expandedResult.length,
        firstEvent: result[0]
          ? {
              id: result[0].id,
              title: result[0].title,
              startDate: result[0].startDate,
              endDate: result[0].endDate,
              startTime: result[0].startTime,
              endTime: result[0].endTime,
              isRepeating: result[0].isRepeating,
              repeatingType: result[0].repeatingType,
            }
          : 'No events found',
      });

      return {
        events: expandedResult,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ [getEvents] Error fetching events:', error);
      return {
        events: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil data events',
      };
    }
  },
  ['get-events'],
  {
    revalidate: REVALIDATE_TIME,
    tags: ['events'],
  },
);

export const searchEvents = cache(
  async (filterParams: SearchEventFilter) => {
    try {
      const filter = searchEventFilterSchema.parse(filterParams);

      const conditions = [];

      conditions.push(
        or(
          ilike(events.title, `%${filter.search}%`),
          ilike(events.description, `%${filter.search}%`),
          ilike(events.location, `%${filter.search}%`),
        ),
      );

      if (filter.categories.length > 0) {
        const categoryConditions = filter.categories.map((category) =>
          eq(events.category, category),
        );
        conditions.push(or(...categoryConditions));
      }

      if (filter.colors.length > 0) {
        const colorConditions = filter.colors.map((color) =>
          eq(events.color, color),
        );
        conditions.push(or(...colorConditions));
      }

      if (filter.locations.length > 0) {
        const locationConditions = filter.locations.map((location) =>
          ilike(events.location, `%${location}%`),
        );
        conditions.push(or(...locationConditions));
      }

      // Filter berdasarkan repeating types (jika uncommented)
      // if (filter.repeatingTypes.length > 0) {
      //   const typeConditions = filter.repeatingTypes.map((type) =>
      //     eq(events.repeatingType, type),
      //   );
      //   conditions.push(or(...typeConditions));
      // }

      if (filter.isRepeating) {
        conditions.push(eq(events.isRepeating, filter.isRepeating === 'true'));
      }

      const result = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(events.startDate)
        .limit(filter.limit)
        .offset(filter.offset)
        .execute();

      const totalCountResult = await db
        .select({ count: events.id })
        .from(events)
        .where(and(...conditions));

      return {
        events: result,
        totalCount: totalCountResult.length,
        hasMore: result.length === filter.limit,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error searching events:', error);
      return {
        events: [],
        totalCount: 0,
        hasMore: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mencari events',
      };
    }
  },
  ['search-events'],
  {
    revalidate: REVALIDATE_TIME / 2,
    tags: ['events', 'search'],
  },
);

export async function getCategories() {
  try {
    const result = await db
      .select({ category: events.category })
      .from(events)
      .groupBy(events.category);

    return {
      categories: result.map((item) => item.category),
      success: true,
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      categories: [],
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat mengambil data kategori',
    };
  }
}

export async function checkEventConflicts(
  eventData: z.infer<typeof createEventSchema>,
  excludeEventId?: string,
) {
  try {
    const { startDate, endDate, startTime, endTime, location } = eventData;
    const resolvedEndDate = endDate ?? startDate;

    // Combine date and time for proper comparison
    const startDateTime = combineDateAndTime(startDate, startTime);
    const endDateTime = combineDateAndTime(resolvedEndDate, endTime);

    const conditions = [
      // Case-insensitive location match
      ilike(events.location, location),
      // Overlap detection: startDate < new_endDate AND endDate > new_startDate
      and(
        lte(events.startDate, endDateTime),
        gte(events.endDate, startDateTime),
      ),
    ];

    if (excludeEventId) {
      conditions.push(ne(events.id, excludeEventId));
    }

    const overlappingEvents = await db
      .select({
        id: events.id,
        title: events.title,
        startDate: events.startDate,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
      })
      .from(events)
      .where(and(...conditions))
      .execute();

    const conflicts = overlappingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
    }));

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      message:
        conflicts.length > 0
          ? `Heads up: ${conflicts.length} other event${conflicts.length === 1 ? '' : 's'} already booked "${location}" during this time.`
          : undefined,
    };
  } catch (error) {
    console.error('Error checking for event conflicts:', error);
    return {
      hasConflict: false,
      conflicts: [],
      message: 'Unable to check for conflicts at this time.',
    };
  }
}

export async function createEvent(values: z.infer<typeof createEventSchema>) {
  try {
    const validatedFields = createEventSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid fields',
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      category,
      color,
      isRepeating,
      repeatingType,
      submitterEmail,
      submitterPhone,
      flyerUrl,
    } = validatedFields.data;

    const startDateTime = combineDateAndTime(startDate, startTime);
    const resolvedEndDate = endDate ?? startDate;
    let endDateTime = combineDateAndTime(resolvedEndDate, endTime);

    // If end time is earlier than start time on the same date, the event
    // crosses midnight — roll the end date forward one day.
    if (endDateTime < startDateTime) {
      const next = new Date(endDateTime);
      next.setDate(next.getDate() + 1);
      endDateTime = next;
    }

    // Validate that end time is at or after start time
    if (endDateTime < startDateTime) {
      return {
        success: false,
        error: 'Invalid time range',
        message: 'End time must be at or after start time.',
      };
    }
    let conflicts: Array<{
      title: string;
      timeRange: string;
      dateRange: string;
      location: string;
    }> = [];
    try {
      const overlap = await db
        .select({
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          endDate: events.endDate,
          startTime: events.startTime,
          endTime: events.endTime,
          location: events.location,
        })
        .from(events)
        .where(
          and(
            ilike(events.location, location),
            and(
              lte(events.startDate, endDateTime),
              gte(events.endDate, startDateTime),
            ),
          ),
        )
        .execute();

      conflicts = overlap.map((event) => ({
        title: event.title,
        timeRange: `${event.startTime} - ${event.endTime}`,
        dateRange: `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`,
        location: event.location,
      }));
    } catch (dbError) {
      console.error('Conflict warning query failed:', dbError);
      // Soft failure: treat as no conflicts rather than blocking the create
    }

    // Attempt to create the event
    try {
      const isAdmin = await isAdminAuthenticated();

      await db.insert(events).values({
        title,
        description,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime,
        endTime,
        location,
        category: category ?? 'General',
        color,
        isRepeating: isRepeating ?? false,
        repeatingType: repeatingType ?? null,
        isApproved: isAdmin,
        submitterEmail: submitterEmail ?? null,
        submitterPhone: submitterPhone ?? null,
        flyerUrl: flyerUrl ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      revalidatePath('/calendar');
      revalidatePath('/admin', 'layout');
      revalidatePath('/', 'layout');
      updateTag('events');

      return {
        success: true,
        isApproved: isAdmin,
        warnings:
          conflicts.length > 0
            ? {
                message: `Heads up: ${conflicts.length} other event${conflicts.length === 1 ? '' : 's'} already booked "${location}" during this time. The event was created anyway.`,
                conflicts,
              }
            : undefined,
      };
    } catch (dbError) {
      console.error('Database insertion failed:', dbError);
      return {
        success: false,
        error: 'Database error',
        message:
          'Failed to create event due to a database error. Please try again.',
      };
    }
  } catch (error) {
    console.error('Unexpected error creating event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event',
      message: 'An unexpected error occurred while creating the event.',
    };
  }
}

export async function updateEvent(
  id: string,
  values: Partial<z.infer<typeof createEventSchema>>,
) {
  try {
    const realId = extractEventUuid(id);
    if (!realId) {
      throw new Error('Missing event id');
    }

    const validatedFields = createEventSchema.partial().safeParse(values);

    if (!validatedFields.success) {
      return {
        error: 'Invalid fields',
        details: validatedFields.error.flatten().fieldErrors,
      };
    }

    const existingEvent = await db
      .select()
      .from(events)
      .where(and(eq(events.id, realId)))
      .limit(1);

    if (!existingEvent.length) {
      throw new Error('Event not found or unauthorized');
    }

    await db
      .update(events)
      .set({
        ...validatedFields.data,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, realId)));

    revalidatePath('/calendar');
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    updateTag('events');
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update event',
    };
  }
}

// ── Flyer file helpers ─────────────────────────────────────────────────

async function deleteFlyerFile(flyerUrl: string | null): Promise<void> {
  if (!flyerUrl) return;
  try {
    // UploadThing-hosted files: extract the file key from the URL
    // URL format: https://utfs.io/f/<fileKey>
    if (flyerUrl.startsWith('http://') || flyerUrl.startsWith('https://')) {
      const url = new URL(flyerUrl);
      const fileKey = url.pathname.split('/').filter(Boolean).pop();
      if (fileKey) {
        await utapi.deleteFiles(fileKey);
        console.log('🗑️ Deleted flyer from UploadThing:', fileKey);
      }
      return;
    }

    // Legacy local files: /uploads/flyers/<filename>
    const filePath = join(process.cwd(), 'public', flyerUrl);
    await unlink(filePath);
    console.log('🗑️ Deleted local flyer file:', flyerUrl);
  } catch (err) {
    // File may already be gone — not a fatal error
    console.warn('Could not delete flyer file:', flyerUrl, err);
  }
}

export async function deleteEvent(id: string) {
  try {
    const realId = extractEventUuid(id);
    if (!realId) {
      throw new Error('Missing event id');
    }

    const existingEvent = await db
      .select()
      .from(events)
      .where(and(eq(events.id, realId)))
      .limit(1);

    if (!existingEvent.length) {
      throw new Error('Event not found or unauthorized');
    }

    await deleteFlyerFile(existingEvent[0].flyerUrl);
    await db.delete(events).where(and(eq(events.id, realId)));

    revalidatePath('/calendar');
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    updateTag('events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete event',
    };
  }
}

// ── Event Approval Workflow ────────────────────────────────────────────

export async function getPendingEvents() {
  try {
    const result = await db
      .select()
      .from(events)
      .where(eq(events.isApproved, false))
      .orderBy(events.createdAt)
      .execute();

    return { events: result, success: true };
  } catch (error) {
    console.error('Error fetching pending events:', error);
    return { events: [], success: false };
  }
}

export async function approveEvent(id: string) {
  try {
    const realId = extractEventUuid(id);
    if (!realId) {
      throw new Error('Missing event id');
    }

    await db
      .update(events)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(events.id, realId));

    revalidatePath('/calendar');
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    updateTag('events');
    return { success: true };
  } catch (error) {
    console.error('Error approving event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve event',
    };
  }
}

export async function rejectEvent(id: string) {
  try {
    const realId = extractEventUuid(id);
    if (!realId) {
      throw new Error('Missing event id');
    }

    const existingEvent = await db
      .select({ flyerUrl: events.flyerUrl })
      .from(events)
      .where(eq(events.id, realId))
      .limit(1);

    await deleteFlyerFile(existingEvent[0]?.flyerUrl ?? null);
    await db.delete(events).where(eq(events.id, realId));

    revalidatePath('/calendar');
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    updateTag('events');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject event',
    };
  }
}
