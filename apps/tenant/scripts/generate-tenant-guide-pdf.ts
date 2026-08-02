import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { buildTenantAppGuidePdf } from '../lib/server/tenant-app-guide-pdf';
import { TENANT_APP_GUIDE_PDF_FILENAME } from '../constants/tenant-app-guide';

async function main() {
  const pdf = await buildTenantAppGuidePdf();
  const outPath = join(process.cwd(), 'public', TENANT_APP_GUIDE_PDF_FILENAME);
  await writeFile(outPath, pdf);
  console.log(`Wrote ${outPath} (${pdf.byteLength} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
