'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, Clock, MapPin, Mail, Phone } from 'lucide-react';
import { approveEvent, rejectEvent } from '@/app/actions';
import { toast } from 'sonner';
import { Events } from '@/types/event';
import { useRouter } from 'next/navigation';

export function PendingEventsReview({ events }: { events: Events[] }) {
  const [, startTransition] = useTransition();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const router = useRouter();

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No pending events to review. All caught up.
        </p>
      </div>
    );
  }

  const handleApprove = (id: string, title: string) => {
    startTransition(async () => {
      const result = await approveEvent(id);
      if (result.success) {
        toast.success(`Approved "${title}"`, {
          description: 'The event is now visible on the public calendar.',
        });
        router.refresh();
      } else {
        toast.error('Failed to approve event');
      }
    });
  };

  const handleReject = (id: string, title: string) => {
    startTransition(async () => {
      const result = await rejectEvent(id);
      if (result.success) {
        toast.success(`Rejected "${title}"`, {
          description: 'The event has been permanently removed.',
        });
        router.refresh();
      } else {
        toast.error('Failed to reject event');
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="flex flex-col overflow-hidden">
            {event.flyerUrl ? (
              <button
                type="button"
                onClick={() => setLightboxSrc(event.flyerUrl!)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLightboxSrc(event.flyerUrl!);
                  }
                }}
                className="bg-muted/30 block cursor-pointer border-b"
                aria-label={`View ${event.title} flyer full size`}
              >
                <img
                  src={event.flyerUrl}
                  alt={`${event.title} flyer`}
                  className="h-48 w-full object-cover transition-transform hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="bg-muted/30 flex h-32 items-center justify-center border-b">
                <span className="text-muted-foreground text-xs">No flyer</span>
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{event.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  Pending
                </Badge>
              </div>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.startDate).toLocaleDateString()}
                  {event.endDate.toDateString() !==
                    event.startDate.toDateString() &&
                    ` – ${new Date(event.endDate).toLocaleDateString()}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.startTime} – {event.endTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              </div>
              {event.description && (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-xs">
                  {event.description}
                </p>
              )}
              {(event.submitterEmail || event.submitterPhone) && (
                <div className="text-muted-foreground mt-3 space-y-1 border-t pt-2 text-xs">
                  {event.submitterEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {event.submitterEmail}
                    </span>
                  )}
                  {event.submitterPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {event.submitterPhone}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-auto flex items-center gap-2 pt-4">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => handleApprove(event.id, event.title)}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(event.id, event.title)}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxSrc(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close flyer preview"
        >
          <img
            src={lightboxSrc}
            alt="Event flyer"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
