'use client';

import { MaintenanceIssueTypeField } from '@/components/maintenance/maintenance-issue-type-field';
import { MaintenanceMediaUploadField } from '@/components/maintenance/maintenance-media-upload-field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isTenantUrgentEligibleMaintenanceIssueType } from '@/constants/maintenance-issue-types';
import { cn } from '@/lib/utils';

export type MaintenanceJobPriority = 'urgent' | 'normal';

export function MaintenanceNewJobFormFields({
  address,
  issueTypeSelection,
  issueTypeOther,
  onIssueTypeSelectionChange,
  onIssueTypeOtherChange,
  description,
  onDescriptionChange,
  priority,
  onPriorityChange,
  mediaUrls,
  onMediaUrlsChange,
  disabled = false,
}: {
  address: string;
  issueTypeSelection: string;
  issueTypeOther: string;
  onIssueTypeSelectionChange: (value: string) => void;
  onIssueTypeOtherChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  priority: MaintenanceJobPriority;
  onPriorityChange: (value: MaintenanceJobPriority) => void;
  mediaUrls: string[];
  onMediaUrlsChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const urgentAllowed = isTenantUrgentEligibleMaintenanceIssueType(issueTypeSelection);
  const priorityOptions: MaintenanceJobPriority[] = urgentAllowed
    ? ['urgent', 'normal']
    : ['normal'];

  return (
    <div className="space-y-4">
      {address ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            Address
          </p>
          <p className="bg-muted/40 rounded-md px-3 py-2 text-sm">{address}</p>
        </div>
      ) : null}

      <MaintenanceIssueTypeField
        id="tenant-mj-issue"
        selection={issueTypeSelection}
        otherDetail={issueTypeOther}
        onSelectionChange={onIssueTypeSelectionChange}
        onOtherDetailChange={onIssueTypeOtherChange}
        disabled={disabled}
      />

      <div className="space-y-1.5">
        <Label htmlFor="tenant-mj-desc" className="text-xs">
          Description *
        </Label>
        <Textarea
          id="tenant-mj-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="What's happening? Any constraints or notes?"
          disabled={disabled}
        />
      </div>

      <MaintenanceMediaUploadField
        photos={mediaUrls}
        onPhotosChange={onMediaUrlsChange}
        disabled={disabled}
      />

      <div>
        <Label className="text-xs">Urgency</Label>
        <div className="mt-2 flex gap-2">
          {priorityOptions.map((level) => (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onPriorityChange(level)}
              className={cn(
                'rounded-md border px-4 py-1.5 text-xs font-medium capitalize transition-colors',
                priority === level
                  ? level === 'urgent'
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary',
                disabled && 'opacity-50',
              )}
            >
              {level}
            </button>
          ))}
        </div>
        {issueTypeSelection && !urgentAllowed ? (
          <p className="text-muted-foreground mt-1.5 text-[11px] leading-snug">
            Urgent is only available for flooding and water damage, locksmith, electrical,
            and hot water system repairs.
          </p>
        ) : null}
      </div>
    </div>
  );
}
