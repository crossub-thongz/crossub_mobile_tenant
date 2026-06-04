import { type NextRequest, NextResponse } from 'next/server';

import { buildDemoPdf } from '@/lib/generate-demo-pdf';
import { getTenantDocument } from '@/lib/tenant-documents';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const doc = getTenantDocument(id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const pdf = buildDemoPdf(doc.title, doc.lines);
  const download = req.nextUrl.searchParams.get('download') === '1';
  const filename = doc.name.replace(/[^\w.\- ]+/g, '_');

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': download
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`,
    },
  });
}
