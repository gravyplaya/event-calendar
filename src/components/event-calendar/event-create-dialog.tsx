'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventCalendarStore } from '@/hooks/use-event';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { EventDetailsForm } from './event-detail-form';
import { EventPreviewCalendar } from './event-preview-calendar';
import { createEventSchema } from '@/lib/validations';
import { EVENT_DEFAULTS } from '@/constants/calendar-constant';
import { useShallow } from 'zustand/shallow';
import { toast } from 'sonner';
import { createEvent } from '@/app/actions';
import { getLocaleFromCode } from '@/lib/event';
import { FormFooter } from './ui/form-footer';
import { useConflictDetection } from '@/hooks/use-conflict-detection';

type EventFormValues = z.infer<typeof createEventSchema>;

// Update the DEFAULT_FORM_VALUES to use a valid location from the enum
const DEFAULT_FORM_VALUES: EventFormValues = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(),
  category: EVENT_DEFAULTS.CATEGORY,
  startTime: EVENT_DEFAULTS.START_TIME,
  endTime: EVENT_DEFAULTS.END_TIME,
  location: 'Restaurant/Bar',
  color: EVENT_DEFAULTS.COLOR,
  isRepeating: false,
  repeatingType: undefined,
  submitterEmail: undefined,
  submitterPhone: undefined,
  flyerUrl: undefined,
};

export default function EventCreateDialog({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const {
    isQuickAddDialogOpen,
    closeQuickAddDialog,
    timeFormat,
    locale,
    quickAddData,
  } = useEventCalendarStore(
    useShallow((state) => ({
      isQuickAddDialogOpen: state.isQuickAddDialogOpen,
      closeQuickAddDialog: state.closeQuickAddDialog,
      timeFormat: state.timeFormat,
      locale: state.locale,
      quickAddData: state.quickAddData,
    })),
  );
  const form = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowForceSave] = useState(false); // Set to true for authorized users
  const localeObj = getLocaleFromCode(locale);

  const watchedValues = form.watch();

  // Create event data for conflict detection
  const eventData = useMemo(() => {
    if (
      watchedValues.startDate &&
      watchedValues.startTime &&
      watchedValues.endTime &&
      watchedValues.location
    ) {
      return {
        title: watchedValues.title || 'Untitled Event',
        description: watchedValues.description || '',
        startDate: watchedValues.startDate,
        endDate: watchedValues.endDate ?? watchedValues.startDate,
        startTime: watchedValues.startTime,
        endTime: watchedValues.endTime,
        location: watchedValues.location,
        category: watchedValues.category || 'General',
        color: watchedValues.color || 'blue',
        isRepeating: watchedValues.isRepeating || false,
        repeatingType: watchedValues.repeatingType,
      };
    }
    return null;
  }, [
    watchedValues.startDate,
    watchedValues.endDate,
    watchedValues.startTime,
    watchedValues.endTime,
    watchedValues.location,
    watchedValues.title,
    watchedValues.description,
    watchedValues.category,
    watchedValues.color,
    watchedValues.isRepeating,
    watchedValues.repeatingType,
  ]);

  // Use on-demand conflict detection
  const {
    hasConflict,
    conflicts,
    message: conflictMessage,
    isChecking: isCheckingConflicts,
    error: conflictError,
    checkConflicts,
    clearConflicts,
  } = useConflictDetection(eventData, {
    enabled: false, // Disable automatic checking
    delay: 0,
  });

  const handleSubmit = async (formValues: EventFormValues) => {
    // First, check for conflicts using the current form data
    await checkConflicts();

    // Small delay to allow state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // If conflicts are detected, show warning and block save
    if (hasConflict && conflicts.length > 0) {
      toast.error('Cannot save event', {
        description:
          'Conflicts detected. Please review and resolve conflicts before saving.',
        duration: 5000,
      });
      return;
    }

    // Check if there was an error checking conflicts
    if (conflictError) {
      toast.error('Conflict check failed', {
        description: `${conflictError}. Please try again or check your connection.`,
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createEvent(formValues);

      if (!result.success) {
        // Handle conflict detection errors with detailed information
        if (result.conflicts && result.conflicts.length > 0) {
          const conflictMessages = result.conflicts
            .map((conflict) => `• "${conflict.title}" (${conflict.timeRange})`)
            .join('\n');

          toast.error(`Location Booking Conflict`, {
            description: `${result.message}\n\nConflicting events:\n${conflictMessages}`,
            duration: 10000,
          });
        } else {
          // Handle other errors
          toast.error(result.error || 'Error Creating Event');
        }
        setIsSubmitting(false);
        return;
      }

      // Success case
      if (result.isApproved) {
        toast.success('Event Successfully Created');
      } else {
        toast.success('Event Submitted for Review', {
          description:
            'Your event has been submitted. An admin will review and approve it before it appears on the calendar.',
          duration: 6000,
        });
      }
      form.reset(DEFAULT_FORM_VALUES);
      clearConflicts(); // Clear any existing conflicts
      setIsSubmitting(false);
      closeQuickAddDialog();
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Ops! something went wrong';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleForceSave = async () => {
    // For authorized users who want to force save despite conflicts
    if (!allowForceSave) {
      toast.error('Force save not available', {
        description:
          'You do not have permission to force save events with conflicts.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // This would require a separate API endpoint that allows force saving
      // For now, we'll just show a message
      toast.info('Force save functionality', {
        description:
          'Force save would bypass conflict checks for authorized users.',
      });
    } catch (error) {
      console.error('Force save error:', error);
      toast.error('Force save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset(DEFAULT_FORM_VALUES);
    clearConflicts(); // Clear conflicts when canceling
    closeQuickAddDialog();
  };

  // Handle viewing conflict in calendar
  const handleViewInCalendar = (conflictId: string) => {
    // This would typically navigate to calendar or open calendar modal
    console.log('View conflict in calendar:', conflictId);
    // You could emit an event or call a navigation function here
  };

  // Handle suggesting alternatives
  const handleSuggestAlternatives = () => {
    // This could open a modal with alternative time/location suggestions
    console.log('Suggest alternatives for conflicts');
    // You could implement a suggestions system here
  };

  // Handle dismissing conflicts
  const handleDismissConflict = () => {
    clearConflicts();
  };

  useEffect(() => {
    if (isQuickAddDialogOpen && quickAddData.date) {
      form.reset({
        ...DEFAULT_FORM_VALUES,
        startDate: quickAddData.date,
        endDate: quickAddData.date,
        startTime: quickAddData.startTime,
        endTime: quickAddData.endTime,
      });
    }
  }, [isQuickAddDialogOpen, quickAddData, form]);

  return (
    <Dialog
      open={isQuickAddDialogOpen}
      onOpenChange={(open) => !open && closeQuickAddDialog()}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Fill in the event details to add it to the calendar
          </DialogDescription>
        </DialogHeader>
        <Tabs className="w-full" defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <ScrollArea className="h-[500px] w-full">
              <EventDetailsForm
                form={form}
                onSubmit={handleSubmit}
                locale={localeObj}
                isAdmin={isAdmin}
                conflicts={conflicts}
                conflictMessage={conflictMessage}
                isCheckingConflicts={isCheckingConflicts}
                conflictError={conflictError}
                onViewInCalendar={handleViewInCalendar}
                onSuggestAlternatives={handleSuggestAlternatives}
                onDismissConflict={handleDismissConflict}
                allowForceSave={allowForceSave}
                onForceSave={handleForceSave}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[500px] w-full">
              <EventPreviewCalendar
                watchedValues={watchedValues}
                locale={localeObj}
                timeFormat={timeFormat}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-2">
          <FormFooter
            onCancel={handleCancel}
            onSave={form.handleSubmit(handleSubmit)}
            isSubmitting={isSubmitting}
            hasConflict={hasConflict}
            conflictMessage={conflictMessage}
            isCheckingConflicts={isCheckingConflicts}
            allowForceSave={allowForceSave}
            onForceSave={handleForceSave}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
