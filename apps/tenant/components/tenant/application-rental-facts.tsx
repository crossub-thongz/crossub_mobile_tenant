import { formatCurrency } from '@/lib/utils';
import type { ListingProperty } from '@/lib/types';

export function ApplicationRentalFacts({ property }: { property: ListingProperty }) {
  const rent =
    property.rentWeekly != null && property.rentWeekly > 0
      ? `${formatCurrency(property.rentWeekly)}/week`
      : 'On application';

  const facts = [
    { label: 'Rent', value: rent },
    {
      label: 'Available from',
      value: property.availableFrom && property.availableFrom !== 'TBC' ? property.availableFrom : 'TBC',
    },
    { label: 'Lease term', value: property.leaseTerm?.trim() || 'TBC' },
  ];

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Application details</h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Rental terms for this listing — the same details your agent set for the open inspection.
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
            <dt className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
              {fact.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
