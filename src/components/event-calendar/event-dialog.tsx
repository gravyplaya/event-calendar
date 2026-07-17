'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { DeleteAlert } from '@/components/event-calendar/ui/delete-alert';
import { FormFooter } from '@/components/event-calendar/ui/form-footer';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ensureDate } from '@/lib/date';
import { useEventCalendarStore } from '@/hooks/use-event';
import { eventFormSchema } from '@/lib/validations';
import { EventDetailsForm } from './event-detail-form';
import { EventPreview } from './event-preview';
import { toast } from 'sonner';
import { deleteEvent, updateEvent } from '@/app/actions';
import { useShallow } from 'zustand/shallow';
import { getLocaleFromCode } from '@/lib/event';
import { useRouter } from 'next/navigation';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '10:00';
const DEFAULT_COLOR = 'bg-red-600';
const DEFAULT_CATEGORY = 'workshop';
const DEFAULT_LOCATION = 'Restaurant/Bar';

type EventFormValues = z.infer<typeof eventFormSchema>;

const DEFAULT_FORM_VALUES: EventFormValues = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(),
  category: DEFAULT_CATEGORY,
  startTime: DEFAULT_START_TIME,
  endTime: DEFAULT_END_TIME,
  location: DEFAULT_LOCATION,
  color: DEFAULT_COLOR,
  flyerUrl: undefined,
  isRepeating: false,
  repeatingType: undefined,
  submitterEmail: undefined,
  submitterPhone: undefined,
};

function useIsMounted() {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}

export default function EventDialog({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const {
    locale,
    selectedEvent,
    isDialogOpen,
    closeEventDialog,
    isSubmitting,
  } = useEventCalendarStore(
    useShallow((state) => ({
      locale: state.locale,
      selectedEvent: state.selectedEvent,
      isDialogOpen: state.isDialogOpen,
      closeEventDialog: state.closeEventDialog,
      isSubmitting: state.isSubmitting,
    })),
  );
  const localeObj = getLocaleFromCode(locale);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);
  const isMounted = useIsMounted();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });

  useEffect(() => {
    if (selectedEvent) {
      try {
        const startDate = ensureDate(selectedEvent.startDate);
        const endDate = ensureDate(selectedEvent.endDate);

        form.reset({
          title: selectedEvent.title || '',
          description: selectedEvent.description || '',
          startDate,
          endDate,
          category: selectedEvent.category || DEFAULT_CATEGORY,
          startTime: selectedEvent.startTime || DEFAULT_START_TIME,
          endTime: selectedEvent.endTime || DEFAULT_END_TIME,
          location: selectedEvent.location || DEFAULT_LOCATION,
          color: selectedEvent.color,
          flyerUrl: selectedEvent.flyerUrl ?? undefined,
          isRepeating: selectedEvent.isRepeating ?? false,
          repeatingType: selectedEvent.repeatingType ?? undefined,
          submitterEmail: selectedEvent.submitterEmail ?? undefined,
          submitterPhone: selectedEvent.submitterPhone ?? undefined,
        });
      } catch (error) {
        console.error('Error resetting form with event data:', error);
      }
    }
  }, [selectedEvent, form]);

  const handleUpdate = async (values: EventFormValues) => {
    if (!selectedEvent?.id) return;

    toast.promise(updateEvent(selectedEvent.id, values), {
      loading: 'Updating event...',
      success: (result) => {
        if (!result.success) {
          throw new Error(result.error || 'Failed to update event');
        }
        closeEventDialog();
        router.refresh();
        return 'Event updated successfully!';
      },
      error: (error) => {
        console.error('Error:', error);
        return error instanceof Error
          ? error.message
          : 'Ops! Something went wrong';
      },
    });
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.id) return;
    setIsDeleteAlertOpen(false);

    toast.promise(deleteEvent(selectedEvent.id), {
      loading: 'Deleting event...',
      success: (result) => {
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete event');
        }
        closeEventDialog();
        router.refresh();
        return 'Event deleted successfully!';
      },
      error: (error) => {
        console.error('Error:', error);
        return error instanceof Error
          ? error.message
          : 'Ops! Something went wrong';
      },
    });
  };

  if (!isMounted) return null;

  if (!isAdmin && selectedEvent) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={closeEventDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>{selectedEvent.title}</DialogDescription>
          </DialogHeader>
          <EventPreview event={selectedEvent} />
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeEventDialog}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={closeEventDialog}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
          <DialogDescription>
            Event details {selectedEvent?.title}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[350px] w-full sm:h-[500px]">
          <EventDetailsForm
            form={form}
            onSubmit={handleUpdate}
            locale={localeObj}
            isAdmin={isAdmin}
          />
        </ScrollArea>
        <DialogFooter className="mt-2 flex flex-row">
          <DeleteAlert
            isOpen={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
            onConfirm={handleDeleteEvent}
            title="Delete this event?"
            description={
              selectedEvent?.isRepeating
                ? 'This is a repeating event. Deleting it removes the entire series and any future occurrences.'
                : 'Are you sure you want to delete this event? This action cannot be undone.'
            }
            confirmText="Delete"
          />
          <FormFooter
            onCancel={closeEventDialog}
            onSave={form.handleSubmit(handleUpdate)}
            isSubmitting={isSubmitting}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
