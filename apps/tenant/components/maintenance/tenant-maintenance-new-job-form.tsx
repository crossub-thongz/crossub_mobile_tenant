'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  MaintenanceNewJobFormFields,
  type MaintenanceJobPriority,
} from '@/components/maintenance/maintenance-new-job-form-fields';
import { Button } from '@/components/ui/button';
import {
  formatMaintenanceIssueType,
  isMaintenanceIssueTypeValid,
} from '@/constants/maintenance-issue-types';
import {
  fetchTenantProperties,
  submitMaintenanceRequest as apiSubmitMaintenanceRequest,
} from '@/lib/crossub-api/tenant-account-client';
import { ROUTES } from '@/constants/routes';

export function TenantMaintenanceNewJobForm() {
  const router = useRouter();
  const { addRepair, lease, refresh } = useTenantData();

  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState<string | undefined>(lease?.propertyId);
  const [propertyAddress, setPropertyAddress] = useState(lease?.propertyAddress ?? '');
  const [propertyOptions, setPropertyOptions] = useState<
    { id: string; address: string }[]
  >([]);

  const [issueTypeSelection, setIssueTypeSelection] = useState('');
  const [issueTypeOther, setIssueTypeOther] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceJobPriority>('normal');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  useEffect(() => {
    if (lease?.propertyId) setPropertyId(lease.propertyId);
    if (lease?.propertyAddress) setPropertyAddress(lease.propertyAddress);
  }, [lease?.propertyId, lease?.propertyAddress]);

  useEffect(() => {
    let cancelled = false;
    void fetchTenantProperties()
      .then((items) => {
        if (cancelled) return;
        const options = items
          .map((p) => ({
            id: p.id,
            address: [p.address, p.suburb].filter(Boolean).join(', ') || 'Your property',
          }))
          .filter((p) => p.id);
        setPropertyOptions(options);
        if (options.length === 1 && !propertyId) {
          setPropertyId(options[0].id);
          setPropertyAddress(options[0].address);
        }
      })
      .catch(() => {
        /* lease fallback is enough for single-tenancy */
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const issueTypeValid = useMemo(
    () => isMaintenanceIssueTypeValid(issueTypeSelection, issueTypeOther),
    [issueTypeSelection, issueTypeOther],
  );

  const canSubmit =
    !submitting &&
    issueTypeValid &&
    description.trim().length >= 5 &&
    Boolean(propertyAddress.trim());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issueType = formatMaintenanceIssueType(issueTypeSelection, issueTypeOther);
    if (!isMaintenanceIssueTypeValid(issueTypeSelection, issueTypeOther)) {
      toast.error('Issue type is required');
      return;
    }
    const body = description.trim();
    if (body.length < 5) {
      toast.error('Description must be at least 5 characters');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiSubmitMaintenanceRequest({
        category: issueType,
        description: `${issueType}: ${body}`,
        urgent: priority === 'urgent',
        ...(propertyId ? { propertyId } : {}),
        ...(mediaUrls.length ? { photos: mediaUrls } : {}),
        clientRequestId: crypto.randomUUID(),
      });
      const item = addRepair({
        category: issueType,
        description: body,
        area: '',
        urgency: priority === 'urgent' ? 'urgent' : 'normal',
        propertyAddress,
        id: created.id,
        trackingNumber:
          typeof created.orderNumber === 'string' ? created.orderNumber : undefined,
        photos: mediaUrls,
      });
      toast.success('Maintenance job logged', {
        description: `Tracking ${item.trackingNumber} — saved to your list.`,
      });
      void refresh();
      router.push(ROUTES.REPAIRS);
    } catch {
      toast.error('Unable to submit repair request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {propertyOptions.length > 1 ? (
        <div className="space-y-1.5">
          <label htmlFor="tenant-mj-property" className="text-xs font-medium">
            Property *
          </label>
          <select
            id="tenant-mj-property"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={propertyId ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              setPropertyId(id);
              const match = propertyOptions.find((p) => p.id === id);
              if (match) setPropertyAddress(match.address);
            }}
            disabled={submitting}
          >
            <option value="">Select property</option>
            {propertyOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <MaintenanceNewJobFormFields
        address={propertyAddress}
        issueTypeSelection={issueTypeSelection}
        issueTypeOther={issueTypeOther}
        onIssueTypeSelectionChange={setIssueTypeSelection}
        onIssueTypeOtherChange={setIssueTypeOther}
        description={description}
        onDescriptionChange={setDescription}
        priority={priority}
        onPriorityChange={setPriority}
        mediaUrls={mediaUrls}
        onMediaUrlsChange={setMediaUrls}
        disabled={submitting}
      />

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {submitting ? 'Submitting…' : 'Submit request'}
      </Button>
    </form>
  );
}
