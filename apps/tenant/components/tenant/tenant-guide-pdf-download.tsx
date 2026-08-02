'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TENANT_APP_GUIDE_PDF_FILENAME, TENANT_APP_GUIDE_PDF_HREF } from '@/constants/tenant-app-guide';
import { cn } from '@/lib/utils';

export function TenantGuidePdfDownload({
  className,
  variant = 'outline',
  fullWidth = false,
}: {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  fullWidth?: boolean;
}) {
  return (
    <Button
      asChild
      variant={variant}
      className={cn(fullWidth && 'w-full', className)}
    >
      <a href={TENANT_APP_GUIDE_PDF_HREF} download={TENANT_APP_GUIDE_PDF_FILENAME}>
        <Download className="size-4" />
        Download PDF guide
      </a>
    </Button>
  );
}
