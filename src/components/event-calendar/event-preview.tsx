'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Repeat, ImageIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Events } from '@/types/event';
import { getLocaleFromCode } from '@/lib/event';
import { useEventCalendarStore } from '@/hooks/use-event';
import { useShallow } from 'zustand/shallow';
import { ScrollArea } from '../ui/scroll-area';

const REPEAT_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
};

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <div className="text-foreground text-sm">{children}</div>
      </div>
    </div>
  );
}

export function EventPreview({ event }: { event: Events }) {
  const { locale } = useEventCalendarStore(
    useShallow((state) => ({ locale: state.locale })),
  );
  const localeObj = getLocaleFromCode(locale);

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isMultiDay = !isSameDay(startDate, endDate);

  const dateText = isMultiDay
    ? `${format(startDate, 'MMM d, yyyy', { locale: localeObj })} – ${format(endDate, 'MMM d, yyyy', { locale: localeObj })}`
    : format(startDate, 'EEEE, MMMM d, yyyy', { locale: localeObj });

  return (
    <ScrollArea className="h-[350px] w-full sm:h-[500px]">
      <div className="space-y-5 px-2 py-3">
        {/* Flyer */}
        {event.flyerUrl ? (
          <a
            href={event.flyerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-muted group relative block overflow-hidden rounded-lg border"
            aria-label={`Open ${event.title} flyer in new tab`}
          >
            <img
              src={event.flyerUrl}
              alt={`${event.title} flyer`}
              className="max-h-72 w-full object-contain transition-transform group-hover:scale-[1.02]"
            />
          </a>
        ) : (
          <div className="bg-muted/30 flex h-32 items-center justify-center rounded-lg border">
            <div className="text-muted-foreground flex flex-col items-center gap-1">
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">No flyer</span>
            </div>
          </div>
        )}

        {/* Title + status badge */}
        <div className="flex items-start gap-2">
          <h2 className="text-lg leading-tight font-semibold">{event.title}</h2>
          {event.isRepeating && event.repeatingType && (
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {REPEAT_LABELS[event.repeatingType] || event.repeatingType}
            </Badge>
          )}
        </div>

        {/* Key details */}
        <div className="space-y-4">
          <DetailRow icon={Calendar} label="Date">
            {dateText}
          </DetailRow>

          <DetailRow icon={Clock} label="Time">
            {event.startTime} – {event.endTime}
          </DetailRow>

          <DetailRow icon={MapPin} label="Space">
            {event.location}
          </DetailRow>

          {event.isRepeating && event.repeatingType && (
            <DetailRow icon={Repeat} label="Recurrence">
              {REPEAT_LABELS[event.repeatingType] || event.repeatingType}
            </DetailRow>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              Description
            </p>
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
