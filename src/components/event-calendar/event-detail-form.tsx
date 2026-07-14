import { eventFormSchema, LOCATION_OPTIONS } from '@/lib/validations';
import { Locale } from 'date-fns';
import { memo, useEffect, useState, useRef, useId } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { DateSelector } from './ui/date-selector';
import { TimeSelector } from './ui/time-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CATEGORY_OPTIONS, EVENT_COLORS } from '@/constants/calendar-constant';
import { ColorOptionItem } from './ui/color-option-item';
import { z } from 'zod';
import { getColorClasses } from '@/lib/event';
import { Alert, AlertDescription } from '../ui/alert';
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

// Conflict Warning Component
interface ConflictWarningProps {
  conflicts: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    startDate?: Date;
    endDate?: Date;
  }>;
  message?: string;
  onViewInCalendar?: (conflictId: string) => void;
  onSuggestAlternatives?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ConflictWarning = memo(
  ({
    conflicts,
    message,
    onViewInCalendar,
    onSuggestAlternatives,
    onDismiss,
    className,
  }: ConflictWarningProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedConflict, setSelectedConflict] = useState<string | null>(
      null,
    );
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const detailsId = useId();

    useEffect(() => {
      // Animate in when conflicts appear
      setIsVisible(true);
    }, []);

    const handleViewInCalendar = (conflictId: string) => {
      setSelectedConflict(conflictId);
      onViewInCalendar?.(conflictId);
    };

    const formatTimeRange = (startTime: string, endTime: string) => {
      return `${startTime} - ${endTime}`;
    };

    const getConflictSeverity = () => {
      if (conflicts.length >= 3) return 'high';
      if (conflicts.length >= 2) return 'medium';
      return 'low';
    };

    const severity = getConflictSeverity();
    const severityColors = {
      high: 'border-red-500 bg-red-50/50 dark:bg-red-950/30',
      medium: 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30',
      low: 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30',
    };

    const iconColors = {
      high: 'text-red-600 dark:text-red-400',
      medium: 'text-orange-600 dark:text-orange-400',
      low: 'text-yellow-600 dark:text-yellow-400',
    };

    // Handle keyboard navigation for the entire warning
    const _handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    return (
      <div
        ref={containerRef}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className={cn(
          'relative overflow-hidden rounded-lg border p-3 transition-all duration-300 ease-in-out sm:p-4',
          'focus:ring-primary/50 focus:ring-2 focus:outline-none',
          isVisible
            ? 'animate-in slide-in-from-top-2 fade-in-0'
            : 'animate-out slide-out-to-top-2 fade-out-0',
          severityColors[severity],
          className,
        )}
      >
        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="assertive">
          {conflicts.length} conflicting event
          {conflicts.length !== 1 ? 's' : ''} detected.
          {message || `Please review the conflicts below.`}
        </div>

        {/* Header */}
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            className={cn('mt-0.5 flex-shrink-0', iconColors[severity])}
            aria-hidden="true"
          >
            <AlertTriangle className="h-4 w-4 animate-pulse sm:h-5 sm:w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className={cn(
                  'text-xs leading-4 font-semibold sm:text-sm sm:leading-5',
                  'break-words',
                  severity === 'high'
                    ? 'text-red-900 dark:text-red-100'
                    : severity === 'medium'
                      ? 'text-orange-900 dark:text-orange-100'
                      : 'text-yellow-900 dark:text-yellow-100',
                )}
              >
                {message ||
                  `${conflicts.length} conflicting event${conflicts.length !== 1 ? 's' : ''} found`}
              </h3>

              <div className="flex flex-shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? 'Collapse conflict details'
                      : 'Expand conflict details'
                  }
                  aria-controls={detailsId}
                  className="h-6 px-1.5 transition-colors hover:bg-white/20 sm:h-7 sm:px-2 dark:hover:bg-black/20"
                >
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 transition-transform duration-200 sm:h-4 sm:w-4',
                      isExpanded ? 'rotate-90' : '',
                    )}
                    aria-hidden="true"
                  />
                </Button>

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    aria-label="Dismiss warning"
                    title="Dismiss warning (Esc)"
                    className="h-6 px-1.5 transition-colors hover:bg-white/20 sm:h-7 sm:px-2 dark:hover:bg-black/20"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content with smooth transition */}
        <div
          id={detailsId}
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
          )}
          aria-hidden={!isExpanded}
        >
          <Separator className="my-2 opacity-50 sm:my-3" aria-hidden="true" />

          {/* Conflict List */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-foreground/90 text-xs font-medium sm:text-sm">
                Conflicting Events:
              </h4>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  'animate-pulse px-1.5 py-0.5',
                  severity === 'high'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : severity === 'medium'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                )}
              >
                {conflicts.length} CONFLICT{conflicts.length !== 1 ? 'S' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <li
                  key={conflict.id}
                  className="list-none"
                  aria-label={`View "${conflict.title}" in calendar. Time: ${formatTimeRange(conflict.startTime, conflict.endTime)}, Location: ${conflict.location}`}
                >
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-md border p-2 text-left transition-all duration-200 sm:p-3',
                      'hover:bg-white/30 hover:shadow-sm dark:hover:bg-black/30',
                      selectedConflict === conflict.id
                        ? 'ring-primary/50bg-white/40 ring-2 dark:bg-black/40'
                        : 'bg-white/20 dark:bg-black/20',
                      'focus:ring-primary/50 focus:ring-2 focus:outline-none',
                      'transform hover:scale-[1.01] active:scale-[0.99]',
                    )}
                    onClick={() => handleViewInCalendar(conflict.id)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-1.5 sm:gap-2">
                          <span
                            className={cn(
                              'inline-flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium sm:h-5 sm:w-5',
                              'bg-primary/10 text-primary',
                            )}
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <h5
                            className="text-foreground truncate text-xs font-medium sm:text-sm"
                            aria-level={5}
                          >
                            {conflict.title}
                          </h5>
                        </div>

                        <div className="text-muted-foreground space-y-0.5 text-xs sm:space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock
                              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                              aria-hidden="true"
                            />
                            <span>
                              {formatTimeRange(
                                conflict.startTime,
                                conflict.endTime,
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin
                              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {conflict.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInCalendar(conflict.id);
                        }}
                        className="focus:ring-primary/50 flex h-5 flex-shrink-0 items-center justify-center rounded px-1.5 text-xs hover:bg-white/30 focus:ring-1 focus:outline-none sm:h-6 sm:px-2 dark:hover:bg-black/30"
                        aria-label={`View "${conflict.title}" in calendar`}
                      >
                        View
                        <Calendar
                          className="ml-0.5 h-2.5 w-2.5 sm:ml-1 sm:h-3 sm:w-3"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </button>
                </li>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
            {onSuggestAlternatives && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSuggestAlternatives}
                className={cn(
                  'h-7 px-2 text-xs sm:h-8 sm:px-3',
                  'border-current/30 hover:bg-white/30 dark:hover:bg-black/30',
                  'transition-all duration-200 hover:scale-105 active:scale-95',
                  severity === 'high'
                    ? 'text-red-700 dark:text-red-300'
                    : severity === 'medium'
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-yellow-700 dark:text-yellow-300',
                )}
              >
                <Info className="mr-1 h-3 w-3" aria-hidden="true" />
                Suggest Alternatives
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Navigate to calendar view with appropriate date range
                const earliestDate = conflicts.reduce(
                  (earliest, conflict) =>
                    conflict.startDate && conflict.startDate < earliest
                      ? conflict.startDate
                      : earliest,
                  new Date(),
                );
                // This would typically navigate to calendar or open calendar modal
                console.log('Navigate to calendar around:', earliestDate);
              }}
              className="h-7 border-current/30 px-2 text-xs transition-all duration-200 hover:scale-105 hover:bg-white/30 active:scale-95 sm:h-8 sm:px-3 dark:hover:bg-black/30"
            >
              <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
              View in Calendar
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-2 rounded-md bg-white/30 p-2 sm:mt-3 dark:bg-black/30">
            <div className="text-muted-foreground flex items-start gap-1.5 text-xs sm:gap-2">
              <Info
                className="mt-0.5 h-3 w-3 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="leading-tight">
                Consider changing the time, date, or location to avoid
                conflicts.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ConflictWarning.displayName = 'ConflictWarning';

type EventFormValues = z.infer<typeof eventFormSchema>;

type EventDetailsFormProps = {
  form: UseFormReturn<EventFormValues>;
  onSubmit: (values: EventFormValues) => void;
  locale: Locale;
  conflicts?: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    startDate?: Date;
    endDate?: Date;
  }>;
  conflictMessage?: string;
  isCheckingConflicts?: boolean;
  conflictError?: string | null;
  onViewInCalendar?: (conflictId: string) => void;
  onSuggestAlternatives?: () => void;
  onDismissConflict?: () => void;
  allowForceSave?: boolean;
  onForceSave?: () => void;
};

export const EventDetailsForm = memo(
  ({
    form,
    onSubmit,
    locale,
    conflicts = [],
    conflictMessage,
    isCheckingConflicts = false,
    conflictError,
    onViewInCalendar,
    onSuggestAlternatives,
    onDismissConflict,
  }: EventDetailsFormProps) => {
    const _getConflictSeverity = () => {
      if (conflicts.length >= 3) return 'high';
      if (conflicts.length >= 2) return 'medium';
      return 'low';
    };

    const hasConflict = conflicts.length > 0;

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-5 px-2 py-3"
          data-testid="event-form"
        >
          {/* Enhanced Conflict Warning */}
          {hasConflict && !isCheckingConflicts && (
            <ConflictWarning
              conflicts={conflicts}
              message={conflictMessage}
              onViewInCalendar={onViewInCalendar}
              onSuggestAlternatives={onSuggestAlternatives}
              onDismiss={onDismissConflict}
              className="mb-4"
            />
          )}

          {/* Conflict Checking Indicator */}
          {isCheckingConflicts && (
            <Alert className="mb-4">
              <AlertDescription className="text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
                  Checking for conflicts...
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflict Error */}
          {conflictError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{conflictError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Event Title <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter event title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Short description of the event"
                    rows={3}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <DateSelector
                  value={field.value}
                  onChange={field.onChange}
                  label="Start Date"
                  locale={locale}
                  required
                />
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <TimeSelector
                  value={field.value}
                  onChange={field.onChange}
                  label="Start Time"
                  required
                />
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <DateSelector
                  value={field.value}
                  onChange={field.onChange}
                  label="End Date"
                  locale={locale}
                  required
                />
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <TimeSelector
                  value={field.value}
                  onChange={field.onChange}
                  label="End Time"
                  required
                />
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Space <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a space" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Category <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Color</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_COLORS.map((option) => {
                        const validColor = getColorClasses(option.value);
                        return (
                          <ColorOptionItem
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            className={validColor.bg}
                          />
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    );
  },
);

EventDetailsForm.displayName = 'EventDetailsForm';
