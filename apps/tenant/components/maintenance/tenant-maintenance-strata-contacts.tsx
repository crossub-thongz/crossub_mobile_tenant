import { Mail, Phone } from 'lucide-react';

import { InfoCard } from '@/components/tenant/info-card';
import type { MaintenancePropertyContact } from '@/lib/types';

function ContactLinks({ contact }: { contact: MaintenancePropertyContact }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      {contact.phone ? (
        <a
          href={`tel:${contact.phone.replace(/\s/g, '')}`}
          className="text-primary inline-flex items-center gap-2 font-medium"
        >
          <Phone className="size-4" />
          {contact.phone}
        </a>
      ) : null}
      {contact.email ? (
        <a
          href={`mailto:${contact.email}`}
          className="text-primary inline-flex items-center gap-2 font-medium"
        >
          <Mail className="size-4" />
          {contact.email}
        </a>
      ) : null}
    </div>
  );
}

export function TenantMaintenanceStrataContacts({
  buildingManager,
  strataContact,
  strataPlanNumber,
  buildingName,
}: {
  buildingManager?: MaintenancePropertyContact;
  strataContact?: MaintenancePropertyContact;
  strataPlanNumber?: string | null;
  buildingName?: string | null;
}) {
  const strataMeta = [
    buildingName?.trim(),
    strataPlanNumber?.trim() ? `Plan ${strataPlanNumber.trim()}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-3">
      <InfoCard label="Building manager">
        {buildingManager?.name ? (
          <>
            <p className="font-semibold">{buildingManager.name}</p>
            <ContactLinks contact={buildingManager} />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No building manager contact is recorded for this property.
          </p>
        )}
      </InfoCard>

      <InfoCard label="Strata contact">
        {strataContact?.name ? (
          <>
            <p className="font-semibold">{strataContact.name}</p>
            {strataMeta ? (
              <p className="text-muted-foreground mt-1 text-xs">{strataMeta}</p>
            ) : null}
            <ContactLinks contact={strataContact} />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No strata contact is recorded for this property.
          </p>
        )}
      </InfoCard>
    </div>
  );
}
