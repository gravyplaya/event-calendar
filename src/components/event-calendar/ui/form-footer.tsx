import { Button } from '@/components/ui/button';
import { Save, X, AlertTriangle } from 'lucide-react';

type FormFooterProps = {
  onCancel: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  cancelText?: string;
  saveText?: string;
  savingText?: string;
  hasConflict?: boolean;
  conflictMessage?: string;
  isCheckingConflicts?: boolean;
  allowForceSave?: boolean;
  onForceSave?: () => void;
};

export const FormFooter = ({
  onCancel,
  onSave,
  isSubmitting,
  cancelText = 'Cancel',
  saveText = 'Save',
  savingText = 'Saving...',
  hasConflict = false,
  conflictMessage,
  isCheckingConflicts = false,
  allowForceSave = false,
  onForceSave,
}: FormFooterProps) => {
  const isSaveDisabled = isSubmitting || isCheckingConflicts;

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Conflict Status Indicator (advisory only — Save is still enabled) */}
      {hasConflict && !isCheckingConflicts && (
        <div className="mr-auto flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">
            {conflictMessage || 'Overlapping events at this location'}
          </span>
        </div>
      )}

      {isCheckingConflicts && (
        <div className="text-muted-foreground mr-auto flex items-center gap-2 text-sm">
          <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
          <span className="hidden sm:inline">Checking for conflicts...</span>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="cursor-pointer"
      >
        <X className="h-4 w-4" />
        {cancelText}
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSave}
          className="cursor-pointer"
          disabled={isSaveDisabled}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? savingText : saveText}
        </Button>

        {allowForceSave && hasConflict && onForceSave && (
          <Button
            onClick={onForceSave}
            variant="destructive"
            className="cursor-pointer"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            Force Save
          </Button>
        )}
      </div>
    </div>
  );
};
