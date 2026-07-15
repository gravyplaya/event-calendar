# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tavonni Spaces Event Calendar is a modern, full-stack event management application built with Next.js 15, featuring multiple calendar views, conflict detection, and PostgreSQL persistence. It's designed as a venue booking system with specific locations (Vinyl, Digital, Live, etc.).

## Development Commands

### Core Commands
```bash
# Development server
pnpm dev

# Production build and start
pnpm build
pnpm start

# Code quality
pnpm lint
pnpm lint:fix
pnpm format:write
pnpm format:check
```

### Database Commands
```bash
# Generate database migrations
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database with sample data
pnpm db:seed

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Introspect existing database
pnpm db:introspect

# Drop migration
pnpm db:drop-migration
```

### Testing & Development
```bash
# Run a single test file
# Note: No test framework is currently configured

# View calendar in development
# Navigate to http://localhost:3000/calendar after starting dev server
```

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router (React Server Components)
- **TypeScript** for type safety
- **Tailwind CSS** with **shadcn/ui** components
- **Drizzle ORM** with PostgreSQL
- **Zustand** for client state management
- **date-fns** for date manipulation
- **Zod** for validation

### Database Architecture
- **Single table design** (`events`) with comprehensive fields
- **Conflict detection** prevents double-booking of locations
- **Timezone-aware** timestamps (`timestamp with timezone`)
- **Predefined location enums** (Vinyl, Digital, Live, Live w/ Kitchen and Bathroom, Entire Building)

### State Management
- **Zustand store** (`useEventCalendarStore`) handles:
  - Calendar view state (day/week/month/year)
  - Dialog states (event creation, editing, quick add)
  - View configurations and preferences
  - Locale and time format settings

### Component Structure
```
src/components/
├── event-calendar/        # Core calendar components
│   ├── event-calendar.tsx # Main calendar wrapper
│   ├── calendar-day.tsx   # Day view implementation
│   ├── calendar-week.tsx  # Week view implementation
│   ├── calendar-month.tsx # Month view implementation
│   ├── event-dialog.tsx   # Event CRUD operations
│   └── event-list.tsx     # List view with filtering
├── ui/                    # shadcn/ui components
└── docs/                  # Documentation components
```

### Key Patterns

#### Server Actions Pattern
All database operations use Next.js Server Actions in `src/app/actions.ts`:
- `getEvents()` - Cached event fetching with view-specific filtering
- `createEvent()` - With conflict detection
- `updateEvent()` - Partial updates
- `deleteEvent()` - Soft/hard deletion
- `checkEventConflicts()` - Location booking validation

#### Event Positioning Algorithm
Complex positioning logic in `src/lib/event.ts`:
- **Single-day events**: Column-based positioning prevents visual overlaps
- **Multi-day events**: Row-based positioning across week view
- **Day view**: Stacked event positioning with calculated heights

#### Type System
- **Database types** generated from Drizzle schema (`EventTypes`, `newEvent`)
- **UI types** in `src/types/event.ts` for calendar views and configurations
- **Validation schemas** in `src/lib/validations.ts` using Zod

## Key Files and Locations

### Configuration Files
- `drizzle.config.ts` - Database configuration
- `middleware.ts` - Next.js middleware (if needed)
- `components.json` - shadcn/ui configuration

### Core Application Files
- `src/app/actions.ts` - Server Actions for all database operations
- `src/db/schema.ts` - Drizzle database schema definition
- `src/hooks/use-event.ts` - Main Zustand store for calendar state
- `src/lib/event.ts` - Calendar logic and event positioning algorithms
- `src/lib/date.ts` - Date utility functions
- `src/types/event.ts` - TypeScript type definitions

### Important Constants
- `src/constants/calendar-constant.ts` - Calendar configurations, locales, categories
- Location options are defined in `src/lib/validations.ts`

## Development Guidelines

### Database Workflow
1. Make schema changes in `src/db/schema.ts`
2. Generate migration with `pnpm db:generate`
3. Apply changes with `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
4. Use `pnpm db:studio` to visually inspect data

### Adding New Calendar Views
1. Create view component in `src/components/event-calendar/`
2. Add view type to `CalendarViewType` enum in `src/types/event.ts`
3. Implement filtering logic in `EVENT_VIEW_CONFIG` in `src/components/event-calendar/event-list.tsx`
4. Add view configuration to Zustand store

### Event Positioning
When modifying event display logic:
- Single-day events use column-based positioning in `useEventPositions()`
- Multi-day events use row-based positioning in `useMultiDayEventRows()`
- Both algorithms prevent visual overlaps and optimize space usage

### State Management
- Use `useEventCalendarStore` for calendar-wide state
- Dialog states are centrally managed in the store
- View configurations persist via Zustand persistence

### Styling Patterns
- Use Tailwind CSS with `cn()` utility for conditional classes
- Follow shadcn/ui component patterns
- Color theming defined in `COLOR_CLASSES` object in `src/lib/event.ts`

## Environment Variables
Required environment variables (create `.env.local`):
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Important Notes

### Conflict Detection
The application prevents double-booking by checking for overlapping events at the same location. This logic is implemented in both `createEvent()` and `checkEventConflicts()` server actions.

### Calendar Views
- **Day View**: Single day with hourly time slots
- **Week View**: 7-day view with multi-day event support  
- **Month View**: Traditional month grid with event limit
- **Year View**: Annual overview with event indicators
- **List View**: Filtered event list with search capabilities

### Location System
Locations are predefined enums rather than free-form text to ensure data consistency and enable proper conflict detection.

### Performance Optimizations
- Events are cached using `unstable_cache` with revalidation
- Calendar views use `useMemo` for expensive calculations
- Components are dynamically imported where appropriate

This architecture prioritizes type safety, performance, and maintainability while providing a rich calendar experience with proper conflict management.