import { useState, useCallback, useRef } from 'react';
import { ConflictCheckResult, createEventSchema } from '@/lib/validations';
import { checkEventConflicts } from '@/app/actions';
import { z } from 'zod';

type EventFormData = z.infer<typeof createEventSchema>;

interface UseConflictDetectionOptions {
  delay?: number;
  excludeEventId?: string;
  enabled?: boolean;
  onError?: (error: string) => void;
  maxRetries?: number;
}

export function useConflictDetection(
  eventData: EventFormData | null,
  options: UseConflictDetectionOptions = {},
) {
  const { excludeEventId, enabled = true, onError, maxRetries = 3 } = options;

  const [conflictResult, setConflictResult] = useState<ConflictCheckResult>({
    hasConflict: false,
    conflicts: [],
  });

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use useRef to track retry attempts without causing re-renders
  const retryAttemptRef = useRef(0);

  // Add debug logging to track API calls
  const checkCountRef = useRef(0);
  const lastCheckDataRef = useRef<string | null>(null);

  // Rate limiting: prevent more than 10 checks in 60 seconds
  const checkTimestampsRef = useRef<number[]>([]);
  const MAX_CHECKS_PER_MINUTE = 10;
  const RATE_LIMIT_WINDOW = 60000; // 60 seconds

  const checkConflicts = useCallback(
    async (data: EventFormData | null) => {
      if (!data || !enabled) {
        setConflictResult({ hasConflict: false, conflicts: [] });
        setError(null);
        return;
      }

      // Rate limiting check
      const now = Date.now();
      const recentChecks = checkTimestampsRef.current.filter(
        (timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
      );

      if (recentChecks.length >= MAX_CHECKS_PER_MINUTE) {
        console.warn('[ConflictCheck] Rate limit exceeded. Skipping check.');
        setError('Too many conflict checks. Please wait a moment.');
        return;
      }

      // Add current timestamp
      checkTimestampsRef.current = [...recentChecks, now];

      // DEBUG: Log conflict check attempts
      checkCountRef.current += 1;
      const dataHash = JSON.stringify(data);
      console.log(`[ConflictCheck] Attempt #${checkCountRef.current}`, {
        dataChanged: lastCheckDataRef.current !== dataHash,
        retryAttempt: retryAttemptRef.current,
        enabled,
        rateLimited: recentChecks.length >= MAX_CHECKS_PER_MINUTE,
        data: {
          title: data.title,
          location: data.location,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      });
      lastCheckDataRef.current = dataHash;

      setIsChecking(true);
      setError(null);

      try {
        // Validate the data first
        const validationResult = createEventSchema.safeParse(data);

        if (!validationResult.success) {
          // Don't check conflicts if basic validation fails
          setConflictResult({ hasConflict: false, conflicts: [] });
          setError(null);
          return;
        }

        console.log(
          '[ConflictCheck] Calling checkEventConflicts with:',
          validationResult.data,
        );
        const result = await checkEventConflicts(
          validationResult.data,
          excludeEventId,
        );

        console.log('[ConflictCheck] Server response received:', {
          hasConflict: result.hasConflict,
          conflictsCount: result.conflicts?.length || 0,
          message: result.message,
          fullResult: result,
        });

        setConflictResult(result);
        setRetryCount(0); // Reset retry count on success
        retryAttemptRef.current = 0; // Reset ref counter
      } catch (err) {
        console.error('Error checking conflicts:', err);

        let errorMessage = 'Unable to check for conflicts';

        if (err instanceof Error) {
          if (err.name === 'TypeError' && err.message.includes('fetch')) {
            errorMessage =
              'Network error: Unable to connect to conflict checking service';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'Conflict check timed out. Please try again.';
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setConflictResult({ hasConflict: false, conflicts: [] });

        // Call optional error callback
        if (onError) {
          onError(errorMessage);
        }

        // Improved retry logic to prevent infinite loops
        if (
          retryAttemptRef.current < maxRetries &&
          errorMessage.includes('Network error')
        ) {
          const currentAttempt = retryAttemptRef.current + 1;
          retryAttemptRef.current = currentAttempt;
          setRetryCount(currentAttempt);

          console.log(
            `Retrying conflict check (attempt ${currentAttempt}/${maxRetries})`,
          );

          // Retry after a delay with exponential backoff
          setTimeout(() => {
            checkConflicts(data);
          }, 1000 * currentAttempt);
        }
      } finally {
        setIsChecking(false);
      }
    },
    [excludeEventId, enabled, onError, maxRetries], // Removed retryCount from dependencies
  );

  // Manual conflict check function - no automatic triggering
  const manualCheckConflicts = useCallback(async () => {
    await checkConflicts(eventData);
  }, [eventData, checkConflicts]);

  const clearConflicts = useCallback(() => {
    setConflictResult({ hasConflict: false, conflicts: [] });
    setError(null);
    setRetryCount(0);
    retryAttemptRef.current = 0;
    checkCountRef.current = 0;
    lastCheckDataRef.current = null;
    checkTimestampsRef.current = [];
  }, []);

  const retryConflictCheck = useCallback(() => {
    setRetryCount(0);
    retryAttemptRef.current = 0;
    checkCountRef.current = 0;
    checkTimestampsRef.current = [];
    checkConflicts(eventData);
  }, [eventData, checkConflicts]);

  return {
    hasConflict: conflictResult.hasConflict,
    conflicts: conflictResult.conflicts,
    message: conflictResult.message,
    isChecking,
    error,
    clearConflicts,
    retryConflictCheck,
    retryCount,
    checkConflicts: manualCheckConflicts, // Expose manual check function
  };
}

// Hook for form field-specific conflict checking
export function useFieldConflictDetection(
  fieldValue: string | Date | undefined,
  // fieldName: keyof EventFormData,
  otherFields: Partial<EventFormData>,
  options: UseConflictDetectionOptions = {},
) {
  const [eventData, setEventData] = useState<EventFormData | null>(null);

  // Only create event data when we have enough information for conflict checking
  if (
    fieldValue &&
    otherFields.startDate &&
    otherFields.endDate &&
    otherFields.startTime &&
    otherFields.endTime &&
    otherFields.location
  ) {
    const formData: EventFormData = {
      title: otherFields.title || 'Untitled Event',
      description: otherFields.description || '',
      startDate: otherFields.startDate,
      endDate: otherFields.endDate,
      startTime: otherFields.startTime,
      endTime: otherFields.endTime,
      location: otherFields.location,
      category: otherFields.category || 'General',
      color: otherFields.color || 'blue',
      isRepeating: otherFields.isRepeating || false,
      repeatingType: otherFields.repeatingType,
    };

    setEventData(formData);
  } else {
    setEventData(null);
  }

  return useConflictDetection(eventData, { ...options, enabled: false }); // Disable automatic checking
}
