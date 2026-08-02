import { buildTenantAppGuidePdf } from '@/lib/server/tenant-app-guide-pdf';
import { TENANT_APP_GUIDE_PDF_FILENAME } from '@/constants/tenant-app-guide';

export const runtime = 'nodejs';

export async function GET() {
  const pdf = await buildTenantAppGuidePdf();

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${TENANT_APP_GUIDE_PDF_FILENAME}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
